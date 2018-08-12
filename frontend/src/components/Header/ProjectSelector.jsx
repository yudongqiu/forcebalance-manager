import React from "react";

import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Button from "components/CustomButtons/Button.jsx";
import ListSubheader from '@material-ui/core/ListSubheader';

import CreateProjectDialog from "./CreateProjectDialog";
import api from "../../api";

class ProjectSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
      projects: [],
      projectValue: 0,
      DialogOpen: false,
    }
  }


  updateProjects = (projects) => {
    this.setState({
      projects: projects
    });
    const projectValue = projects.map(p => {p.projectName}).indexOf(this.props.projectName);
    if (projectValue > -1) {
      this.setState({
        projectValue: projectValue
      });
    }
  }

  componentDidMount() {
    api.listProjects(this.updateProjects);
  }

  handleClick = (event) => {
    this.setState({
      anchorEl: event.currentTarget
    });
  }

  handleCloseMenu = () => {
    this.setState({
      anchorEl: null,
    });
  }

  handleMenuItemClick = (event, index) => {
    this.setState({
      projectValue: index,
      anchorEl: null,
      projectName: this.state.projects[index],
    });
    const pName = this.state.projects[index].projectName;
    api.setProject(pName);
  }

  handleOpenDialog = () => {
    this.setState({
      DialogOpen: true
    });
  }

  handleCloseDialog = () => {
    this.setState({
      DialogOpen: false
    });
  }

  render() {
    const { projects, projectValue, anchorEl } = this.state;
    if (projects.length === 0) {
      return (
        <span>
          <Button onClick={this.handleOpenDialog}>Create Project</Button>
          <CreateProjectDialog open={this.state.DialogOpen} onClose={this.handleCloseDialog} />
        </span>
      );
    } else {
      return (
        <span>
          <Button onClick={this.handleClick}> {this.props.projectName} </Button>
          <Menu
            id="project-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={this.handleCloseMenu}
          >
            <ListSubheader>Existing Projects</ListSubheader>
            {projects.map((proj, index) => (
              <MenuItem
                key={proj.projectName}
                selected={index === projectValue}
                onClick={(event) => this.handleMenuItemClick(event, index)}
              >
                {proj.projectName}
              </MenuItem>
            ))}
            <ListSubheader>Create New</ListSubheader>
            <MenuItem
              key="Create Project"
              onClick={this.handleOpenDialog}
            >
              Create New Project
            </MenuItem>
          </Menu>
          <CreateProjectDialog open={this.state.DialogOpen} onClose={this.handleCloseDialog} />
        </span>
      );
    }
  }

}

export default ProjectSelector;