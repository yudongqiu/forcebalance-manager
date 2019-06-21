import React from "react";
import PropTypes from 'prop-types';
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import InputAdornment from '@material-ui/core/InputAdornment';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Chip from '@material-ui/core/Chip';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepButton from '@material-ui/core/StepButton';
import StepContent from '@material-ui/core/StepContent';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Avatar from '@material-ui/core/Avatar';
import red from '@material-ui/core/colors/red';
import green from '@material-ui/core/colors/green';
// @material-ui/icons
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FileUploadIcon from "@material-ui/icons/CloudUpload";
import AddCircleIcon from '@material-ui/icons/AddCircle';
import DeleteIcon from '@material-ui/icons/Delete';
import DoneIcon from '@material-ui/icons/Done';
import ErrorIcon from '@material-ui/icons/Error';
// Components
import GridItem from "components/Grid/GridItem.jsx";
import CustomInput from "components/CustomInput/CustomInput.jsx";
import Table from "components/Table/Table.jsx";
import MoleculeViewer from "components/MoleculeViewer/MoleculeViewer.jsx";
// Models
import api from "../../../api";
import { RunningStatus } from "../../../constants";

const styles = {
  iconSmall: {
    padding: 0,
    margin: 0,
    fontSize: 12,
  },
  contentWrapper: {
    margin: 20,
    minHeight: 400,
  },
  input: {
    display: 'none',
  },
  paper: {
    margin: 10,
    padding: 10,
    backgroundColor: '#EEEEEE',
  },
  fullWidth: {
    width: '100%',
    height: '100%',
  },
  section: {
    marginBottom: 5,
  },
  greenAvatar: {
    margin: 10,
    color: '#fff',
    backgroundColor: green[500],
  },
  redAvatar: {
    margin: 10,
    color: '#fff',
    backgroundColor: red[500],
  },
  center: {
    height: 300,
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '20%',
  },
  title: {
    fontSize: 20,
    paddingTop: 16,
  }
};

class AbinitioGMXWizard extends React.Component {
  state = {
    activeStep: 0,
    completed: {},
    groFileName: '',
    qdataFileName: '',
    mdpFileName: '',
    topFileName: '',
    targetType: 'ABINITIO_GMX',
    groData: null,
    qdataData: null,
    mdpData: null,
    topData: null,
    finalData: null,
    confirmDialogOpen: false,
  }

  handleStep = step => () => {
    this.setState({
      activeStep: step,
    });
  };

  handleBack = () => {
    this.setState(state => ({
      activeStep: state.activeStep - 1,
    }));
  };

  handleNext = () => {
    this.setState(state => ({
      activeStep: state.activeStep + 1,
    }));
  };

  selectGroFile = event => {
    const file = event.target.files[0];
    if (file) {
      this.setState({
        groFileName: file.name,
      });
      this.groFile = file;
      api.validate_target_file(this.props.targetName, this.state.targetType, [file], 'gro', this.updateGroValidationResult);
    }
  }

  updateGroValidationResult = (data) => {
    const { completed } = this.state;
    if (data) {
      completed[0] = data.success;
      this.setState({
        completed,
        groData: data,
      });
    }
  }

  selectQdataFile = event => {
    const file = event.target.files[0];
    if (file) {
      this.setState({
        qdataFileName: file.name,
      });
      this.qdataFile = file;
      api.validate_target_file(this.props.targetName, this.state.targetType, [file], 'qdata', this.updateQdataValidationResult);
    }
  }

  updateQdataValidationResult = (data) => {
    const { completed } = this.state;
    if (data) {
      completed[1] = data.success;
      this.setState({
        completed,
        qdataData: data,
      });
    }
  }

  selectMdpFile = event => {
    const file = event.target.files[0];
    if (file) {
      this.setState({
        mdpFileName: file.name,
      });
      this.mdpFile = file;
      api.validate_target_file(this.props.targetName, this.state.targetType, [file], 'mdp', this.updateMdpValidationResult);
    }
  }

  updateMdpValidationResult = (data) => {
    if (data) {
      this.setState({
        mdpData: data,
      });
      const { completed, topData } = this.state;
      completed[2] = (data.success && topData && topData.success)
      this.setState({
        completed
      });
    }
  }

  selectTopFile = event => {
    const file = event.target.files[0];
    if (file) {
      this.setState({
        topFileName: file.name,
      });
      this.topFile = file;
      api.validate_target_file(this.props.targetName, this.state.targetType, [file], 'top', this.updateTopValidationResult);
    }
  }

  updateTopValidationResult = (data) => {
    if (data) {
      this.setState({
        topData: data,
      });
      const { completed, mdpData } = this.state;
      completed[2] = (data.success && mdpData && mdpData.success)
      this.setState({
        completed
      });
    }
  }

  handleFinalValidate = () => {
    api.validate_target_create(this.props.targetName, this.updateFinalValidateResult);
  }

  updateFinalValidateResult = (data) => {
    const { completed } = this.state;
    if (data) {
      completed[3] = data.success;
      this.setState({
        completed,
        finalData: data,
        activeStep: 3,
      })
    }
  }

  handleAbort = () => {
    if (this.state.completed[0]) {
      this.setState({
        confirmDialogOpen: true,
      })
    } else {
      this.props.onClose();
    }
  }

  handleCloseConfirmDialog = () => {
    this.setState({
      confirmDialogOpen: false,
    })
    api.createFittingTarget(this.state.dialogTargetName, this.state.dialogTargetType, this.selectedTargetFiles);
  }

  handleConfirmDialog = () => {
    this.setState({
      confirmDialogOpen: false,
    });
    this.props.onClose();
  }

  handleCreate = () => {
    const targetFiles = [this.groFile, this.qdataFile, this.mdpFile, this.topFile];
    this.props.onCreate(targetFiles);
  }

  render() {
    const { classes } = this.props;
    const { activeStep, completed, groFileName, qdataFileName, mdpFileName, topFileName,
      groData, qdataData, mdpData, topData, finalData, confirmDialogOpen } = this.state;

    const minfo = [];
    if (activeStep >= 0) {
      const resultChip = groData ? <Chip
        label={groData.success ? "Success" : "Failed"}
        deleteIcon={<DoneIcon />}
        clickable={false}
        color={groData.success ? 'primary' : 'secondary'}
      /> : null;
      const groInfoCard = <Paper className={classes.paper} key='groInfoCard'>
        {groData ? <div>
          <div className={classes.section}>gro file validate: {resultChip}</div>
          {groData.n_shots ? <div className={classes.subsection}>Number of frames: {groData.n_shots}</div> : null}
          {groData.n_atoms ? <div className={classes.subsection}>Number of atoms: {groData.n_atoms}</div> : null}
          {groData.error ? <div className={classes.subsection}>Error: {groData.error}</div> : null}
        </div> :
          <div>gro file not uploaded yet</div>}
      </Paper>
      minfo.push(groInfoCard);
    }
    if (activeStep >= 1) {
      const resultChip = qdataData ? <Chip
        label={qdataData.success ? "Success" : "Failed"}
        deleteIcon={<DoneIcon />}
        clickable={false}
        color={qdataData.success ? 'primary' : 'secondary'}
      /> : null;
      const gdataInfoCard = <Paper className={classes.paper} key='qdataInfoCard'>
        {qdataData ? <div>
          <div className={classes.section}>qdata file validate: {resultChip}</div>
          {qdataData.n_energies ? <div className={classes.subsection}>Number of QM energies: {qdataData.n_energies}</div> : null}
          {qdataData.n_grads ? <div className={classes.subsection}>Number of QM gradiants: {qdataData.n_grads}</div> : null}
          {qdataData.error ? <div className={classes.subsection}>Error: {qdataData.error}</div> : null}
        </div> :
          <div className={classes.section}>qdata file not uploaded yet</div>}
      </Paper>
      minfo.push(gdataInfoCard);
    }
    if (activeStep >= 2) {
      const mdpResultChip = mdpData ? <Chip
        label={mdpData.success ? "Success" : "Failed"}
        deleteIcon={<DoneIcon />}
        clickable={false}
        color={mdpData.success ? 'primary' : 'secondary'}
      /> : null;
      const mdpInfoCard = <Paper className={classes.paper} key='mdpInfoCard'>
        {mdpData ? <div>
          <div className={classes.section}>mdp file validate: {mdpResultChip}</div>
          {mdpData.error ? <div className={classes.subsection}>Error: {mdpData.error}</div> : null}
        </div> :
          <div className={classes.section}>mdp file not uploaded yet</div>}
      </Paper>
      minfo.push(mdpInfoCard);
      const topResultChip = topData ? <Chip
        label={topData.success ? "Success" : "Failed"}
        deleteIcon={<DoneIcon />}
        clickable={false}
        color={topData.success ? 'primary' : 'secondary'}
      /> : null;
      const topInfoCard = <Paper className={classes.paper} key='topInfoCard'>
        {topData ? <div>
          <div className={classes.section}>top file validate: {topResultChip}</div>
          {groData.error ? <div className={classes.subsection}>Error: {topData.error}</div> : null}
        </div> :
          <div className={classes.section}>top file not uploaded yet</div>}
      </Paper>
      minfo.push(topInfoCard);
    }

    const pdbString = groData? groData.pdbString : null;
    const mview = <MoleculeViewer pdbString={pdbString} title={groFileName}/>;

    const groUploadPage = (
      <div className={classes.fullWidth} >
        <FormControl fullWidth>
          <InputLabel htmlFor="gro-file">Target Geometry File (.gro)</InputLabel>
          <Input
            id="gro-file"
            value={groFileName}
            onChange={null}
            endAdornment={
              <InputAdornment position="end">
                <input type="file" id="gro-file-upload" accept=".gro,.GRO" className={classes.input} onChange={this.selectGroFile} />
                <label htmlFor="gro-file-upload">
                  <IconButton component="span">
                    <FileUploadIcon />
                  </IconButton>
                </label>
              </InputAdornment>
            }
          />
        </FormControl>
        <div style={{ width: '100%', overflow: 'auto', paddingTop: 15 }} >
          <div style={{ float: 'left', width: '40%' }} >
            {minfo}
          </div>
          <div style={{ float: 'right', width: '60%' }} >
            {mview}
          </div>
        </div>
      </div>
    );

    const qdataUploadPage = (
      <div className={classes.fullWidth} >
        <FormControl fullWidth>
          <InputLabel htmlFor="qdata-file">Target qdata file (qdata.txt)</InputLabel>
          <Input
            id="qdata-file"
            value={qdataFileName}
            onChange={null}
            endAdornment={
              <InputAdornment position="end">
                <input type="file" id="qdata-file-upload" accept=".txt" className={classes.input} onChange={this.selectQdataFile} />
                <label htmlFor="qdata-file-upload">
                  <IconButton component="span">
                    <FileUploadIcon />
                  </IconButton>
                </label>
              </InputAdornment>
            }
          />
        </FormControl>
        <div style={{ width: '100%', overflow: 'auto', paddingTop: 15 }} >
          <div style={{ float: 'left', width: '40%' }} >
            {minfo}
          </div>
          <div style={{ float: 'right', width: '60%' }} >
            {mview}
          </div>
        </div>
      </div>);

    const mdptopUploadPage = (
      <div className={classes.fullWidth} >
        <div style={{ width: '100%', display: 'flex' }} >
          <div style={{ width: '50%' }} >
            <FormControl fullWidth>
              <InputLabel htmlFor="mdp-file">GMX mdp file (.mdp)</InputLabel>
              <Input
                id="mdp-file"
                value={mdpFileName}
                onChange={null}
                endAdornment={
                  <InputAdornment position="end">
                    <input type="file" id="mdp-file-upload" accept=".mdp" className={classes.input} onChange={this.selectMdpFile} />
                    <label htmlFor="mdp-file-upload">
                      <IconButton component="span">
                        <FileUploadIcon />
                      </IconButton>
                    </label>
                  </InputAdornment>
                }
                style={{ width: '90%' }}
              />
            </FormControl>
          </div>
          <div style={{ width: '50%' }} >
            <FormControl fullWidth>
              <InputLabel htmlFor="top-file">GMX topology file (.top)</InputLabel>
              <Input
                id="top-file"
                value={topFileName}
                onChange={null}
                endAdornment={
                  <InputAdornment position="end">
                    <input type="file" id="top-file-upload" accept=".top" className={classes.input} onChange={this.selectTopFile} />
                    <label htmlFor="top-file-upload">
                      <IconButton component="span">
                        <FileUploadIcon />
                      </IconButton>
                    </label>
                  </InputAdornment>
                }
                style={{ width: '90%' }}
              />
            </FormControl>
          </div>
        </div>
        <div style={{ width: '100%', overflow: 'auto', paddingTop: 15 }} >
          <div style={{ float: 'left', width: '40%' }} >
            {minfo}
          </div>
          <div style={{ float: 'right', width: '60%' }} >
            {mview}
          </div>
        </div>
      </div>
    );

    let finalTestPage = <div />;
    if (activeStep == 3) {
      const success = finalData.success;
      const avatar = <Avatar className={success ? classes.greenAvatar: classes.redAvatar}>
        {success ? <DoneIcon /> : <ErrorIcon />}
      </Avatar>
      const msg = <div className={classes.title}>
        {success ? 'Congratulations! Target validated succesfully and can be created now' : 'Oops! ' + finalData.error}
      </div>;
      finalTestPage =
        <div className={classes.center} >
          {avatar}
          {msg}
        </div>;
    }


    const stepContents = [groUploadPage, qdataUploadPage, mdptopUploadPage, finalTestPage];

    let nextButton = <Button variant="contained" color="primary" onClick={this.handleNext} disabled={!completed[activeStep]}>Next</Button>;
    if (activeStep == stepContents.length - 2) {
      nextButton = <Button variant="contained" color="primary" onClick={this.handleFinalValidate} disabled={!completed[activeStep]}>Validate</Button>;
    } else if (activeStep == stepContents.length - 1) {
      nextButton = <Button variant="contained" color="primary" onClick={this.handleCreate} disabled={!completed[activeStep]}>Create</Button>
    }

    const confirmDialog = <Dialog
      open={confirmDialogOpen}
      onClose={this.handleCloseConfirmDialog}
    >
      <DialogTitle>{"Abort the wizard?"}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Abort wizard will lose current progress. Confirm?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={this.handleCloseConfirmDialog} color="default" autoFocus>
          Cancel
      </Button>
        <Button onClick={this.handleConfirmDialog} color="secondary">
          Confirm
      </Button>
      </DialogActions>
    </Dialog>;

    return (
      <Card>
        <CardContent>
          <Stepper nonLinear activeStep={activeStep}>
            <Step>
              <StepButton
                onClick={this.handleStep(0)}
                completed={completed[0]}
                disabled={true}
              >
                Upload Geometry File
              </StepButton>
            </Step>
            <Step>
              <StepButton
                onClick={this.handleStep(1)}
                completed={completed[1]}
                disabled={true}
              >
                Upload qdata File
              </StepButton>
            </Step>
            <Step>
              <StepButton
                onClick={this.handleStep(2)}
                completed={completed[2]}
                disabled={true}
              >
                Upload mdp, top File
              </StepButton>
            </Step>
            <Step>
              <StepButton
                onClick={this.handleStep(3)}
                completed={completed[3]}
                disabled={true}
              >
                Final Test Create
              </StepButton>
            </Step>
          </Stepper>
          <div className={classes.contentWrapper} >
            {stepContents[activeStep]}
          </div>
        </CardContent>
        <CardActions>
          <Button onClick={this.handleAbort} variant="contained" color="secondary" style={{marginRight: 30}}>Abort</Button>
          {nextButton}
        </CardActions>
        {confirmDialog}
      </Card>
    );
  }
}

AbinitioGMXWizard.propTypes = {
  classes: PropTypes.object.isRequired,
  targetName: PropTypes.string.isRequired,
  onClose: PropTypes.any,
  onCreate: PropTypes.any,
};

export default withStyles(styles)(AbinitioGMXWizard);
