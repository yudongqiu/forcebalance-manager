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
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
// icons
import CancelIcon from '@material-ui/icons/Cancel';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
// core components
import EnhancedTable from "components/Table/EnhancedTable.jsx";
import MoleculeViewer from "components/MoleculeViewer/MoleculeViewer.jsx";
// Models
import api from "../../../api";
import { RunningStatus } from "../../../constants";
// plotly
import Plot from 'react-plotly.js';
import { Checkbox } from "@material-ui/core";

const styles = {
  header: {
    paddingBottom: 10,
  },
  spanLabel: {
    paddingLeft: 20,
    paddingRight: 20,
  }
};

class AbinitioObjectiveView extends React.Component {
  state = {
    targetData: null,
    objectiveData: {},
    currFrame: 0,
    tabValue: 0,
    targetName: null,
    optIter: null,
    compareIterSet: new Set([]),
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
    if (prevState.targetName !== this.state.targetName && this.state.targetName) {
      // if target changed, clean the objective data and reset state
      this.setState({
        targetData: null,
        objectiveData: {},
        tabValue: 0,
        compareIterSet: new Set([]),
      })
      api.getTargetData(this.state.targetName, this.updateTargetData);
      api.getTargetObjectiveData(this.state.targetName, this.state.optIter, this.updateObjectiveData(this.state.optIter));
    } else {
      if (prevState.optIter !== this.state.optIter && !isNaN(this.state.optIter)) {
        // if optIter changed, check if we have it already
        const { targetName, optIter, objectiveData } = this.state;
        if (!(optIter in objectiveData)) {
          api.getTargetObjectiveData(targetName, optIter, this.updateObjectiveData(optIter));
        }
      }
      if (!isSetsEqual(prevState.compareIterSet, this.state.compareIterSet)) {
        // load data for each compareIter
        const { targetName, compareIterSet, objectiveData } = this.state;
        for (const iterOpt of compareIterSet) {
          if (!(iterOpt in objectiveData)) {
            api.getTargetObjectiveData(targetName, iterOpt, this.updateObjectiveData(iterOpt));
          }
        }
      }
    }
  }

  updateTargetData = (data) => {
    this.setState({
      targetData: data,
    })
  }

  updateObjectiveData = (optIter) => (data) => {
    let { objectiveData } = this.state;
    objectiveData[optIter] = data;
    this.setState({
      objectiveData: objectiveData,
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

  changeCheckBox = (iterOpt) => () => {
    // create new set so the value is "immutable"
    let compareIterSet = new Set(this.state.compareIterSet);
    if (compareIterSet.has(iterOpt)) {
      compareIterSet.delete(iterOpt);
    } else {
      compareIterSet.add(iterOpt);
    }
    this.setState({compareIterSet});
  }

  render() {
    const { classes, maxIter } = this.props;
    const { targetData, objectiveData, currFrame, tabValue, targetName, optIter, compareIterSet } = this.state;

    // objectiveData for current iteration
    let currObjectiveData = null;
    if (optIter in objectiveData) {
      currObjectiveData = objectiveData[optIter];
    }
    const compareIterList = Array.from(compareIterSet).sort();

    // render scatter plot page
    let scatterPlot = <div />;
    if (currObjectiveData && currObjectiveData.qm_energies) {
      const maxQMValue = Math.max(...currObjectiveData.qm_energies);
      const maxMMValue = Math.max(...currObjectiveData.mm_energies);
      let maxValue = Math.max(maxQMValue, maxMMValue);
      let data = [{
        x: currObjectiveData.qm_energies,
        y: currObjectiveData.mm_energies,
        type: 'scatter',
        mode: 'markers',
        name: 'Relative Energies'
      }];
      for (const iterOpt of compareIterList) {
        if ((iterOpt in objectiveData) && objectiveData[iterOpt].qm_energies && objectiveData[iterOpt].qm_energies.length > 0) {
          data.push({
            x: objectiveData[iterOpt].qm_energies,
            y: objectiveData[iterOpt].mm_energies,
            type: 'scatter',
            mode: 'markers',
            name: "Iter " + iterOpt,
          });
          maxValue = Math.max(maxValue, ...objectiveData[iterOpt].qm_energies, ...objectiveData[iterOpt].mm_energies);
        }
      }
      data.push({
        x: [0, maxValue],
        y: [0, maxValue],
        mode: 'lines',
        name: 'reference',
        line: {
          dash: 'dot',
          width: 2
        },
        marker: {
          color: 'rgba(50,50,50,0.6)',
        },
      });
      scatterPlot = <Plot
        data={data}
        style={{ width: '100%', height: '100%' }}
        layout={ {
          title: 'QM vs. MM Scatter Plot',
          xaxis: {
            title: 'QM Relative Energy [ kcal/mol ]',
            range: [0, maxValue+1],
          },
          yaxis: {
            scaleanchor: "x",
            title: 'MM Relative Energy [ kcal/mol ]',
            range: [0, maxValue+1],
          },
          showlegend: true,
          legend: {
            x: 0.8,
            y: 0.2
          },
          margin: {
            l:40,
            r:40,
            t:60,
            b:40,
          },
          hovermode: 'closest',
        } }
        onClick={this.handlePlotClick}
      />;
    }
    const scatterPlotPage = <div key='plot1'>{scatterPlot}</div>;


    // render line plot page
    let linePlot = <div />;
    if (currObjectiveData && currObjectiveData.qm_energies) {
      const maxQMValue = Math.max(...currObjectiveData.qm_energies);
      const maxMMValue = Math.max(...currObjectiveData.mm_energies);
      const maxValue = Math.max(maxQMValue, maxMMValue);
      const xValues = [...Array(currObjectiveData.qm_energies.length).keys()];
      let data = [{
        x: xValues,
        y: currObjectiveData.qm_energies,
        mode: 'lines+markers',
        name: 'QM Energy'
      },
      {
        x: xValues,
        y: currObjectiveData.mm_energies,
        mode: 'lines+markers',
        name: 'MM Energy'
      }];
      for (const iterOpt of compareIterList) {
        if ((iterOpt in objectiveData) && objectiveData[iterOpt].qm_energies && objectiveData[iterOpt].mm_energies.length > 0) {
          data.push({
            x: xValues,
            y: objectiveData[iterOpt].mm_energies,
            mode: 'lines+markers',
            name: 'Iter ' + iterOpt,
          });
        }
      }
      linePlot = <Plot
        data={data}
        style={{ width: '100%', height: '100%' }}
        layout={ {
          title: 'QM vs. MM Line Plot',
          xaxis: {
            title: 'Frame Number',
          },
          yaxis: {
            title: 'Relative Energies [ kcal/mol ]',
          },
          showlegend: true,
          margin: {
            l:40,
            r:40,
            t:60,
            b:40,
          },
          hovermode: 'closest',
        } }
        onClick={this.handlePlotClick}
      />;
    }
    const linePlotPage = <div key='plot2'>{linePlot}</div>;


    // render table page
    const rows = [];
    if (currObjectiveData && currObjectiveData.qm_energies && currObjectiveData.qm_energies.length > 0) {
      for (let i = 0; i < currObjectiveData.qm_energies.length; i++) {
        rows.push([i.toString(), currObjectiveData.qm_energies[i], currObjectiveData.mm_energies[i], currObjectiveData.diff[i], currObjectiveData.weights[i]]);
      }
    }

    const tablePage = <div>
      <EnhancedTable
        tableHead={["#", "QM Energies", "MM Energies", "Diff.", "Weight"]}
        data={rows}
        title="Objective Breakdown"
        handleRowClick={this.handleTableRowClick}
        key="table-objective"
      />
    </div>;

    const gradData = [];

    if (currObjectiveData && currObjectiveData.gradients && currObjectiveData.plist) {
      for (let i = 0; i < currObjectiveData.gradients.length; i++) {
        gradData.push([currObjectiveData.plist[i], currObjectiveData.gradients[i]]);
      }
    }
    const gradientsPage = <div>
      <EnhancedTable
        tableHead={["Parameter", "Gradient"]}
        data={gradData}
        title="Contribution to Objective Gradients"
        key="table-gradients"
      />
  </div>;

    const tabContents = [scatterPlotPage, linePlotPage, tablePage, gradientsPage];

    const mview = <MoleculeViewer pdbString={targetData? targetData.pdbString:null} title={'Geometries'} frame={currFrame}/>;

    const compareIterSelectors = [...Array(maxIter+1).keys()].map(iterOpt => {
        return <FormControlLabel
          control={
            <Checkbox
              icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
              checkedIcon={<CheckBoxIcon fontSize="small" />}
              checked={compareIterSet.has(iterOpt)}
              onChange={this.changeCheckBox(iterOpt)}
              color='primary'
            />
          }
          label={iterOpt}
          key={'checkbox-'+iterOpt}
        />
      });

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
            <IconButton onClick={this.handleClickNextIter} disabled={!(maxIter && optIter < maxIter)} key='iconbutton2'>
              <NavigateNextIcon fontSize='small'/>
            </IconButton>,
            <span className={classes.spanLabel} key={'checkbox-label'}>Compare with</span>,
            ...compareIterSelectors,
          ]}
        />
        <CardContent>
          <Tabs value={tabValue} onChange={this.handleChangeTabValue} fullWidth indicatorColor="primary">
            <Tab value={0} label="QM vs MM Scatter Plot"/>
            <Tab value={1} label="QM vs MM Line Plot" />
            <Tab value={2} label="QM vs MM Table" />
            <Tab value={3} label="Gradients Table" />
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
  onClose: PropTypes.func,
  maxIter: PropTypes.number,
};

export default withStyles(styles)(AbinitioObjectiveView);

function isSetsEqual (a, b) {
  return a.size === b.size && [...a].every(value => b.has(value));
}