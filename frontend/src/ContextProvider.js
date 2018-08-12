import React, { Component } from 'react';
import ProjectContext from './ProjectContext.js';

class ContextProvider extends Component {
  state = {
    project: {name: null, status: null},
    changeProject: (project) => {
      this.setState({project: project})
    }
  }
  render() {
    return (<ProjectContext.Provider value={this.state}>
      {this.props.children}
    </ProjectContext.Provider>);
  }
}

export default ContextProvider;