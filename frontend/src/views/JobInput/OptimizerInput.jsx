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
// core components
import GridItem from "components/Grid/GridItem.jsx";
import CustomInput from "components/CustomInput/CustomInput.jsx";
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
    jobtype: 'single',
  }

  componentDidMount() {
    api.onChangeProjectName(this.update);
    this.update();
  }

  update = () => {
    api.getOptimizerOptions(this.updateOptimizerOptions);
  }

  updateOptimizerOptions = (data) => {
    if (data) {
      this.setState(data);
    }
  }

  handleSetOption = event => {
    const update = { [event.target.name]: event.target.value };
    api.setOptimizerOptions(update);
    this.setState(update);
  }

  render () {
    const { classes } = this.props;
    const { jobtype, maxstep, penalty_type, convergence_objective, convergence_step, convergence_gradient, trust0, finite_difference_h } = this.state;
    const isRunning = (this.props.status === RunningStatus.running);

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
                  <MenuItem value={"NEWTON"}>Optimize</MenuItem>
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
                error={trust0 <= 0}
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
      </Card>
    );
  }
}

OptimizerInput.propTypes = {
  classes: PropTypes.object.isRequired,
  status: PropTypes.number,
};

export default withStyles(styles)(OptimizerInput);