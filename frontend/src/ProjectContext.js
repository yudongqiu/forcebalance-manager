import React from "react";

const ProjectContext = React.createContext({
  project: {name: null, status: null},
  changeProject: (project) => {
    this.setState({project: project})
  }
});

export default ProjectContext;