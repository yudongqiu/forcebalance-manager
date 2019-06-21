import React from "react";
import PropTypes from 'prop-types';
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Grid from "@material-ui/core/Grid";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
// core components
import GridItem from "components/Grid/GridItem.jsx";
import HintButton from "components/CustomButtons/HintButton.jsx";
// Models
import api from "../../api";
import { RunningStatus } from "../../constants";

const styles = {
  title: {
    marginBottom: 16,
    fontSize: 14,
  },
};

class OptimizerInput extends React.Component {
  // the default options are on the backend when project is created
  state = {
    jobtype: 'NEWTON',
    maxstep: 10,
    penalty_type: 'L2',
    convergence_objective: 0.0001,
    convergence_step: 0.0001,
    convergence_gradient: 0.001,
    trust0: 0.1,
    finite_difference_h: 0.001,
    asynchronous: false,
    wq_port: 0,
    wqStatus: {code: 'not_connected'},
  }

  componentDidMount() {
    api.onChangeProjectName(this.update);
    this.update();
  }

  componentWillUnmount() {
    api.removeOnChangeProjectName(this.update);
  }

  update = () => {
    api.getOptimizerOptions(this.updateOptimizerOptions);
    api.getWorkQueueStatus(this.updateWorkQueueStatus);
  }

  updateOptimizerOptions = (data) => {
    if (data) {
      this.setState(data);
    }
  }

  updateWorkQueueStatus = (data) => {
    this.setState({
      wqStatus: data,
    })
  }

  handleSetOption = event => {
    const update = { [event.target.name]: event.target.value };
    api.setOptimizerOptions(update);
    this.setState(update);
  }

  handleCheckAync = (event) => {
    const update = { asynchronous: event.target.checked };
    api.setOptimizerOptions(update);
    this.setState(update);
  }

  render () {
    const { classes } = this.props;
    const { jobtype, maxstep, penalty_type, convergence_objective, convergence_step,
      convergence_gradient, trust0, finite_difference_h, asynchronous, wq_port, wqStatus } = this.state;

    return (
      <Card>
        <CardContent>
          <div className={classes.title}>Choose optimizer options</div>
          <Grid container>
            <GridItem xs={4} sm={4} md={4}>
              <FormControl fullWidth margin='normal'>
                <InputLabel htmlFor="job-type">Job Type</InputLabel>
                <Select
                  value={jobtype}
                  onChange={this.handleSetOption}
                  input={<Input name="jobtype" id="job-type" />}
                >
                  <MenuItem value={"OPTIMIZE"}>Optimize</MenuItem>
                  <MenuItem value={"SINGLE"}>Single</MenuItem>
                  <MenuItem value={"GRADIENT"}>Gradient</MenuItem>
                </Select>
              </FormControl>
            </GridItem>
            <GridItem xs={4} sm={4} md={4}>
              <TextField
                name="maxstep"
                type="number"
                label="Max Steps"
                onChange={this.handleSetOption}
                value={maxstep}
                error={maxstep <= 0}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                margin='normal'
              />
            </GridItem>
            <GridItem xs={4} sm={4} md={4}>
              <FormControl fullWidth margin='normal'>
                <InputLabel htmlFor="penalty-type" shrink>Penalty Type</InputLabel>
                <Select
                  value={penalty_type}
                  onChange={this.handleSetOption}
                  input={<Input name="penalty_type" id="penalty-type" />}
                >
                  <MenuItem value={"L1"}>L1</MenuItem>
                  <MenuItem value={"L2"}>L2</MenuItem>
                </Select>
              </FormControl>
            </GridItem>
            <GridItem xs={4} sm={4} md={4}>
              <TextField
                name="convergence_objective"
                type="number"
                label="Convergence Objective"
                onChange={this.handleSetOption}
                value={convergence_objective}
                error={convergence_objective <= 0}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                margin='normal'
              />
            </GridItem>
            <GridItem xs={4} sm={4} md={4}>
              <TextField
                name="convergence_step"
                type="number"
                label="Convergence Step"
                onChange={this.handleSetOption}
                value={convergence_step}
                error={convergence_step <= 0}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                margin='normal'
              />
            </GridItem>
            <GridItem xs={4} sm={4} md={4}>
              <TextField
                name="convergence_gradient"
                type="number"
                label="Convergence Gradient"
                onChange={this.handleSetOption}
                value={convergence_gradient}
                error={convergence_gradient <= 0}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                margin='normal'
              />
            </GridItem>
            <GridItem xs={4} sm={4} md={4}>
              <TextField
                name="trust0"
                type="number"
                label="Trust Radius"
                onChange={this.handleSetOption}
                value={trust0}
                error={isNaN(trust0)}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                margin='normal'
              />
            </GridItem>
            <GridItem xs={4} sm={4} md={4}>
              <TextField
                name="finite_difference_h"
                type="number"
                label="Finite Difference Step Size"
                onChange={this.handleSetOption}
                value={finite_difference_h}
                error={finite_difference_h <= 0}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                margin='normal'
              />
            </GridItem>
          </Grid>
        </CardContent>
        <CardContent>
          <Grid container>
            <GridItem xs={4} sm={4} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={asynchronous}
                    onChange={this.handleCheckAync}
                    color="primary"
                    disabled={wqStatus.code !== 'ready'}
                  />
                }
                label="Enable Async Target Evaluation"
              />
              <HintButton hint='See Work Queue page for more info' />
            </GridItem>
            <GridItem xs={4} sm={4} md={4}>
              <TextField
                name="wq_port"
                type="number"
                label="Work Queue Port"
                onChange={this.handleSetOption}
                value={wq_port}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                margin='normal'
                disabled={!asynchronous}
                error={wq_port <= 0 && asynchronous}
              />
            </GridItem>
          </Grid>
        </CardContent>
      </Card>
    );
  }
}

OptimizerInput.propTypes = {
  classes: PropTypes.object.isRequired,
  status: PropTypes.number,
};

export default withStyles(styles)(OptimizerInput);