import React from "react";

import Button from "components/CustomButtons/Button.jsx";

import api from "../../api";

class ProjectSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      projectNames: [],
      projectValue: 0
    }
  }

  updateProjectValue = (value) => {
    this.setState({
      projectValue: value
    });
  }

  componentDidMount() {
    api.register('update_status', this.updateStatus);
    api.pullStatus();
  }

  render() {
    const status = this.state.status;
    let statusButton = (<div />);
    if (status === RunningStatus.idle) {
      statusButton = (
        <Button color="white" round> Idle </Button>
      )
    } else if (status === RunningStatus.running) {
      statusButton = (
        <Button color="info" round>Running</Button>
      )
    } else if (status === RunningStatus.finished) {
      statusButton = (
        <Button color="success" round>Finished</Button>
      )
    } else if (status === RunningStatus.error) {
      statusButton = (
        <Button color="danger" round>Error</Button>
      )
    } else if (status === RunningStatus.noConnection) {
      statusButton = (
        <Button color="primary" round>No connection</Button>
      )
    }

    return statusButton;
  }

}

export default ProjectSelector;