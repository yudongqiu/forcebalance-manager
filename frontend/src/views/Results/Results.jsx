import React from "react";
import PropTypes from 'prop-types';
import ChartistGraph from "react-chartist";

// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
// core components
import GridItem from "components/Grid/GridItem.jsx";
import EnhancedTable from "components/Table/EnhancedTable.jsx";
import FFOutput from "./FFOutput.jsx";
// models
import api from "../../api";
import { RunningStatus } from "../../constants";
// plotly
import Plot from 'react-plotly.js';


const styles = {
  card : {
    padding: '10px',
    margin: '20px',
  }
}

class Results extends React.Component {
  state = {
    status: null,
    optimizeResults: {},
  }

  updateStatus = (data) => {
    this.setState({
      status: data.status,
    });
  }

  componentDidMount() {
    api.onChangeProjectName(this.fetch);
    api.register('update_status', this.updateStatus);
    api.pullStatus();
  }

  componentWillUnmount() {
    api.removeOnChangeProjectName(this.fetch);
    api.unregister('update_status', this.updateStatus);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.status !== RunningStatus.finished && this.state.status === RunningStatus.finished) {
      this.fetch();
    }
  }

  fetch = () => {
    api.getOptimizeResults(this.updateOptimizeResults);
  }

  updateOptimizeResults = (data) => {
    this.setState({
      optimizeResults: data,
    })
  }

  render() {
    const { classes } = this.props;
    const { status, optimizeResults } = this.state;
    if (status !== RunningStatus.finished) {
      return <div>
        Optimization wasn't finished.
      </div>
    }
    let convergeButton = <Button variant="outlined" color="secondary">
      did not converge
    </Button>;
    let totalIterButton = <Button variant="outlined" > 0 </Button>;
    // (optimizeResults.converged)?
    if (optimizeResults && optimizeResults.converged) {
      convergeButton = <Button variant="outlined" color="primary">
        converged
      </Button>;
    }
    if (optimizeResults && optimizeResults.iteration) {
      totalIterButton = <Button variant="fab" color="primary" mini>{optimizeResults.iteration}</Button>;
    }
    // optimize objective plot
    let objPlot = <div />;
    if (optimizeResults && optimizeResults.obj_values) {
      const xValues = [...Array(optimizeResults.obj_values.length).keys()];
      objPlot = <Plot
        data={[
          {
            x: xValues,
            y: optimizeResults.obj_values,
            type: 'bar',
            name: 'Objective Values',
          },
          {
            x: xValues,
            y: optimizeResults.obj_values,
            mode: 'line',
            name: 'Objective Values',
          },
        ]}
        style={{ width: '100%', height: '100%' }}
      />;
    }

    return <div>
      <Card className={classes.card}>
        <CardContent>
          Optimization {convergeButton} in {totalIterButton} iterations
        </CardContent>
        <CardContent>
          {objPlot}
        </CardContent>
      </Card>
      <Card className={classes.card}>
        <CardHeader
          subheader="Final Force Field"
        />
        <FFOutput />
      </Card>
    </div>
  }
}

Results.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Results);