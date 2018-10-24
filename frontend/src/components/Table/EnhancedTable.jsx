import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import DeleteIcon from '@material-ui/icons/Delete';
import FilterListIcon from '@material-ui/icons/FilterList';
import { lighten } from '@material-ui/core/styles/colorManipulator';

let counter = 0;
function createData(name, calories, fat, carbs, protein) {
  counter += 1;
  return { id: counter, name, calories, fat, carbs, protein };
}

function desc(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function stableSort(array, cmp) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = cmp(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map(el => el[0]);
}

function getSorting(order, orderBy) {
  return order === 'desc' ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy);
}

class EnhancedTableHead extends React.Component {
  createSortHandler = idx => event => {
    this.props.onRequestSort(event, idx);
  };

  render() {
    const { order, orderBy } = this.props;

    return (
      <TableHead>
        <TableRow>
          {this.props.labels.map((label, idx) => {
            return (
              <TableCell
                key={label}
                sortDirection={orderBy === label ? order : false}
              >
                <Tooltip
                  title="Sort"
                  placement={'bottom-start'}
                  enterDelay={300}
                >
                  <TableSortLabel
                    active={orderBy === idx}
                    direction={order}
                    onClick={this.createSortHandler(idx)}
                  >
                    {label}
                  </TableSortLabel>
                </Tooltip>
              </TableCell>
            );
          }, this)}
        </TableRow>
      </TableHead>
    );
  }
}

EnhancedTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.string.isRequired,
  orderBy: PropTypes.number,
  labels: PropTypes.array.isRequired,
};

const styles = theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing.unit * 3,
  },
  table: {
    minWidth: 700,
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  title: {
    padding: "20px",
    flex: '0 0 auto',
    backgroundColor: '#DDDDDD',
  },
});

class EnhancedTable extends React.Component {
  state = {
    order: 'asc',
    orderBy: null,
    page: 0,
    rowsPerPage: 5,
  };

  handleRequestSort = (event, idx) => {
    const orderBy = idx;
    let order = 'desc';
    if (this.state.orderBy === idx && this.state.order === 'desc') {
      order = 'asc';
    }
    this.setState({ order, orderBy });
  };


  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value });
  };

  render() {
    const { classes, data, title, tableHead, handleRowClick } = this.props;
    const { order, orderBy, page, rowsPerPage } = this.state;
    let emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);
    if (data.length <= rowsPerPage) emptyRows = 0;
    return (
      <Paper className={classes.root}>
        {title ?
          <div className={classes.title}>
            <Typography variant="subheading">
              {title}
            </Typography>
          </div> : null
        }
        <div className={classes.tableWrapper}>
          <Table className={classes.table} aria-labelledby="tableTitle">
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={this.handleRequestSort}
              labels={tableHead}
            />
            <TableBody>
              {stableSort(data, getSorting(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(rd => {
                  return (
                    <TableRow
                      hover={handleRowClick}
                      onClick={handleRowClick? (event => handleRowClick(event, rd[0])) : null}
                      key={rd[0]}
                    >
                    {rd.map((v,idx) => {
                      return (
                        <TableCell key={rd[0] + idx}>
                          {parseFloat(v) ? parseFloat(v).toFixed(4) : v}
                        </TableCell>
                      )
                    })}
                    </TableRow>
                  );
                })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 49 * emptyRows }}>
                  <TableCell colSpan={data[0].length} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          backIconButtonProps={{
            'aria-label': 'Previous Page',
          }}
          nextIconButtonProps={{
            'aria-label': 'Next Page',
          }}
          onChangePage={this.handleChangePage}
          onChangeRowsPerPage={this.handleChangeRowsPerPage}
        />
      </Paper>
    );
  }
}

EnhancedTable.propTypes = {
  classes: PropTypes.object.isRequired,
  data: PropTypes.array.isRequired,
  title: PropTypes.string,
  handleRowClick: PropTypes.func,
};

export default withStyles(styles)(EnhancedTable);