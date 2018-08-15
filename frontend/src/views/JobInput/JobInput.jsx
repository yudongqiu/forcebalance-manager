import React from "react";
import PropTypes from 'prop-types';
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Grid from "@material-ui/core/Grid";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
// @material-ui/icons
import FileUpload from "@material-ui/icons/FileUpload";
// core components
import GridItem from "components/Grid/GridItem.jsx";
import CustomInput from "components/CustomInput/CustomInput.jsx";
import Button from "components/CustomButtons/Button.jsx";
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CardFooter from "components/Card/CardFooter.jsx";

import api from "../../api";
import { RunningStatus } from "../../constants";


const styles = {
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  input: {
    display: 'none',
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
    jobType: 'optimize',
    maxStep: 100,
    penType: 'L2',
    convO: 0.0001,
    convS: 0.0001,
    convG: 0.0001,
    trustR: 0.15,
    finiteH: 0.001,
  }

  componentDidMount() {
    api.onChangeProjectName(this.update);
    this.update();
    api.register('update_status', this.updateStatus);
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

  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  }

  selectFile = event => {
    const file = event.target.files[0];
    if (file) {
      this.setState({
        fileName: file.name,
      });
    }
  }

  resetOptimizer = () => {
    api.resetOptimizer();
  }

  launchOptimizer = () => {
    api.launchOptimizer();
  }

  render () {
    if (api.projectName === null) {
      return (<div>
        No project exists. Please click "Create Project".
      </div>)
    }
    const { classes } = this.props;
    const inputForm = (
      <div>
        <Grid container>
            <GridItem xs={12} sm={12} md={5}>
              <CustomInput
                labelText="Input Force Field File"
                id="force-field-file"
                formControlProps={{
                  fullWidth: true
                }}
                inputProps={{
                  value: this.state.fileName,
                  placeholder: "Click Upload Button",
                  endAdornment: (
                    <InputAdornment position="end">
                      <input type="file" id="file-upload" className={classes.input} onChange={this.selectFile} />
                      <label htmlFor="file-upload">
                        <IconButton component="span">
                          <FileUpload />
                        </IconButton>
                      </label>
                    </InputAdornment>
                  ),
                  error: !this.state.fileName
                }}

              />
            </GridItem>
            <GridItem xs={12} sm={12} md={4}>
              <FormControl fullWidth={true} className={classes.formControl} >
                <InputLabel htmlFor="job-type" className={classes.labelRoot} >Job Type</InputLabel>
                <Select
                  value={this.state.jobType}
                  onChange={this.handleChange}
                  input={<Input name="jobType" id="job-type" />}
                >
                  <MenuItem value={"optimize"}>Optimize</MenuItem>
                  <MenuItem value={"single"}>Single</MenuItem>
                  <MenuItem value={"gradient"}>Gradient</MenuItem>
                </Select>
              </FormControl>
            </GridItem>
            <GridItem xs={12} sm={12} md={3}>
              <CustomInput
                labelText="Max Steps"
                id="max-step"
                formControlProps={{
                  fullWidth: true
                }}
                inputProps={{
                  value: this.state.maxStep,
                  name: 'maxStep',
                  onChange: this.handleChange,
                  type: "number",
                  inputProps: {
                    min: 1,
                    step: 1,
                  },
                  error: !(this.state.maxStep > 0)
                }}
                error={!(this.state.maxStep > 0)}
              />
            </GridItem>
            <GridItem xs={12} sm={12} md={3}>
              <FormControl fullWidth={true} className={classes.formControl} >
                <InputLabel htmlFor="penalty-type" className={classes.labelRoot} >Penalty Type</InputLabel>
                <Select
                  value={this.state.penType}
                  onChange={this.handleChange}
                  input={<Input name="penType" id="penalty-type" />}
                >
                  <MenuItem value={"L1"}>L1</MenuItem>
                  <MenuItem value={"L2"}>L2</MenuItem>
                </Select>
              </FormControl>
            </GridItem>
            <GridItem xs={12} sm={12} md={3}>
              <CustomInput
                labelText="Convergence Objective"
                formControlProps={{
                  fullWidth: true
                }}
                inputProps={{
                  value: this.state.convO,
                  name: 'convO',
                  onChange: this.handleChange,
                  type: "number",
                  inputProps: {
                    min: 0,
                    max: 0.01,
                    step: 0.0001,
                  },
                  error: !(this.state.convO > 0)
                }}
                error={!(this.state.convO > 0)}
              />
            </GridItem>
            <GridItem xs={12} sm={12} md={3}>
              <CustomInput
                labelText="Convergence Step"
                formControlProps={{
                  fullWidth: true
                }}
                inputProps={{
                  value: this.state.convS,
                  name: 'convS',
                  onChange: this.handleChange,
                  type: "number",
                  inputProps: {
                    min: 0,
                    max: 0.01,
                    step: 0.0001,
                  },
                  error: !(this.state.convS > 0)
                }}
                error={!(this.state.convS > 0)}
              />
            </GridItem>
            <GridItem xs={12} sm={12} md={3}>
              <CustomInput
                labelText="Convergence Gradient"
                formControlProps={{
                  fullWidth: true
                }}
                inputProps={{
                  value: this.state.convG,
                  name: 'convG',
                  onChange: this.handleChange,
                  type: "number",
                  inputProps: {
                    min: 0,
                    max: 0.01,
                    step: 0.0001,
                  },
                  error: !(this.state.convG > 0)
                }}
                error={!(this.state.convG > 0)}
              />
            </GridItem>
            <GridItem xs={12} sm={12} md={3}>
              <CustomInput
                labelText="Trust Radius"
                formControlProps={{
                  fullWidth: true
                }}
                inputProps={{
                  value: this.state.trustR,
                  name: 'trustR',
                  onChange: this.handleChange,
                  type: "number",
                  inputProps: {
                    min: 0,
                    step: 0.01,
                  },
                  error: !(this.state.trustR > 0)
                }}
                error={!(this.state.trustR > 0)}
                success={(this.state.trustR > 0.1) && (this.state.trustR < 0.2)}
              />
            </GridItem>
            <GridItem xs={12} sm={12} md={3}>
              <CustomInput
                labelText="Finite Difference h"
                formControlProps={{
                  fullWidth: true
                }}
                inputProps={{
                  value: this.state.finiteH,
                  name: "finiteH",
                  onChange: this.handleChange,
                  type: "number",
                  inputProps: {
                    step: 0.001,
                  },
                }}
              />
            </GridItem>
        </Grid>
      </div>
    )
    return (
      <div>
        <Grid container>
          <GridItem xs={12} sm={12} md={8}>
            <Card>
              <CardHeader color="primary">
                <h4 className={classes.cardTitleWhite}>Job Input</h4>
                <p className={classes.cardCategoryWhite}>Water Surface Tension</p>
              </CardHeader>
              <CardBody>
                {inputForm}
              </CardBody>
              <CardFooter>
                <Button color="primary" onClick={this.resetOptimizer}>Reset</Button>
                <Button
                  color="info"
                  onClick={this.launchOptimizer}
                  disabled={this.state.status === RunningStatus.running}
                >Launch Optimizer</Button>
              </CardFooter>
            </Card>
          </GridItem>
        </Grid>
      </div>
    );
  }
}

JobInput.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(JobInput);
