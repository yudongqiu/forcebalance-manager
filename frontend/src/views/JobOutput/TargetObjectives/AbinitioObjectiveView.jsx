import React from "react";
import PropTypes from 'prop-types';
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepButton from '@material-ui/core/StepButton';
import StepContent from '@material-ui/core/StepContent';
import Button from '@material-ui/core/Button';
import red from '@material-ui/core/colors/red';
import green from '@material-ui/core/colors/green';
// core components
import GridItem from "components/Grid/GridItem.jsx";
import EnhancedTable from "components/Table/EnhancedTable.jsx";
// Models
import api from "../../../api";
import { RunningStatus } from "../../../constants";
// plotly
import Plot from 'react-plotly.js';


const styles = {
  iconSmall: {
    padding: 0,
    margin: 0,
    fontSize: 12,
  },
  contentWrapper: {
    margin: 20,
    minHeight: 400,
  },
  input: {
    display: 'none',
  },
  paper: {
    margin: 10,
    padding: 10,
    backgroundColor: '#EEEEEE',
  },
  fullWidth: {
    width: '100%',
    height: '100%',
  },
  section: {
    marginBottom: 5,
  },
  greenAvatar: {
    margin: 10,
    color: '#fff',
    backgroundColor: green[500],
  },
  redAvatar: {
    margin: 10,
    color: '#fff',
    backgroundColor: red[500],
  },
  center: {
    height: 300,
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '20%',
  },
  title: {
    fontSize: 20,
    paddingTop: 16,
  }
};

class AbinitioObjectiveView extends React.Component {
  state = {
    activeStep: 0,
    objectiveData: null,
  }

  componentDidMount() {
    api.getTargetObjectiveData(this.props.targetName, this.props.optIter, this.updateObjectiveData);
  }

  updateObjectiveData = (data) => {
    this.setState({
      objectiveData: data
    })
  }

  handleStep = step => () => {
    this.setState({
      activeStep: step,
    });
  };

  render() {
    const { classes } = this.props;
    const { activeStep, objectiveData } = this.state;

    // render scatter plot page
    let scatterPlot = <div />;
    if (objectiveData && objectiveData.qm_energies) {
      const maxQMValue = Math.max(...objectiveData.qm_energies);
      const maxMMValue = Math.max(...objectiveData.mm_energies);
      const maxValue = Math.max(maxQMValue, maxMMValue);
      console.log(maxValue)
      scatterPlot = <Plot
        data={[
          {
            x: objectiveData.qm_energies,
            y: objectiveData.mm_energies,
            type: 'scatter',
            mode: 'markers',
            name: 'Relative Energies'
          },
          {
            x: [0, maxValue],
            y: [0, maxValue],
            mode: 'lines',
            name: 'reference',
            line: {
              dash: 'dot',
              width: 2
            }
          },
        ]}
      style={{ width: '100%', height: '800px' }}
      layout={ {
        title: 'QM vs. MM Scatter Plot',
        yaxis: {
          scaleanchor: "x",
        },
      } }
    />;
    }
    const scatterPlotPage = <div>{scatterPlot}</div>;


    // render line plot page
    let linePlot = <div />;
    if (objectiveData && objectiveData.qm_energies) {
      const xValues = [...Array(objectiveData.qm_energies.length).keys()];
      linePlot = <Plot
      data={[
        {
          x: xValues,
          y: objectiveData.qm_energies,
          mode: 'lines+markers',
          name: 'QM Energies'
        },
        {
          x: xValues,
          y: objectiveData.mm_energies,
          mode: 'lines+markers',
          name: 'MM Energies'
        },
      ]}
      style={{ width: '100%', height: '800px' }}
      layout={ {title: 'QM vs. MM Line Plot'} }
    />;
    }
    const linePlotPage = <div>{linePlot}</div>;

    // render table page
    const rows = [];
    if (objectiveData && objectiveData.qm_energies && objectiveData.qm_energies.length > 0) {
      for (let i = 0; i < objectiveData.qm_energies.length; i++) {
        rows.push([i.toString(), objectiveData.qm_energies[i], objectiveData.mm_energies[i], objectiveData.diff[i], objectiveData.weights[i]]);
      }
    }
    const tablePage = <div>
      <EnhancedTable
        tableHead={["Index", "QM Energies", "MM Energies", "Diff.", "Weight"]}
        data={rows}
        title="Objective Breakdown"
      />
    </div>;


    const stepContents = [scatterPlotPage, linePlotPage, tablePage];

    return (
      <Card>
        <CardContent>
          <Stepper nonLinear activeStep={activeStep}>
            <Step>
              <StepButton
                onClick={this.handleStep(0)}
              >
                QM vs MM Scatter Plot
              </StepButton>
            </Step>
            <Step>
              <StepButton
                onClick={this.handleStep(1)}
              >
                QM vs MM Line Plot
              </StepButton>
            </Step>
            <Step>
              <StepButton
                onClick={this.handleStep(2)}
              >
                QM vs MM Table
              </StepButton>
            </Step>
          </Stepper>
          <div className={classes.contentWrapper} >
            {stepContents[activeStep]}
          </div>
        </CardContent>
        <CardActions>
          <Button onClick={this.props.onClose} variant="contained" style={{marginRight: 30}}>Close</Button>
        </CardActions>
      </Card>
    );
  }
}

AbinitioObjectiveView.propTypes = {
  classes: PropTypes.object.isRequired,
  targetName: PropTypes.string.isRequired,
  optIter: PropTypes.number.isRequired,
  onClose: PropTypes.any,
};

export default withStyles(styles)(AbinitioObjectiveView);
