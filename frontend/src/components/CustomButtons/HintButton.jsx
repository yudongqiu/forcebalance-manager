import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import PropTypes, { func } from 'prop-types';
// material-ui core components
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
// material-ui icons
import HelpOutlinedIcon from '@material-ui/icons/HelpOutlineOutlined';

const styles = {

}

function HintButton(props) {
  return (
    <Tooltip title={props.hint} placement="top">
        <IconButton onClick={props.onClick}>
          <HelpOutlinedIcon fontSize="small" />
        </IconButton>
    </Tooltip>
  );
}

HintButton.propTypes = {
  classes: PropTypes.object.isRequired,
  hint: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

export default withStyles(styles)(HintButton);