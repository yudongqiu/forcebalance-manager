import React from "react";
import PropTypes from 'prop-types';
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import InputAdornment from '@material-ui/core/InputAdornment';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
// import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelActions from '@material-ui/core/ExpansionPanelActions';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
// @material-ui/icons
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FileUploadIcon from "@material-ui/icons/CloudUpload";
import AddCircleIcon from '@material-ui/icons/AddCircle';
import DeleteIcon from '@material-ui/icons/Delete';
// Components
import GridItem from "components/Grid/GridItem.jsx";
import CustomInput from "components/CustomInput/CustomInput.jsx";
import Button from "components/CustomButtons/Button.jsx";
import Table from "components/Table/Table.jsx";
import FBtarget from "./FBtarget";
// Models
import api from "../../api";
import { RunningStatus } from "../../constants";

import AbinitioGMXWizard from "./TargetWizards/AbinitioGMXWizard.jsx";

const styles = {
  input: {
    display: 'none',
  },
  title: {
    marginBottom: 16,
    fontSize: 14,
  },
  header: {
    padding: 10,
    paddingLeft: "2%",
    paddingRight: "6%",
  }
};

const targetWizards = {
  'ABINITIO_GMX': AbinitioGMXWizard
}

class TargetInput extends React.Component {
  state = {
    targetNames: [],
    dialogOpen: false,
    dialogTargetName: '',
    dialogTargetType: '',
    wizardOpen: false,
  }

  componentDidMount() {
    api.onChangeProjectName(this.update);
    this.update();
  }

  componentWillUnmount() {
    api.removeOnChangeProjectName(this.update);
  }

  update = () => {
    api.getTargetNames(this.updateTargetNames);
  }

  updateTargetNames = (data) => {
    if (data) {
      this.setState({
        targetNames: data,
      });
    } else {
      this.setState({
        targetNames: [],
      })
    }
  }

  handleOpenDialog = () => {
    this.setState({
      dialogOpen: true,
    });
  }

  handleCloseDialog = () => {
    this.setState({
      dialogOpen: false,
    });
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handleCreateTarget = (targetFiles) => {
    api.createFittingTarget(this.state.dialogTargetName, this.state.dialogTargetType, targetFiles);
    this.update();
    this.resetDialog();
  }

  handleDeleteTarget = (targetName) => () => {
    api.deleteFittingTarget(targetName);
    this.update();
  }

  resetDialog = () => {
    this.setState({
      dialogOpen: false,
      dialogTargetName: '',
      dialogTargetType: '',
      wizardOpen: false,
    })
  }

  handleLaunchWizard = () => {
    this.setState({
      dialogOpen: false,
      wizardOpen: true,
    })
  }

  handleCloseWizard = () => {
    this.setState({
      wizardOpen: false,
    })
  }

  render() {
    const { classes } = this.props;
    const { targetNames, dialogOpen, dialogTargetName, dialogTargetType, wizardOpen } = this.state;
    const isRunning = (this.props.status === RunningStatus.running);
    const targetNameExists = (targetNames.indexOf(dialogTargetName) !== -1);
    const isValidTargetName = /^\w+$/.test(dialogTargetName);
    const validTargetTypes = Object.keys(targetWizards);

    const createDialog = (<Dialog open={dialogOpen} onClose={this.handleCloseDialog} fullWidth>
      <DialogTitle>Create New Target</DialogTitle>
      <DialogContent>
        <Grid container>
          <GridItem xs={6} sm={6} md={6}>
            <TextField
              autoFocus
              fullWidth
              label="Target Name"
              margin="normal"
              value={dialogTargetName}
              onChange={this.handleChange('dialogTargetName')}
              error={!isValidTargetName || targetNameExists}
              helperText={isValidTargetName ? (targetNameExists ? "Target name exists" : 'Target name available') : "Invalid target name"}
            />
          </GridItem>
          <GridItem xs={6} sm={6} md={6}>
            <TextField
              id="select-target-type"
              select
              fullWidth
              margin="normal"
              label="Target Type"
              value={dialogTargetType}
              onChange={this.handleChange('dialogTargetType')}
              error={!dialogTargetType}
            >
              {validTargetTypes.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </GridItem>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={this.handleCloseDialog} >
          Cancel
      </Button>
        <Button
          onClick={this.handleLaunchWizard}
          disabled={!isValidTargetName || targetNameExists || !dialogTargetType}
          color='success'
        >
          Launch Target Wizard
      </Button>
      </DialogActions>
    </Dialog>);

    const Wizard = targetWizards[dialogTargetType];
    const wizardDialog = wizardOpen ? (<Dialog open={wizardOpen} maxWidth='md' fullWidth>
      <Wizard targetName={dialogTargetName} onClose={this.handleCloseWizard} onCreate={this.handleCreateTarget}/>
    </Dialog>) : <div/>;

    return (<Card>
      <CardContent>
        <div className={classes.title}>Add targets then click to change target options</div>
        <Grid container className={classes.header}>
          <GridItem xs={5} sm={5} md={5}>
            <div>Name</div>
          </GridItem>
          <GridItem xs={4} sm={4} md={4}>
            <div>Type</div>
          </GridItem>
          <GridItem xs={3} sm={3} md={3}>
            <div>Weight</div>
          </GridItem>
        </Grid>
        {targetNames.map(name => {
          return <FBtarget name={name} disabled={isRunning} handleDeleteTarget={this.handleDeleteTarget} key={name} />;
        })}
        <Button
          onClick={this.handleOpenDialog}
          disabled={isRunning}
          color='success'
        >
          <AddCircleIcon />
          Create New Target
        </Button>
      </CardContent>
      {createDialog}
      {wizardDialog}
    </Card>);
  }
}

TargetInput.propTypes = {
  classes: PropTypes.object.isRequired,
  status: PropTypes.number,
};

export default withStyles(styles)(TargetInput);
