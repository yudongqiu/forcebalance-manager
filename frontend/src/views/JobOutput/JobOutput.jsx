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
import Grid from '@material-ui/core/Grid';
// core components
import GridItem from "components/Grid/GridItem.jsx";
import Table from "components/Table/Table.jsx";
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardBody from "components/Card/CardBody.jsx";
import EnhancedTable from "components/Table/EnhancedTable.jsx";
// models
import api from "../../api";
import { RunningStatus } from "../../constants";

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

class JobOutput extends React.Component {
  state = {
    currentIter: null,
    optimizerState: {},
  }

  handleClickIterButton = (e, iter) => {
    this.setState({
      currentIter: iter,
    });
  }

  update = () => {
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

  componentDidMount() {
    api.onChangeProjectName(this.update);
    this.update();
    api.register('update_opt_state', this.update);
  }

  componentWillUnmount() {
    api.removeOnChangeProjectName(this.update);
    api.unregister('update_opt_state', this.update);
  }

  render() {
    const { classes } = this.props;
    const { currentIter, optimizerState } = this.state;
    const iterButtons = [];
    const iterations = [];
    for (const d in optimizerState) {
      iterations.push(optimizerState[d].iteration);
    }
    const lastIter = Math.max(...iterations);
    for (let i = 1; i < lastIter + 1; i++) {
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
        <div className={classes.leftPanel}>
          {iterButtons}
        </div>
        <div className={classes.rightPanel}>
          <p className={classes.title}>Iteration {currentIter}</p>
          {(currentIter === null) ?
            "Optimization running" :
            <Grid>
              <GridItem xs={12} sm={12} md={12}>
                <ObjectiveTable objdict={optimizerState[currentIter].objdict} />
              </GridItem>
              <GridItem xs={12} sm={12} md={12}>
                <GradientsTable data={optimizerState[currentIter].paramUpdates} />
              </GridItem>
            </Grid>
          }
        </div>
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
    if (objName !== 'Total') {
      rows.push([objName, w, x, w*x]);
    } else {
      rows.push([objName, '', '', objdict[objName].toString()]);
    }
  }
  return (
    <EnhancedTable
      tableHead={["Target", "weight", "objective", "contribution"]}
      data={rows}
      title="Objective Breakdown"
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