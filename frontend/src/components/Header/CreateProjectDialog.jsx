import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';

import api from '../../api';

export default class CreateProjectDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: 'New Project',
    }
    this.props = props;
  }

  handleChange = (event) => {
    this.setState({ text: event.target.value });
  };

  handleClose = () => {
    this.setState({
      open: false
    })
  }

  handleCreateProject = () => {
    api.createProject(this.state.text);
    this.props.onClose();
  };

  render () {
    return (
      <Dialog
        open={this.props.open}
        onClose={this.props.onClose}
      >
        <DialogTitle id="form-dialog-title">New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Project Name"
            fullWidth
            value={this.state.text}
            onChange={this.handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={this.props.onClose} >
            Cancel
          </Button>
          <Button onClick={this.handleCreateProject} >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}