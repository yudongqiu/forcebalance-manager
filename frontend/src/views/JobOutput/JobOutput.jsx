import React from "react";
import PropTypes from 'prop-types';
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
// @material-ui/icons
import InsertChartIcon from '@material-ui/icons/InsertChart';
// core components
import GridItem from "components/Grid/GridItem.jsx";
import EnhancedTable from "components/Table/EnhancedTable.jsx";
// models
import api from "../../api";
import { RunningStatus } from "../../constants";

import AbinitioObjectiveView from "./TargetObjectives/AbinitioObjectiveView.jsx";

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
    paddingBottom: "10px",
    fontSize: "30px",
  },
  table: {
    paddingTop: "5px",
  }
}

const targetObjectiveViews = {
  'ABINITIO_GMX': AbinitioObjectiveView,
  'ABINITIO_SMIRNOFF': AbinitioObjectiveView,
}

class JobOutput extends React.Component {
  state = {
    currentIter: null,
    optimizerState: {},
    targetsInfo: {},
    dialogTargetName: null,
    dialogTargetType: null,
    dialogOpen: false,
  }

  handleClickIterButton = (e, iter) => {
    this.setState({
      currentIter: iter,
    });
  }

  update = () => {
    api.getAllTargetsInfo(this.updateTargetsInfo);
    this.updateEveryIter()
  }

  updateEveryIter = () => {
    api.getOptimizerState(this.updateOptimizerState);
  }

  updateOptimizerState = (data) => {
    if (Object.keys(data).length > 0) {
      if (this.state.currentIter) {
        this.setState({
          optimizerState: data,
        })
      } else {
        this.setState({
          currentIter: 1,
          optimizerState: data,
        })
      }
    }
  }

  updateTargetsInfo = (data) => {
    this.setState({
      targetsInfo: data,
    });
  }

  componentDidMount() {
    api.onChangeProjectName(this.update);
    this.update();
    api.register('update_opt_state', this.updateEveryIter);
  }

  componentWillUnmount() {
    api.removeOnChangeProjectName(this.update);
    api.unregister('update_opt_state', this.updateEveryIter);
  }

  handleObjectiveRowClick = (event, targetName) => {
    if (this.state.targetsInfo[targetName] && this.state.targetsInfo[targetName]['type']) {
      this.setState({
        dialogTargetName: targetName,
        dialogTargetType: this.state.targetsInfo[targetName]['type'],
        dialogOpen: true,
      })
    }
  }

  handleCloseDialog = () => {
    this.setState({
      dialogOpen: false,
    })
  }

  render() {
    const { classes } = this.props;
    const { currentIter, optimizerState, targetsInfo, dialogTargetType, dialogTargetName, dialogOpen } = this.state;
    const iterButtons = [];
    const iterations = [];
    for (const d in optimizerState) {
      iterations.push(optimizerState[d].iteration);
    }
    const lastIter = Math.max(...iterations);
    for (let i = 0; i < lastIter + 1; i++) {
      iterButtons.push(
        <Button key={i}
          onClick={(e) => this.handleClickIterButton(e, i)}
          className={classes.iterButton}
        >
          Iteration {i}
        </Button>
      );
    }

    // objective details dialog views
    const TargetObjectiveView = targetObjectiveViews[dialogTargetType];
    const TargetObjectiveDialog = dialogOpen ? (<Dialog open={dialogOpen} maxWidth='lg' fullWidth scroll='body'>
      <TargetObjectiveView targetName={dialogTargetName} optIter={currentIter} onClose={this.handleCloseDialog} maxIter={lastIter}/>
    </Dialog>) : <div/>;

    // get target names that has available objective views
    const targetsWithObjectiveViews = {};
    for (let targetName in targetsInfo) {
      if (targetsInfo[targetName]['type'] in targetObjectiveViews) {
        targetsWithObjectiveViews[targetName] = true;
      }
    }

    return (
      <div className={classes.wrap}>
        <div className={classes.leftPanel}>
          {iterButtons}
        </div>
        <div className={classes.rightPanel}>
          <p className={classes.title}>Iteration {currentIter}</p>
          {(currentIter !== null && optimizerState[currentIter]) ?
            <Grid>
              <GridItem xs={12} sm={12} md={12}>
                <div className={classes.table}>
                  <ObjectiveTable objdict={optimizerState[currentIter].objdict} handleRowClick={this.handleObjectiveRowClick} targetsWithObjectiveViews={targetsWithObjectiveViews}/>
                </div>
              </GridItem>
              <GridItem xs={12} sm={12} md={12}>
                <div className={classes.table}>
                  <GradientsTable data={optimizerState[currentIter].paramUpdates} />
                </div>
              </GridItem>
            </Grid> :
            "Optimization running"
          }
        </div>
        {TargetObjectiveDialog}
      </div>
    );
  }

}

JobOutput.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(JobOutput);

function ObjectiveTable(props) {
  const objdict = props.objdict;
  const rows = [];
  for (const objName in objdict) {
    const w = objdict[objName].w;
    const x = objdict[objName].x;
    let hasObjView = '';
    if (props.targetsWithObjectiveViews && (objName in props.targetsWithObjectiveViews)) {
      hasObjView =  <InsertChartIcon />;
    }
    if (objName !== 'Total') {
      rows.push([objName, hasObjView, w, x, w*x]);
    } else {
      rows.push([objName, '', '', '', objdict[objName]]);
    }
  }
  return (
    <EnhancedTable
      tableHead={["Target", "Details", "Weight", "Objective", "Contribution"]}
      data={rows}
      title="Objective Breakdown"
      handleRowClick={props.handleRowClick}
    />
  );
}

function GradientsTable(props) {
  const data = props.data;
  const rows = [];
  for (const pName in data) {
    rows.push([pName, data[pName].gradient, data[pName].prev_pval, data[pName].pval]);
  }
  return (
    <EnhancedTable
      tableHead={["Parameter", "Gradient", "Prev", "New"]}
      data={rows}
      title="Parameter Updates"
    />
  );
}