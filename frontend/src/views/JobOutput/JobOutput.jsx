import React from "react";
import PropTypes from 'prop-types';
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Paper from '@material-ui/core/Paper';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import StepButton from '@material-ui/core/StepButton';
import StepContent from '@material-ui/core/StepContent';
import Button from '@material-ui/core/Button';
// core components

// models
import api from "../../api";
import { RunningStatus } from "../../constants";

const styles = {
  wrap: {
    width: '100%',
    overflow: 'auto',
  },
  leftPane: {
    float: "left",
    width: "15%",
  },
  rightPane: {
    width: "90%",
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

class JobOutput extends React.Component {
  state = {
    currentIter: 0,
    lastIter: 0,
  }

  handleClickIterButton = (e, iter) => {
    this.setState({
      currentIter: iter,
    });
  }

  updateOptIter = (data) => {
    this.setState({
      lastIter: data.lastIter,
    });
  }

  update = () => {
    api.pullOptIter();
  }

  componentDidMount() {
    this.isCanceled = false;
    api.onChangeProjectName(this.update);
    this.update();
    api.register('update_opt_iter', this.updateOptIter);
  }

  componentWillUnmount() {
    api.removeOnChangeProjectName(this.update);
    api.unregister('update_opt_iter', this.updateOptIter);
  }

  render() {
    const { classes } = this.props;
    const { currentIter, lastIter } = this.state;
    const iterButtons = [];
    for (let i=0; i<lastIter; i++) {
      iterButtons.push(
        <Button key={i}
          onClick={(e) => this.handleClickIterButton(e, i)}
          className={classes.iterButton}
        >
          Iteration {i}
        </Button>
      );
    }
    return (
      <div className={classes.wrap}>
        <div className={classes.leftPane}>
          {iterButtons}
        </div>
        <div className={classes.right}>
          <p className={classes.title}>Iteration {currentIter}</p>
          <p>Optimization running</p>
        </div>
      </div>
    );
  }

}

JobOutput.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(JobOutput);