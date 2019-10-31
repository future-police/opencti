import { map } from 'ramda';
import { loadFile, upload } from '../database/minio';
import { pushToConnector } from '../database/rabbitmq';
import { connectorsForImport } from './connector';
import { createWork, initiateJob } from './work';
import { logger } from '../config/conf';

const uploadJobImport = async (fileId, fileMime) => {
  const connectors = await connectorsForImport(fileMime, true);
  if (connectors.length > 0) {
    // Create job and send ask to broker
    const workList = await Promise.all(
      map(async connector => {
        const work = await createWork(connector, null, fileId);
        const job = await initiateJob(work.id);
        return { connector, job, work };
      }, connectors)
    );
    // Send message to all correct connectors queues
    await Promise.all(
      map(data => {
        const { connector, work, job } = data;
        const message = {
          work_id: work.id, // work(id)
          job_id: job.id, // job(id)
          file_mime: fileMime, // Ex. application/json
          file_path: `/storage/get/${fileId}` // Path to get the file
        };
        return pushToConnector(connector, message);
      }, workList)
    );
  }
};

export const askJobImport = async (filename, user) => {
  logger.debug(`Job > ask import for file ${filename} by ${user.email}`);
  const file = await loadFile(filename);
  await uploadJobImport(file.id, file.metaData.mimetype);
  return file;
};

export const uploadImport = async (file, user) => {
  const up = await upload(user, 'import', file);
  await uploadJobImport(up.id, up.metaData.mimetype);
  return up;
};