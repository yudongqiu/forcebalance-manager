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
// plotly
import Plot from 'react-plotly.js';

const styles = {
  header: {
    paddingBottom: 10,
  },
  tabRoot: {
    overflowWrap: 'break-word',
  },
};

class ParamChangeView extends React.Component {
  state = {
    tabValue: 0,
    paramGroups: {},
  }

  componentDidMount() {
    // put params into paramGroups based on name prefix
    const { paramNames, paramInitValues, paramFinalValues, paramPriors } = this.props;
    const { paramGroups } = this.state;
    for (let i=0; i<paramNames.length; i++) {
      const paramName = paramNames[i];
      const strSplit = paramName.split('/');
      const paramGroupName = strSplit.slice(0, strSplit.length-1).join(' / ');
      if (!paramGroups[paramGroupName]) {
        paramGroups[paramGroupName] = [];
      }
      paramGroups[paramGroupName].push([strSplit[strSplit.length-1], paramInitValues[i], paramFinalValues[i], paramPriors[i]]);
    }
    this.setState({
      paramGroups: paramGroups,
    })
  }

  handleChangeTabValue = (event, newValue) => {
    this.setState({
      tabValue: newValue,
    });
  }

  render() {
    const { classes } = this.props;
    const { tabValue, paramGroups } = this.state;



    const tabLabels = Object.keys(paramGroups);


    let tabContent = <div />;
    const paramGroupData = paramGroups[tabLabels[tabValue]];
    if (paramGroupData && paramGroupData.length > 0) {
      const paramNames = paramGroupData.map(data => {return data[0]});
      const maxNameLength = Math.max(...paramNames.map(d => {return d.length}));
      console.log(maxNameLength)
      const paramInitValues = paramGroupData.map(data => {return data[1]});
      const paramFinalValues = paramGroupData.map(data => {return data[2]});
      const paramPriorWidths = paramGroupData.map(data => {return data[3]});
      tabContent = <div>
        <Plot
          data={[
            {
              x: paramInitValues,
              y: paramNames,
              name: 'Init Value',
              orientation: 'h',
              marker: {
                color: 'rgba(55,128,191,0.6)',
              },
              width: 0.3,
              type: 'bar',
              base: 0,
            },
            {
              x: paramFinalValues,
              y: paramNames,
              name: 'Final Value',
              orientation: 'h',
              marker: {
                color: 'rgba(255,153,51,0.6)',
              },
              width: 0.3,
              type: 'bar',
              base: 0,
            },
            {
              x: paramPriorWidths,
              y: paramNames,
              name: 'Prior Width',
              orientation: 'h',
              marker: {
                color: 'rgba(204, 0, 255, 0.6)',
              },
              width: 0.1,
              type: 'bar',
              base: 0,
            }
          ]}
          style={{ width: '100%', height: Math.max(20*paramNames.length + 200, 400)}}
          layout={{
            barmode: 'group',
            margin: {
              l: 7*maxNameLength,
            }
          }}
          key={'plot'+tabValue}
        />
      </div>
    }

    return (
      <Card>
        <CardHeader
          className={classes.header}
          action={
            <IconButton color="secondary" onClick={this.props.onClose}>
              <CancelIcon fontSize="large"/>
            </IconButton>
          }
          title="Parameter Changes"
        />
        <CardContent>
          <Tabs value={tabValue} onChange={this.handleChangeTabValue} fullWidth indicatorColor="primary" scrollable scrollButtonsAuto>
            {tabLabels.map((label, index) => {
                return <Tab classes={{
                  root: classes.tabRoot,
                }} value={index} label={label} key={index}/>
            })}
          </Tabs>
          {tabContent}
        </CardContent>
      </Card>
    );
  }
}

ParamChangeView.propTypes = {
  classes: PropTypes.object.isRequired,
  paramNames: PropTypes.array.isRequired,
  paramInitValues: PropTypes.array.isRequired,
  paramFinalValues: PropTypes.array.isRequired,
  paramPriors: PropTypes.array.isRequired,
  onClose: PropTypes.func,
};

export default withStyles(styles)(ParamChangeView);
