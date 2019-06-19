import React from "react";
import PropTypes from 'prop-types';
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
// core components
import GridItem from "components/Grid/GridItem.jsx";
import EnhancedTable from "components/Table/EnhancedTable.jsx";
// models
import api from "../../api";
import { RunningStatus } from "../../constants";
import { Paper } from "@material-ui/core";

const styles = {
  wrap: {
    width: '100%',
    overflow: 'auto',
  },
  leftPanel: {
    float: "left",
    width: "15%",
    paddingTop: "5vh",
  },
  rightPanel: {
    float: 'right',
    width: "85%",
    maxWidth: "85%",
  },
  iterButton: {
    padding: "15px",
  },
  title: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    paddingBottom: "20px",
    fontSize: "30px",
  }
}

class WorkQueue extends React.Component {
  state = {
    wqStatus: { code: 'not_connected', description: 'server not connected' }
  }

  update = () => {
    api.getWorkQueueStatus(this.updateWorkQueueStatus);
  }

  updateStatus = (data) => {
    this.setState({
      status: data.status
    });
  }

  updateWorkQueueStatus = (data) => {
    this.setState({
      wqStatus: data,
    })
  }

  componentDidMount() {
    api.onChangeProjectName(this.update);
    this.update();
    api.register('update_status', this.updateStatus);
    api.pullStatus();
  }

  componentWillUnmount() {
    api.removeOnChangeProjectName(this.update);
    api.unregister('update_status', this.updateStatus);
  }

  render() {
    const { classes } = this.props;
    const { status, wqStatus } = this.state;
    // display ready status if not running
    if (status !== RunningStatus.running) {
      let readyButton = <Button variant="outlined" color="secondary">
        not ready
      </Button>;
      let statusDetails = <div style={{ margin: 10 }}>
        <div >
          Status: {wqStatus.code}
        </div>
        <div>
          Description: {wqStatus.description}
        </div>
        <div>
          Workers: {wqStatus.worker_running}/{wqStatus.worker_total}
        </div>
        <div>
          Jobs: {wqStatus.job_finished}/{wqStatus.job_total}
        </div>
      </div>;
      if (wqStatus && wqStatus.code === 'ready') {
        readyButton = <Button variant="outlined" color="primary">
          ready
        </Button>;
        // statusDetails = null;
      }
      return (
        <div>
          <Paper style={{ padding: 20 }}>
            <div style={{ margin: 10 }}>
              Work Queue system {readyButton}
            </div>

            {statusDetails}
          </Paper>
        </div>
      );
    }
    // display running info
    if (wqStatus.code !== 'running') {
      return(<div>Optimization is running without using Work Queue system</div>)
    }
    return (
      <div>
        some information about running work queue
      </div>
    );

  }

}

WorkQueue.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(WorkQueue);