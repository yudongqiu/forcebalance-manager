import React from "react";
import PropTypes from 'prop-types';
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import InputAdornment from '@material-ui/core/InputAdornment';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelActions from '@material-ui/core/ExpansionPanelActions';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
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
import EnhancedTable from "components/Table/EnhancedTable";
// Models
import api from "../../api";
import { RunningStatus } from "../../constants";

const styles = {
  input: {
    display: 'none',
  },
  title: {
    marginBottom: 15,
    fontSize: 14,
  },
  formControl: {
    marginBottom: 15,
  },
};

class FFInput extends React.Component {
  state = {
    fileName: '',
    paramNames: [],
    paramValues: [],
    paramPriors: [],
    ffText: null,
    paramPriorRules: [],
  }

  selectForceFieldFile = event => {
    const file = event.target.files[0];
    if (file) {
      this.setState({
        fileName: file.name,
      });
      api.uploadForceFieldFile(file, this.update);
    }
  }

  componentDidMount() {
    api.onChangeProjectName(this.update);
    this.update();
  }

  componentWillUnmount() {
    api.removeOnChangeProjectName(this.update);
  }

  update = () => {
    api.getForceFieldInfo(this.updateForceFieldInfo);
  }

  updateForceFieldInfo = (data) => {
    if (data) {
      this.setState({
        fileName: data.filenames[0],
        paramNames: data.plist,
        paramValues: data.pvals,
        paramPriors: data.priors,
        ffText: data.raw_text,
        paramPriorRules: data.prior_rules,
      });
    } else {
      this.setState({
        fileName: '',
        paramNames: [],
        paramValues: [],
        paramPriors: [],
        ffText: null,
        paramPriorRules: [],
      });
    }
  }

  addPriorRule = () => {
    const paramPriorRules = JSON.parse(JSON.stringify(this.state.paramPriorRules));
    paramPriorRules.push(['', '']);
    this.setState({
      paramPriorRules: paramPriorRules,
    });
  }

  updatePriorRuleName = index => (event) => {
    const paramPriorRules = JSON.parse(JSON.stringify(this.state.paramPriorRules));
    paramPriorRules[index][0] = event.target.value;
    this.setState({
      paramPriorRules: paramPriorRules,
    });
  }

  updatePriorRuleValue = index => (event) => {
    const paramPriorRules = JSON.parse(JSON.stringify(this.state.paramPriorRules));
    paramPriorRules[index][1] = event.target.value;
    this.setState({
      paramPriorRules: paramPriorRules,
    });
  }

  deletePriorRule = index => (event) => {
    let paramPriorRules = JSON.parse(JSON.stringify(this.state.paramPriorRules));
    paramPriorRules.splice(index, 1);
    this.setState({
      paramPriorRules: paramPriorRules,
    });
  }

  applyPriorRules = () => {
    const paramPriorRules = this.state.paramPriorRules;
    api.uploadPriorRules(paramPriorRules);
    this.update();
  }

  render () {
    const { classes } = this.props;
    const { fileName, ffText, paramNames, paramValues, paramPriors, paramPriorRules } = this.state;
    const isRunning = (this.props.status === RunningStatus.running);
    const isValidPriorRules = paramPriorRules.every((rule) => {return rule[0] && rule[1] && !isNaN(rule[1])});

    return (<Card elevation={0}>
      <CardContent>
        <div className={classes.title}>Upload a force field file and enter prior rules</div>
        <FormControl className={classes.formControl} fullWidth>
          <InputLabel htmlFor="ff-file">Input Force Field File</InputLabel>
          <Input
            id="ff-file"
            value={fileName}
            onChange={null}
            endAdornment={
              <InputAdornment position="end">
                <input type="file" id="ff-file-upload" className={classes.input} onChange={this.selectForceFieldFile} />
                <label htmlFor="ff-file-upload">
                  <IconButton component="span" disabled={isRunning}>
                    <FileUploadIcon />
                  </IconButton>
                </label>
              </InputAdornment>
            }
            error={fileName==''}
          />
        </FormControl>
        {ffText ?
          <ExpansionPanel className={classes.expansionPanel} CollapseProps={{timeout: 500}} >
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              View File Contents
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <pre>{ffText}</pre>
            </ExpansionPanelDetails>
          </ExpansionPanel>
          : null
        }
        {paramNames && paramNames.length > 0 ?
          <ExpansionPanel className={classes.expansionPanel} CollapseProps={{timeout: 500}} >
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              Prior Width Rules
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <Grid container>
                {paramPriorRules.map((pRule, index) => {
                  return (
                    <Grid container key={index}>
                      <GridItem xs={12} sm={8} md={8}>
                        <TextField
                          helperText="rule"
                          onChange={this.updatePriorRuleName(index)}
                          value={pRule[0]}
                          error={pRule[0] === ''}
                          fullWidth
                        />
                      </GridItem>
                      <GridItem xs={10} sm={3} md={3}>
                        <TextField
                          helperText="value"
                          onChange={this.updatePriorRuleValue(index)}
                          value={pRule[1]}
                          error={pRule[1] === '' || isNaN(pRule[1])}
                          fullWidth
                        />
                      </GridItem>
                      <GridItem xs={2} sm={1} md={1}>
                        <Tooltip title="Delete Rule">
                          <IconButton color="secondary" onClick={this.deletePriorRule(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </GridItem>
                    </Grid>
                  );
                })}
                <GridItem xs={10} sm={11} md={11} />
                <GridItem xs={2} sm={1} md={1}>
                  <Tooltip title="Add Rule">
                    <IconButton color="primary" onClick={this.addPriorRule}>
                      <AddCircleIcon />
                    </IconButton>
                  </Tooltip>
                </GridItem>
              </Grid>
            </ExpansionPanelDetails>
            <ExpansionPanelActions>
              <Button color="primary" variant="contained" onClick={this.applyPriorRules} disabled={!isValidPriorRules}>Apply</Button>
            </ExpansionPanelActions>
          </ExpansionPanel>
          : null
        }
        {paramNames && paramNames.length > 0 ?
          <EnhancedTable
            tableHead={["#", "Parameter", "Value", "Prior Width"]}
            data={paramNames.map((name, index) => {
              return [index.toString(), name, paramValues[index], paramPriors[index]]
            })}
            title="Force Field Parameters"
          />
          : null
        }
      </CardContent>
    </Card>);
  }
}

FFInput.propTypes = {
  classes: PropTypes.object.isRequired,
  status: PropTypes.number,
};

export default withStyles(styles)(FFInput);