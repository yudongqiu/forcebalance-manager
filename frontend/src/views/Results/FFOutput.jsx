import React from "react";
import PropTypes from 'prop-types';
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import InputAdornment from '@material-ui/core/InputAdornment';
// import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelActions from '@material-ui/core/ExpansionPanelActions';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Tooltip from '@material-ui/core/Tooltip';
// @material-ui/icons
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import DeleteIcon from '@material-ui/icons/Delete';
// Components
import GridItem from "components/Grid/GridItem.jsx";
import CustomInput from "components/CustomInput/CustomInput.jsx";
import Button from "components/CustomButtons/Button.jsx";
import Table from "components/Table/Table.jsx";
import EnhancedTable from "components/Table/EnhancedTable";
// Models
import api from "../../api";
import { Paper } from "@material-ui/core";

const styles = {
  input: {
    display: 'none',
  },
  title: {
    marginBottom: 16,
    fontSize: 14,
  },
  section: {
    marginBottom: 15,
  }
};

class FFOutput extends React.Component {
  state = {
    fileName: '',
    paramNames: [],
    paramValues: [],
    paramPriors: [],
    ffText: null,
    paramPriorRules: [],
  }

  componentDidMount() {
    api.onChangeProjectName(this.update);
    this.update();
  }

  componentWillUnmount() {
    api.removeOnChangeProjectName(this.update);
  }

  update = () => {
    api.getFinalForceFieldInfo(this.updateForceFieldInfo);
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

  downloadForceFieldFile = () => {
    const { fileName, ffText } = this.state;
    const element = document.createElement("a");
    const file = new Blob([ffText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }

  render () {
    const { classes } = this.props;
    const { fileName, ffText, paramNames, paramValues, paramPriors, paramPriorRules } = this.state;

    return (
      <CardContent>
        <div className={classes.section}>
            {fileName} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <Button onClick={this.downloadForceFieldFile} color='success'>Download</Button>
        </div>
        <div className={classes.section}>
          {paramNames && paramNames.length > 0 ?
            <EnhancedTable
              tableHead={["#", "Parameter", "Value", "Prior Width"]}
              data={paramNames.map((name, index) => {
                return [(index+1).toString(), name, paramValues[index].toString(), paramPriors[index].toString()]
              })}
              title="Final Force Field Parameters"
            />: "No parameters found"
          }
        </div>
        {ffText ?
          <ExpansionPanel>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              View File Contents
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <pre>{ffText}</pre>
            </ExpansionPanelDetails>
          </ExpansionPanel>
          : null
        }
        {paramPriorRules && paramPriorRules.length > 0 ?
          <ExpansionPanel>
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
                          value={pRule[0]}
                          error={pRule[0] === ''}
                          disabled
                          fullWidth
                        />
                      </GridItem>
                      <GridItem xs={10} sm={3} md={3}>
                        <TextField
                          helperText="value"
                          value={pRule[1]}
                          error={pRule[1] === '' || isNaN(pRule[1])}
                          disabled
                          fullWidth
                        />
                      </GridItem>
                    </Grid>
                  );
                })}
              </Grid>
            </ExpansionPanelDetails>
          </ExpansionPanel>
          : null
        }
      </CardContent>
    );
  }
}

FFOutput.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(FFOutput);