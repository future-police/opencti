import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import IconButton from '@material-ui/core/IconButton';
import CheckCircle from '@material-ui/icons/CheckCircle';
import Close from '@material-ui/icons/Close';
import { compose, head } from 'ramda';
import { MESSAGING$ } from '../relay/environment';
import inject18n from './i18n';

const styles = theme => ({
  message: {
    display: 'flex',
    alignItems: 'center',
  },
  messageIcon: {
    marginRight: theme.spacing.unit,
  },
});

class Message extends Component {
  constructor(props) {
    super(props);
    this.state = { open: false, message: '' };
  }

  componentDidMount() {
    MESSAGING$.errors.subscribe({
      next: (errors) => {
        const message = this.props.t(head(errors).message);
        this.setState({ open: true, message });
      },
    });
  }

  // eslint-disable-next-line
  componentWillUnmount() {
    MESSAGING$.errors.unsubscribe();
  }

  handleCloseMessage(event, reason) {
    if (reason === 'clickaway') return;
    this.setState({ open: false });
  }

  render() {
    const { classes } = this.props;
    return (
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={this.state.open}
        onClose={this.handleCloseMessage.bind(this)}
        autoHideDuration={3000}>
        <SnackbarContent
          message={
            <span className={classes.message}>
              <CheckCircle className={classes.messageIcon}/>
              {this.state.message}
            </span>
          }
          action={[
            <IconButton key='close' aria-label='Close' color='inherit'
              onClick={this.handleCloseMessage.bind(this)}>
              <Close/>
            </IconButton>,
          ]}
        />
      </Snackbar>
    );
  }
}

Message.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool,
  t: PropTypes.func,
  handleClose: PropTypes.func,
  message: PropTypes.string,
};

export default compose(
  inject18n,
  withStyles(styles),
)(Message);
