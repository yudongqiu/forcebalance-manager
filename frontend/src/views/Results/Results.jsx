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

// css for overwriting the "white chart" in material-dashboard-react.css

import "./chart.css";

var Chartist = require("chartist");
require("chartist-plugin-axistitle");


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
    api.register('update_status', this.updateStatus);
    api.pullStatus();
  }

  componentWillUnmount() {
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
    let chart = null;
    // (optimizeResults.converged)?
    if (optimizeResults && optimizeResults.converged) {
      convergeButton = <Button variant="outlined" color="primary">
        converged
      </Button>;
    }
    if (optimizeResults && optimizeResults.iteration) {
      totalIterButton = <Button variant="fab" color="primary" mini>{optimizeResults.iteration}</Button>;
    }
    if (optimizeResults && optimizeResults.obj_values) {
      const objChart = {
        data: {
          labels: Array(optimizeResults.obj_values.length).fill().map((x, i) => i + 1),
          series: [optimizeResults.obj_values],
        },
        options: {
          height: '300px',
          lineSmooth: Chartist.Interpolation.cardinal({
            tension: 0
          }),
          low: 0,
          high: Math.max(optimizeResults.obj_values),
          chartPadding: {
            top: 0,
            right: 0,
            bottom: 30,
            left: 20
          },
          plugins: [
            Chartist.plugins.ctAxisTitle({
              axisX: {
                axisTitle: 'Iterations',
                axisClass: 'ct-axis-title',
                offset: {
                  x: 0,
                  y: 40
                },
                textAnchor: 'middle'
              },
              axisY: {
                axisTitle: 'Objective Value',
                axisClass: 'ct-axis-title',
                offset: {
                  x: 0,
                  y: 0
                },
                textAnchor: 'middle',
                flipTitle: false
              }
            })
          ],
        },
        animation: {
          draw: function (data) {
            if (data.type === "line" || data.type === "area") {
              data.element.animate({
                d: {
                  begin: 200,
                  dur: 700,
                  from: data.path
                    .clone()
                    .scale(1, 0)
                    .translate(0, data.chartRect.height())
                    .stringify(),
                  to: data.path.clone().stringify(),
                  easing: Chartist.Svg.Easing.easeOutQuint
                }
              });
            } else if (data.type === "point") {
              data.element.animate({
                opacity: {
                  begin: (data.index + 1) * 50,
                  dur: 300,
                  from: 0,
                  to: 1,
                  easing: "ease"
                }
              });
            }
          }
        }
      };
      chart = <ChartistGraph
        className="ct-chart"
        data={objChart.data}
        type="Line"
        options={objChart.options}
        listener={objChart.animation}
      />
    }

    return <div>
      <Card className={classes.card}>
        <CardContent>
          Optimization {convergeButton} in {totalIterButton} iterations
        </CardContent>
        <CardContent>
          {chart}
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