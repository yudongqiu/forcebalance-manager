import React from "react";

import Button from "components/CustomButtons/Button.jsx";

import api from "../../api";

const RunningStatus = {
  idle: 0,
  running: 1,
  finished: 2,
  error: 3,
  noConnection: 4,
}

class StatusButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      status: null,
    }
  }

  updateStatus = (data) => {
    this.setState({
      status: data.status,
    });
  }

  componentDidMount() {
    api.register('update_status', this.updateStatus);
    api.pullStatus();
  }

  componentDidUpdate() {
    api.pullStatus();
  }

  render() {
    const status = this.state.status;
    let statusButton = null;
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

export default StatusButton;