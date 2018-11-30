import React from "react";
import PropTypes from 'prop-types';
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import InputAdornment from '@material-ui/core/InputAdornment';
import Divider from '@material-ui/core/Divider';
// import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelActions from '@material-ui/core/ExpansionPanelActions';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Tooltip from '@material-ui/core/Tooltip';
import Checkbox from '@material-ui/core/Checkbox';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Chip from '@material-ui/core/Chip';
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
// Models
import api from "../../api";
import { RunningStatus } from "../../constants";

const styles = {
  iconSmall: {
    padding: 0,
    margin: 0,
    fontSize: 12,
  }
};

const targetTypeOption = {
  'ABINITIO_GMX': AbinitioGMXOption,
}

class FBtarget extends React.Component {
    state = {
      weight: '1.0',
      fileNames: [],
    }

    updateTargetOptions = (data) => {
      this.setState(data);
    }

    update = () => {
      api.getTargetOptions(this.props.name, this.updateTargetOptions);
    }

    componentDidMount() {
      this.update();
    }

    handleSetTargetOption = (event) => {
      const update = {[event.target.name]: event.target.value};
      api.setTargetOptions(this.props.name, update);
      this.setState(update);
    }

    handleOptionCheckBox = (key) => (event) => {
      const update = {[key]: event.target.checked};
      api.setTargetOptions(this.props.name, update);
      this.setState(update);
    }

    render () {
      const { classes } = this.props;
      const { type, weight, fileNames } = this.state;
      const name = this.props.name;
      const isValidWeight = (weight !== '' && !isNaN(weight) && parseFloat(weight) >= 0);
      const SpecificTargetOptions = targetTypeOption[type];
      return (
        <ExpansionPanel>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Grid container>
              <GridItem xs={5} sm={5} md={5}>
                <div className={classes.center}>{name}</div>
              </GridItem>
              <GridItem xs={4} sm={4} md={4}>
                <div className={classes.center}>{type}</div>
              </GridItem>
              <GridItem xs={3} sm={3} md={3}>
                <div className={classes.center}>{weight}</div>
              </GridItem>
            </Grid>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Grid container>
              <GridItem xs={8} sm={8} md={8}>
                {/* <FormControl fullWidth>
                  <InputLabel htmlFor="files-chip">Uploaded Files</InputLabel>
                  <Input id="files-chip" onChange={null} value={fileNames} />

                </FormControl> */}
                Uploaded Files:
                {fileNames.map(f => {
                      return (
                        <Chip key={f} label={f} />
                      );
                })}
              </GridItem>
              <GridItem xs={4} sm={4} md={4}>
                <TextField
                  name="weight"
                  type="number"
                  helperText="Weight"
                  onChange={this.handleSetTargetOption}
                  value={weight}
                  error={!isValidWeight}
                />
              </GridItem>
              {SpecificTargetOptions ?
                <SpecificTargetOptions target={this} />
                : null
              }
            </Grid>
          </ExpansionPanelDetails>
          <ExpansionPanelActions>
              <Button color="danger" onClick={this.props.handleDeleteTarget(this.props.name)} >
                <DeleteIcon />
                Delete Target
              </Button>
          </ExpansionPanelActions>
        </ExpansionPanel>
      );
    }
  }

FBtarget.propTypes = {
  classes: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  handleDeleteTarget: PropTypes.func,
};

export default withStyles(styles)(FBtarget);

function AbinitioGMXOption(props) {
  const target = props.target;
  const w_energy = target.state.w_energy;
  const w_force = target.state.w_force;
  const valid_w_energy = (w_energy !== '' && !isNaN(w_energy) && parseFloat(w_energy) >= 0);
  const valid_w_force = (w_force !== '' && !isNaN(w_force) && parseFloat(w_force) >= 0);
  return (
    <Grid container>
      <GridItem xs={6} sm={6} md={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={target.state.energy}
              onChange={target.handleOptionCheckBox('energy')}
              color="primary"
            />
          }
          label="Fit Energy"
        />
      </GridItem>
      <GridItem xs={6} sm={6} md={6}>
        <TextField
          name="w_energy"
          type="number"
          helperText="Weight Energy"
          onChange={target.handleSetTargetOption}
          value={target.state.w_energy}
          error={!valid_w_energy}
        />
      </GridItem>
      <GridItem xs={6} sm={6} md={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={target.state.force}
              onChange={target.handleOptionCheckBox('force')}
              color="primary"
            />
          }
          label="Fit Force"
        />
      </GridItem>
      <GridItem xs={6} sm={6} md={6}>
        <TextField
          name="w_force"
          type="number"
          helperText="Weight Force"
          onChange={target.handleSetTargetOption}
          value={target.state.w_force}
          error={!valid_w_force}
        />
      </GridItem>
    </Grid>
  )
}
