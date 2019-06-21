import React from "react";
import PropTypes from 'prop-types';
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import IconButton from '@material-ui/core/IconButton';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
// icons
import CancelIcon from '@material-ui/icons/Cancel';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
// core components
import EnhancedTable from "components/Table/EnhancedTable.jsx";
import MoleculeViewer from "components/MoleculeViewer/MoleculeViewer.jsx";
// Models
import api from "../../../api";
import { RunningStatus } from "../../../constants";
// plotly
import Plot from 'react-plotly.js';

const styles = {
  header: {
    paddingBottom: 10,
  }
};

class AbinitioObjectiveView extends React.Component {
  state = {
    objectiveData: null,
    currFrame: 0,
    tabValue: 0,
    targetName: null,
    optIter: null,
  }

  componentDidMount() {
    this.setState({
      targetName: this.props.targetName,
      optIter: this.props.optIter,
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.targetName !== this.props.targetName || prevProps.optIter !== this.props.optIter) {
      this.setState({
        targetName: this.props.targetName,
        optIter: this.props.optIter,
      })
    }
    if (prevState.targetName !== this.state.targetName || prevState.optIter !== this.state.optIter) {
      const { targetName, optIter } = this.state;
      if (targetName != null && !isNaN(optIter)) {
        api.getTargetObjectiveData(targetName, optIter, this.updateObjectiveData);
      }
    }
  }

  updateObjectiveData = (data) => {
    this.setState({
      objectiveData: data
    })
  }

  handleChangeTabValue = (event, newValue) => {
    this.setState({
      tabValue: newValue,
    });
  }

  handleTableRowClick = (event, rowTitle) => {
    this.setState({
      currFrame: parseInt(rowTitle),
    })
  }

  handlePlotClick = (data) => {
    this.setState({
      currFrame: data.points[0].pointIndex,
    })
  }

  handleClickPrevIter = () => {
    const { optIter } = this.state;
    if (optIter > 0) {
      this.setState({
        optIter: optIter - 1,
      })
    }
  }

  handleClickNextIter = () => {
    const { optIter } = this.state;
    if (this.props.maxIter && optIter < this.props.maxIter) {
      this.setState({
        optIter: optIter + 1,
      })
    }
  }

  render() {
    const { classes } = this.props;
    const { objectiveData, currFrame, tabValue, targetName, optIter } = this.state;

    // render scatter plot page
    let scatterPlot = <div />;
    if (objectiveData && objectiveData.qm_energies) {
      const maxQMValue = Math.max(...objectiveData.qm_energies);
      const maxMMValue = Math.max(...objectiveData.mm_energies);
      const maxValue = Math.max(maxQMValue, maxMMValue);
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
        style={{ width: '100%', height: '100%' }}
        layout={ {
          title: 'QM vs. MM Scatter Plot',
          xaxis: {
            title: 'MM Relative Energy [ kcal/mol ]',
            range: [0, maxValue+1],
          },
          yaxis: {
            scaleanchor: "x",
            title: 'QM Relative Energy [ kcal/mol ]',
            range: [0, maxValue+1],
          },
          showlegend: true,
          legend: {
            x: 0.5,
            y: 0.2
          },
          margin: {
            l:40,
            r:40,
            t:60,
            b:40,
          },
        } }
        onClick={this.handlePlotClick}
      />;
    }
    const scatterPlotPage = <div key='plot1'>{scatterPlot}</div>;


    // render line plot page
    let linePlot = <div />;
    if (objectiveData && objectiveData.qm_energies) {
      const maxQMValue = Math.max(...objectiveData.qm_energies);
      const maxMMValue = Math.max(...objectiveData.mm_energies);
      const maxValue = Math.max(maxQMValue, maxMMValue);
      const xValues = [...Array(objectiveData.qm_energies.length).keys()];
      linePlot = <Plot
        data={[
          {
            x: xValues,
            y: objectiveData.qm_energies,
            mode: 'lines+markers',
            name: 'QM Energy'
          },
          {
            x: xValues,
            y: objectiveData.mm_energies,
            mode: 'lines+markers',
            name: 'MM Energy'
          },
        ]}
        style={{ width: '100%', height: '100%' }}
        layout={ {
          title: 'QM vs. MM Line Plot',
          xaxis: {
            title: 'Configurations',
          },
          yaxis: {
            title: 'Relative Energies [ kcal/mol ]',
          },
          showlegend: false,
          margin: {
            l:40,
            r:40,
            t:60,
            b:40,
          },
        } }
        onClick={this.handlePlotClick}
      />;
    }
    const linePlotPage = <div key='plot2'>{linePlot}</div>;

    // render table page
    const rows = [];
    if (objectiveData && objectiveData.qm_energies && objectiveData.qm_energies.length > 0) {
      for (let i = 0; i < objectiveData.qm_energies.length; i++) {
        rows.push([i.toString(), objectiveData.qm_energies[i], objectiveData.mm_energies[i], objectiveData.diff[i], objectiveData.weights[i]]);
      }
    }
    const tablePage = <div>
      <EnhancedTable
        tableHead={["#", "QM Energies", "MM Energies", "Diff.", "Weight"]}
        data={rows}
        title="Objective Breakdown"
        handleRowClick={this.handleTableRowClick}
      />
    </div>;

    const tabContents = [scatterPlotPage, linePlotPage, tablePage];

    const mview = <MoleculeViewer pdbString={objectiveData? objectiveData.pdbString:null} title={'Geometries'} frame={currFrame}/>;

    return (
      <Card>
        <CardHeader
          className={classes.header}
          action={
            <IconButton color="secondary" onClick={this.props.onClose}>
              <CancelIcon fontSize="large"/>
            </IconButton>
          }
          title={targetName}
          subheader={[
            "Iteration ",
            <IconButton onClick={this.handleClickPrevIter} disabled={optIter<=0} key='iconbutton1'>
              <NavigateBeforeIcon fontSize='small'/>
            </IconButton>,
            optIter,
            <IconButton onClick={this.handleClickNextIter} disabled={!(this.props.maxIter && optIter < this.props.maxIter)} key='iconbutton2'>
              <NavigateNextIcon fontSize='small'/>
            </IconButton>
          ]}
        />
        <CardContent>
          <Tabs value={tabValue} onChange={this.handleChangeTabValue} fullWidth indicatorColor="primary">
            <Tab value={0} label="QM vs MM Scatter Plot"/>
            <Tab value={1} label="QM vs MM Line Plot" />
            <Tab value={2} label="QM vs MM Table" />
          </Tabs>
          <div style={{ width: '100%', overflow: 'auto', paddingTop: 15 }} >
            <div style={{ float: 'left', width: '60%', overflow: 'auto' }} >
              {tabContents[tabValue]}
            </div>
            <div style={{ float: 'right', width: '40%' }} >
              {mview}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
}

AbinitioObjectiveView.propTypes = {
  classes: PropTypes.object.isRequired,
  targetName: PropTypes.string.isRequired,
  optIter: PropTypes.number.isRequired,
  onClose: PropTypes.any,
  maxIter: PropTypes.number,
};

export default withStyles(styles)(AbinitioObjectiveView);
