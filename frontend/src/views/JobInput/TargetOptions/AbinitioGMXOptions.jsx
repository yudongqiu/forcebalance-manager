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
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Chip from '@material-ui/core/Chip';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import Checkbox from '@material-ui/core/Checkbox';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
// icons
import CancelIcon from '@material-ui/icons/Cancel';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
// core components
import GridItem from "components/Grid/GridItem.jsx";
import EnhancedTable from "components/Table/EnhancedTable.jsx";
import MoleculeViewer from "components/MoleculeViewer/MoleculeViewer.jsx";
// Models
import api from "../../../api";
// plotly
import Plot from 'react-plotly.js';

const styles = {
  header: {
    paddingBottom: 10,
  },
  cardContent: {
    paddingTop: 0,
  },
  tabContent: {
    width: '100%',
    overflow: 'auto',
    paddingTop: 25,
    minHeight: '400px',
  },
  divider: {
    marginTop: '25px',
    marginBottom: '25px',
  },
  dividerFullWidth: {
    margin: `5px 0 0 6px`,
  },
};

class AbinitioGMXOptions extends React.Component {
  state = {
    targetData: null,
    currFrame: 0,
    tabValue: 0,
    targetOptions: null,
  }

  componentDidMount() {
    const { targetName } = this.props;
    if (targetName) {
      api.getTargetData(targetName, this.updateTargetData);
      api.getTargetOptions(targetName, this.updateTargetOptions);
    }
  }

  updateTargetData = (data) => {
    this.setState({
      targetData: data
    });
  }

  updateTargetOptions = (data) => {
    this.setState({
      targetOptions: data,
    })
  }

  handleChangeTabValue = (event, newValue) => {
    this.setState({
      tabValue: newValue,
    });
  }

  handlePlotClick = (data) => {
    this.setState({
      currFrame: data.points[0].pointIndex,
    })
  }

  handleSetTargetOption = (event) => {
    const key = event.target.name;
    let value = event.target.value;
    if (event.target.type === "number") {
      if (value !== "") {
        value = parseFloat(event.target.value);
        if (!isNaN(value)) {
          api.setTargetOptions(this.props.targetName, {[key]: value});
        }
      }
    } else {
      api.setTargetOptions(this.props.targetName, {[key]: value});
    }
    let { targetOptions } = this.state;
    targetOptions[key] = value;
    this.setState({ targetOptions });
  }

  handleOptionCheckBox = (key) => (event) => {
    const value = event.target.checked;
    api.setTargetOptions(this.props.targetName, {[key]: value});
    let { targetOptions } = this.state;
    targetOptions[key] = value;
    this.setState({ targetOptions });
  }

  isValidWeight = (weight) => {
    return (weight !== '' && !isNaN(weight) && parseFloat(weight) >= 0);
  }

  render() {
    const { classes, targetName } = this.props;
    const { targetData, targetOptions, currFrame, tabValue } = this.state;
    // target options page
    const optionsPage = targetOptions ? <div className={classes.tabContent} >
      <Grid container>
        <GridItem xs={3} sm={3} md={3}>
          <TextField
            name="targetName"
            label="Target Name"
            onChange={null}
            value={targetOptions.name}
            disabled={true}
          />
        </GridItem>
        <GridItem xs={3} sm={3} md={3}>
          <TextField
            name="targetType"
            label="Target Type"
            onChange={null}
            value={targetOptions.type}
            disabled={true}
          />
        </GridItem>
        <GridItem xs={3} sm={3} md={3}>
          <TextField
            name="weight"
            type="number"
            label="Target Weight"
            onChange={this.handleSetTargetOption}
            value={targetOptions.weight}
            error={!this.isValidWeight(targetOptions.weight)}
          />
        </GridItem>
        <GridItem xs={12} sm={12} md={12}>
          <Divider className={classes.divider}/>
        </GridItem>
        <GridItem xs={3} sm={3} md={3}>
          <Typography className={classes.dividerFullWidth} color="textSecondary" variant="caption">
            coords
          </Typography>
          <Chip key={targetOptions.coords} label={targetOptions.coords} />
        </GridItem>
        <GridItem xs={3} sm={3} md={3}>
          <Typography className={classes.dividerFullWidth} color="textSecondary" variant="caption">
            qdata
          </Typography>
          <Chip key={'qdata.txt'} label={'qdata.txt'} />
        </GridItem>
        <GridItem xs={3} sm={3} md={3}>
          <Typography className={classes.dividerFullWidth} color="textSecondary" variant="caption">
            top
          </Typography>
          <Chip key={targetOptions.gmx_top} label={targetOptions.gmx_top} />
        </GridItem>
        <GridItem xs={3} sm={3} md={3}>
          <Typography className={classes.dividerFullWidth} color="textSecondary" variant="caption">
            mdp
          </Typography>
          <Chip key={targetOptions.gmx_mdp} label={targetOptions.gmx_mdp} />
        </GridItem>
        <GridItem xs={12} sm={12} md={12}>
          <Divider className={classes.divider}/>
        </GridItem>
        <GridItem xs={3} sm={3} md={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={targetOptions.energy}
                onChange={this.handleOptionCheckBox('energy')}
                color="primary"
              />
            }
            label="Fit Energy"
          />
        </GridItem>
        <GridItem xs={3} sm={3} md={3}>
          <TextField
            name="w_energy"
            type="number"
            label="Energy Weight"
            onChange={this.handleSetTargetOption}
            value={targetOptions.w_energy}
            error={!this.isValidWeight(targetOptions.w_energy)}
            disabled={!targetOptions.energy}
          />
        </GridItem>
        <GridItem xs={2} sm={2} md={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={targetOptions.attenuate}
                onChange={this.handleOptionCheckBox('attenuate')}
                color="primary"
                disabled={!targetOptions.energy}
              />
            }
            label="Attenuate"
          />
        </GridItem>
        <GridItem xs={2} sm={2} md={2}>
          <TextField
            name="energy_denom"
            type="number"
            label="Energy Demoninator"
            onChange={this.handleSetTargetOption}
            value={targetOptions.energy_denom}
            error={!this.isValidWeight(targetOptions.energy_denom)}
            disabled={!targetOptions.energy || !targetOptions.attenuate}
          />
        </GridItem>
        <GridItem xs={2} sm={2} md={2}>
          <TextField
            name="energy_upper"
            type="number"
            label="Energy Upper Limit"
            onChange={this.handleSetTargetOption}
            value={targetOptions.energy_upper}
            error={!this.isValidWeight(targetOptions.energy_upper)}
            disabled={!targetOptions.energy || !targetOptions.attenuate}
          />
        </GridItem>
        <GridItem xs={12} sm={12} md={12}>
          <Divider className={classes.divider}/>
        </GridItem>
        <GridItem xs={3} sm={3} md={3}>
          <FormControlLabel
          control={
            <Checkbox
              checked={targetOptions.force}
              onChange={this.handleOptionCheckBox('force')}
              color="primary"
            />
          }
          label="Fit Force"
          />
        </GridItem>
        <GridItem xs={3} sm={3} md={3}>
          <TextField
            name="w_force"
            type="number"
            label="Force Weight"
            onChange={this.handleSetTargetOption}
            value={targetOptions.w_force}
            error={!this.isValidWeight(targetOptions.w_force)}
            disabled={!targetOptions.force}
          />
        </GridItem>
        <GridItem xs={2} sm={2} md={2}>
          <TextField
            name="force_rms_override"
            type="number"
            label="Force RMS Override"
            onChange={this.handleSetTargetOption}
            value={targetOptions.force_rms_override}
            error={parseFloat(targetOptions.force_rms_override) < 0}
            disabled={!targetOptions.force}
          />
        </GridItem>
      </Grid>
    </div> : <div/>

    // target details
    // molecule geometry view
    const mview = <MoleculeViewer pdbString={targetData? targetData.pdbString:null} title={targetOptions? targetOptions.coords : 'Geometries'} frame={currFrame}/>;
    // qm energy plot
    let linePlot = <div />;
    if (targetData && targetData.qm_energies && targetData.qm_energies.length > 0) {
      const xValues = [...Array(targetData.qm_energies.length).keys()];
      linePlot = <Plot
        data={[
          {
            x: xValues,
            y: targetData.qm_energies,
            mode: 'lines+markers',
            name: 'QM Energy'
          },
        ]}
        style={{ width: '100%', height: '100%' }}
        layout={ {
          title: 'QM Relative Energies in qdata.txt',
          xaxis: {
            title: 'Frame Number',
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
          hovermode: 'closest',
        } }
        onClick={this.handlePlotClick}
      />;
    }
    const targetDetailsPage = <div className={classes.tabContent} >
      <div style={{ float: 'left', width: '60%', overflow: 'auto' }} >
        {linePlot}
      </div>
      <div style={{ float: 'right', width: '40%' }} >
        {mview}
      </div>
    </div>;

    const tabContents = [optionsPage, targetDetailsPage];
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
        />
        <CardContent className={classes.cardContent}>
          <Tabs value={tabValue} onChange={this.handleChangeTabValue} fullWidth indicatorColor="primary">
            <Tab value={0} label="Target Options"/>
            <Tab value={1} label="Target Details" />
          </Tabs>
          {tabContents[tabValue]}
        </CardContent>
      </Card>
    );
  }
}

AbinitioGMXOptions.propTypes = {
  classes: PropTypes.object.isRequired,
  targetName: PropTypes.string.isRequired,
  onClose: PropTypes.func,
};

export default withStyles(styles)(AbinitioGMXOptions);
