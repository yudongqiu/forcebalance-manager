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
    minHeight: "300px",
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
};

class MoleculeViewer extends React.Component {
  state = {
    numFrames: null,
    numAtoms: null,
    currFrame: 0,
  }

  componentDidMount() {
    this.stage = new Stage("viewport", { backgroundColor: "white" });
    this.stage.viewer.camera.near = 0.0001;
    if (this.props.pdbString) {
      var stringBlob = new Blob( [ this.props.pdbString ], { type: 'text/plain' } );
      this.stage.loadFile( stringBlob, { ext: "pdb", defaultRepresentation: true, asTrajectory: true }).then( this.loadTraj );
    }
  }

  loadTraj = (o) => {
    this.traj = o.trajList[0].trajectory;
    this.setState({
      numFrames: this.traj.numframes,
      numAtoms: this.traj.atomCount,
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.pdbString && this.props.pdbString !== prevProps.pdbString) {
      this.stage.removeAllComponents();
      var stringBlob = new Blob( [ this.props.pdbString ], { type: 'text/plain' } );
      this.stage.loadFile( stringBlob, { ext: "pdb", defaultRepresentation: true, asTrajectory: true }).then( this.loadTraj );
    }
    if (prevProps.frame !== this.props.frame) {
      this.setTrajFrame(this.props.frame);
    }
  }

  componentWillUnmount() {
    delete this.stage;
  }

  setTrajFrame = (frame) => {
    frame = Math.max(frame, 0);
    if (this.state.numFrames) {
      frame = Math.min(frame, this.state.numFrames-1)
    }
    if (this.traj) {
      this.traj.setFrame(frame);
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
    const { classes, className } = this.props;
    const { numAtoms, numFrames, currFrame } = this.state;
    const enableTrajControl = (numFrames && numFrames > 1);
    let title = (this.props.title? this.props.title : '') + " | " + numAtoms + " Atoms | " + numFrames + " Frames";
    if (!this.props.pdbString) {
      title = 'Data not loaded';
    }
    return (
      <Paper className={classes.paper}>
          <div className={classes.title}>
            {title}
          </div>
          <div id="viewport" className={classes.viewer} />
          <div className={classes.sliderWrapper} >
            <div className={classes.slider} >
              <Slider min={0} max={numFrames-1} onChange={this.setTrajFrame} value={currFrame} disabled={!enableTrajControl} />
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
  pdbString: PropTypes.string,
  title: PropTypes.string,
  frame: PropTypes.number,
  className: PropTypes.string,
};

export default withStyles(styles)(MoleculeViewer);