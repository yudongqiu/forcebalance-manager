import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import withStyles from "@material-ui/core/styles/withStyles";
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';

import Slider from 'rc-slider/lib/Slider';
import 'rc-slider/assets/index.css';

import { Stage } from 'ngl';
import { CardContent } from '@material-ui/core';

const styles = {
  paper: {
    margin: 10,
    padding: 10,
    backgroundColor: '#EEEEEE',
  },
  viewer: {
    height: 300,
  },
  title: {
    fontWeight: 400,
  },
  sliderWrapper: {
    width: '100%',
    display: 'flex',
  },
  slider: {
    width: '75%',
    paddingTop: 15,
    paddingLeft: '2.5%',
    paddingRight: '2.5%',
  },
  sliderText: {
    width: '20%',
  },
}

class MoleculeViewer extends React.Component {
  state = {
    numFrames: null,
    numAtoms: null,
    currFrame: 0,
  }

  componentDidMount() {
    this.stage = new Stage("viewport", { backgroundColor: "white" });
    this.stage.viewer.camera.near = 0.0001;
    if (this.props.file)
    this.stage.loadFile(this.props.file, {defaultRepresentation: true, asTrajectory: true}).then( this.loadTraj );
  }

  loadTraj = (o) => {
    this.traj = o.trajList[0].trajectory;
    this.setState({
      numFrames: this.traj.numframes,
      numAtoms: this.traj.atomCount,
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.file !== this.props.file) {
      this.stage.removeAllComponents();
      this.stage.loadFile(this.props.file, {defaultRepresentation: true, asTrajectory: true}).then( this.loadTraj );
    }
  }

  componentWillUnmount() {
    delete this.stage;
  }

  setTrajFrame = (frame) => {
    frame = Math.max(frame, 1);
    if (this.state.numFrames) {
      frame = Math.min(frame, this.state.numFrames)
    }
    if (this.traj) {
      this.traj.setFrame(frame-1);
    }
    this.setState({
      currFrame: frame,
    })
  }

  handleChangeText = (e) => {
    const frame = parseInt(e.target.value);
    if (frame) {
      this.setTrajFrame(frame);
    } else {
      this.setState({
        currFrame: e.target.value
      });
    }
  }

  render() {
    const { classes } = this.props;
    const { numAtoms, numFrames, currFrame } = this.state;
    const enableTrajControl = (numFrames && numFrames > 1);
    const fileInfo = this.props.file ? this.props.file.name + " | " + numAtoms + " Atoms | " + numFrames + " Frames" : "File not loaded";
    return (
      <Paper className={classes.paper}>
          <div className={classes.title}>
            {fileInfo}
          </div>
          <div id="viewport" className={classes.viewer} />
          <div className={classes.sliderWrapper} >
            <div className={classes.slider} >
              <Slider min={1} max={numFrames} onChange={this.setTrajFrame} disabled={!enableTrajControl} />
            </div>
            <div className={classes.sliderText} >
              <TextField
                id="outlined-bare"
                value={currFrame}
                margin="none"
                variant="outlined"
                type="number"
                disabled={!enableTrajControl}
                margin="dense"
                inputProps={{style: {padding: 5}}}
                onChange={this.handleChangeText}
              />
            </div>
          </div>
      </Paper>
    );
  }
}


MoleculeViewer.propTypes = {
  classes: PropTypes.object.isRequired,
  file: PropTypes.object,
};

export default withStyles(styles)(MoleculeViewer);