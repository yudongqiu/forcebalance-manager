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

class AbinitioSMIRNOFFWizard extends React.Component {
  state = {
    activeStep: 0,
    completed: {},
    mol2FileName: '',
    pdbFileName: '',
    qdataFileName: '',
    coordsFileName: '',
    targetType: 'ABINITIO_SMIRNOFF',
    mviewFile: null,
    mol2Data: null,
    pdbData: null,
    qdataData: null,
    coordsData: null,
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

  selectCoordsFile = event => {
    const file = event.target.files[0];
    if (file) {
      this.setState({
        coordsFileName: file.name,
        mviewFile: file,
      });
      this.coordsFile = file;
      api.validate_target_file(this.props.targetName, this.state.targetType, [file], 'coords', this.updateCoordsValidationResult);
    }
  }

  updateCoordsValidationResult = (data) => {
    const { completed } = this.state;
    if (data) {
      completed[0] = data.success;
      this.setState({
        completed,
        coordsData: data,
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

  selectMol2File = event => {
    const file = event.target.files[0];
    if (file) {
      this.setState({
        mol2FileName: file.name,
      });
      this.mol2File = file;
      api.validate_target_file(this.props.targetName, this.state.targetType, [file], 'mol2', this.updateMol2ValidationResult);
    }
  }

  updateMol2ValidationResult = (data) => {
    if (data) {
      this.setState({
        mol2Data: data,
      });
      const { completed, pdbData } = this.state;
      completed[2] = (data.success && pdbData && pdbData.success)
      this.setState({
        completed
      });
    }
  }

  selectPDBFile = event => {
    const file = event.target.files[0];
    if (file) {
      this.setState({
        pdbFileName: file.name,
      });
      this.pdbFile = file;
      api.validate_target_file(this.props.targetName, this.state.targetType, [file], 'pdb', this.updatePDBValidationResult);
    }
  }

  updatePDBValidationResult = (data) => {
    if (data) {
      this.setState({
        pdbData: data,
      });
      const { completed, mol2Data } = this.state;
      completed[2] = (data.success && mol2Data && mol2Data.success)
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
    const targetFiles = [this.coordsFile, this.qdataFile, this.mol2File, this.pdbFile];
    this.props.onCreate(targetFiles);
  }

  render() {
    const { classes } = this.props;
    const { activeStep, completed, coordsFileName, qdataFileName, mol2FileName, pdbFileName,
      mviewFile, coordsData, qdataData, mol2Data, pdbData, finalData, confirmDialogOpen } = this.state;

    const minfo = [];
    if (activeStep >= 0) {
      const resultChip = coordsData ? <Chip
        label={coordsData.success ? "Success" : "Failed"}
        deleteIcon={<DoneIcon />}
        clickable={false}
        color={coordsData.success ? 'primary' : 'secondary'}
      /> : null;
      const coordsInfoCard = <Paper className={classes.paper} key='coordsInfoCard'>
        {coordsData ? <div>
          <div className={classes.section}>coords file validate: {resultChip}</div>
          {coordsData.n_shots ? <div className={classes.subsection}>Number of frames: {coordsData.n_shots}</div> : null}
          {coordsData.n_atoms ? <div className={classes.subsection}>Number of atoms: {coordsData.n_atoms}</div> : null}
          {coordsData.error ? <div className={classes.subsection}>Error: {coordsData.error}</div> : null}
        </div> :
          <div>coords file not uploaded yet</div>}
      </Paper>
      minfo.push(coordsInfoCard);
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
      const mol2ResultChip = mol2Data ? <Chip
        label={mol2Data.success ? "Success" : "Failed"}
        deleteIcon={<DoneIcon />}
        clickable={false}
        color={mol2Data.success ? 'primary' : 'secondary'}
      /> : null;
      const mol2InfoCard = <Paper className={classes.paper} key='mol2InfoCard'>
        {mol2Data ? <div>
          <div className={classes.section}>mol2 file validate: {mol2ResultChip}</div>
          {mol2Data.error ? <div className={classes.subsection}>Error: {mol2Data.error}</div> : null}
        </div> :
          <div className={classes.section}>mol2 file not uploaded yet</div>}
      </Paper>
      minfo.push(mol2InfoCard);
      const pdbResultChip = pdbData ? <Chip
        label={pdbData.success ? "Success" : "Failed"}
        deleteIcon={<DoneIcon />}
        clickable={false}
        color={pdbData.success ? 'primary' : 'secondary'}
      /> : null;
      const pdbInfoCard = <Paper className={classes.paper} key='pdbInfoCard'>
        {pdbData ? <div>
          <div className={classes.section}>pdb file validate: {pdbResultChip}</div>
          {coordsData.error ? <div className={classes.subsection}>Error: {pdbData.error}</div> : null}
        </div> :
          <div className={classes.section}>pdb file not uploaded yet</div>}
      </Paper>
      minfo.push(pdbInfoCard);
    }
    const pdbString = coordsData? coordsData.pdbString : null;
    const mview = <MoleculeViewer file={mviewFile} pdbString={pdbString} />;

    const coordsUploadPage = (
      <div className={classes.fullWidth} >
        <FormControl fullWidth>
          <InputLabel htmlFor="coords-file">Target Geometry File (.xyz or .gro)</InputLabel>
          <Input
            id="coords-file"
            value={coordsFileName}
            onChange={null}
            endAdornment={
              <InputAdornment position="end">
                <input type="file" id="coords-file-upload" accept=".xyz,.XYZ,.gro,.GRO,.pdb,.PDB" className={classes.input} onChange={this.selectCoordsFile} />
                <label htmlFor="coords-file-upload">
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

    const mol2pdbUploadPage = (
      <div className={classes.fullWidth} >
        <div style={{ width: '100%', display: 'flex' }} >
          <div style={{ width: '50%' }} >
            <FormControl fullWidth>
              <InputLabel htmlFor="mol2-file">GMX mol2 file (.mol2)</InputLabel>
              <Input
                id="mol2-file"
                value={mol2FileName}
                onChange={null}
                endAdornment={
                  <InputAdornment position="end">
                    <input type="file" id="mol2-file-upload" accept=".mol2" className={classes.input} onChange={this.selectMol2File} />
                    <label htmlFor="mol2-file-upload">
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
              <InputLabel htmlFor="pdb-file">OpenMM pdb file (.pdb)</InputLabel>
              <Input
                id="pdb-file"
                value={pdbFileName}
                onChange={null}
                endAdornment={
                  <InputAdornment position="end">
                    <input type="file" id="pdb-file-upload" accept=".pdb" className={classes.input} onChange={this.selectPDBFile} />
                    <label htmlFor="pdb-file-upload">
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


    const stepContents = [coordsUploadPage, qdataUploadPage, mol2pdbUploadPage, finalTestPage];

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
                Upload mol2, pdb File
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

AbinitioSMIRNOFFWizard.propTypes = {
  classes: PropTypes.object.isRequired,
  targetName: PropTypes.string.isRequired,
  onClose: PropTypes.any,
  onCreate: PropTypes.any,
};

export default withStyles(styles)(AbinitioSMIRNOFFWizard);
