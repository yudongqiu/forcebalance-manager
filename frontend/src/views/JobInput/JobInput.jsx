import React from "react";
import PropTypes from 'prop-types';
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepButton from '@material-ui/core/StepButton';
import StepContent from '@material-ui/core/StepContent';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
// core components
import FFInput from "./FFInput";
import TargetInput from "./TargetInput";
import OptimizerInput from "./OptimizerInput";
// models
import api from "../../api";
import { RunningStatus } from "../../constants";

const styles = {
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  formControl: {
    paddingBottom: "10px",
    margin: "27px 0 0 0",
    position: "relative"
  },
  labelRoot: {
    color: "#999999",
    fontWeight: "400",
    fontSize: "16px",
    whiteSpace: "nowrap",
    lineHeight: "1.42857"
  },
  cardCategoryWhite: {
    color: "rgba(255,255,255,.62)",
    margin: "0",
    fontSize: "14px",
    marginTop: "0",
    marginBottom: "0"
  },
  cardTitleWhite: {
    color: "#FFFFFF",
    marginTop: "0px",
    minHeight: "auto",
    fontWeight: "300",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    marginBottom: "3px",
    textDecoration: "none"
  }
};

class JobInput extends React.Component {
  state = {
    activeStep: 0,
    completed: {},
    dialogOpen: false,
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

  update = () => {
    api.getInputParams(this.updateParams);
  }

  updateParams = (data) => {
    this.setState(data);
  }

  updateStatus = (data) => {
    this.setState({
      status: data.status
    });
  }

  resetOptimizer = () => {
    api.resetOptimizer();
  }

  launchOptimizer = () => {
    this.setState({
      status: RunningStatus.running,
    })
    api.launchOptimizer();
  }

  handleStep = step => () => {
    this.setState({
      activeStep: step,
    });
  };

  isStepComplete(step) {
    return this.state.completed.has(step);
  }

  handleOpenDialog = () => {
    this.setState({
      dialogOpen: true,
    })
  }

  handleCloseDialog = () => {
    this.setState({
      dialogOpen: false,
    })
  }

  handleConfirmDialog = () => {
    this.launchOptimizer();
    this.handleCloseDialog();
  }

  render () {
    if (api.projectName === null) {
      return (<div>
        No project exists. Please click "Create Project".
      </div>)
    }
    const { activeStep, status, dialogOpen } = this.state;
    const { classes } = this.props;
    return (
      <div>
        <Stepper activeStep={activeStep} orientation="vertical">
          <Step>
            <StepButton
              onClick={this.handleStep(0)}
            >
              Input ForceField
            </StepButton>
            <StepContent>
              <FFInput status={status} />
            </StepContent>
          </Step>
          <Step>
            <StepButton
              onClick={this.handleStep(1)}
              disabled={false}
            >
              Targets
            </StepButton>
            <StepContent>
              <TargetInput status={status} />
            </StepContent>
          </Step>
          <Step>
            <StepButton
              onClick={this.handleStep(2)}
              disabled={false}
            >
              Optimizer
            </StepButton>
            <StepContent>
              <OptimizerInput status={status} />
            </StepContent>
          </Step>
        </Stepper>
        <Button
          variant="contained"
          color='primary'
          onClick={status === RunningStatus.idle ? this.launchOptimizer : this.handleOpenDialog}
          disabled={status === RunningStatus.running}
        >
          Launch Optimizer
        </Button>
        <Dialog
          open={dialogOpen}
          onClose={this.handleCloseDialog}
        >
          <DialogTitle>{"Rerun the optimizer?"}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              A previous optimization exists. Rerun the optimizer will overwrite the previous results.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleCloseDialog} color="primary" autoFocus>
              Cancel
            </Button>
            <Button onClick={this.handleConfirmDialog} color="primary">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

JobInput.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(JobInput);
