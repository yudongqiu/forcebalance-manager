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
      text: 'project1',
      projectNames: [],
    }
  }

  componentDidMount() {
    api.listProjects((projects) => {
      this.setState({
        projectNames: projects.map(p => {return p.projectName})
      })
    });
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
    this.setState({
      projectNames: this.state.projectNames.concat([this.state.text]),
    })
    this.props.onClose();
  };

  render () {
    const { text, projectNames } = this.state;
    const projectExists = (projectNames.indexOf(text) !== -1);
    return (
      <Dialog
        open={this.props.open}
        onClose={this.props.onClose}
      >
        <DialogTitle id="form-dialog-title">Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Project Name"
            fullWidth
            value={text}
            onChange={this.handleChange}
            error={projectExists}
            helperText={projectExists ? "Project Exists": 'Project name available'}
            style={{width: 500}}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={this.props.onClose} >
            Cancel
          </Button>
          <Button onClick={this.handleCreateProject} disabled={projectExists} >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}