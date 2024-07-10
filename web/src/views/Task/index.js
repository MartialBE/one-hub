import { useState, useEffect, useCallback } from 'react';
import { showError, trims } from 'utils/common';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import PerfectScrollbar from 'react-perfect-scrollbar';
import TablePagination from '@mui/material/TablePagination';
import LinearProgress from '@mui/material/LinearProgress';
import ButtonGroup from '@mui/material/ButtonGroup';
import Toolbar from '@mui/material/Toolbar';

import { Button, Card, Stack, Container, Typography, Box } from '@mui/material';
import LogTableRow from './component/TableRow';
import KeywordTableHead from 'ui-component/TableHead';
import TableToolBar from './component/TableToolBar';
import { API } from 'utils/api';
import { isAdmin } from 'utils/common';
import { ITEMS_PER_PAGE } from 'constants';
import { IconRefresh, IconSearch } from '@tabler/icons-react';
import dayjs from 'dayjs';

export default function Task() {
  const originalKeyword = {
    p: 0,
    channel_id: '',
    task_id: '',
    action: '',
    platform: '',
    start_timestamp: 0,
    end_timestamp: dayjs().unix() + 3600
  };

  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('id');
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);
  const [listCount, setListCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [toolBarValue, setToolBarValue] = useState(originalKeyword);
  const [searchKeyword, setSearchKeyword] = useState(originalKeyword);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const [logs, setLogs] = useState([]);
  const userIsAdmin = isAdmin();

  const handleSort = (event, id) => {
    const isAsc = orderBy === id && order === 'asc';
    if (id !== '') {
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const searchLogs = async () => {
    setPage(0);
    setSearchKeyword(toolBarValue);
  };

  const handleToolBarValue = (event) => {
    setToolBarValue({ ...toolBarValue, [event.target.name]: event.target.value });
  };

  const fetchData = useCallback(
    async (page, rowsPerPage, keyword, order, orderBy) => {
      setSearching(true);
      keyword = trims(keyword);
      try {
        if (orderBy) {
          orderBy = order === 'desc' ? '-' + orderBy : orderBy;
        }
        const url = userIsAdmin ? '/api/task/' : '/api/task/self/';
        if (!userIsAdmin) {
          delete keyword.channel_id;
        }

        const res = await API.get(url, {
          params: {
            page: page + 1,
            size: rowsPerPage,
            order: orderBy,
            ...keyword
          }
        });
        const { success, message, data } = res.data;
        if (success) {
          setListCount(data.total_count);
          setLogs(data.data);
        } else {
          showError(message);
        }
      } catch (error) {
        console.error(error);
      }
      setSearching(false);
    },
    [userIsAdmin]
  );

  // 处理刷新
  const handleRefresh = async () => {
    setOrderBy('id');
    setOrder('desc');
    setToolBarValue(originalKeyword);
    setSearchKeyword(originalKeyword);
    setRefreshFlag(!refreshFlag);
  };

  useEffect(() => {
    fetchData(page, rowsPerPage, searchKeyword, order, orderBy);
  }, [page, rowsPerPage, searchKeyword, order, orderBy, fetchData, refreshFlag]);

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">任务</Typography>
      </Stack>
      <Card>
        <Box component="form" noValidate>
          <TableToolBar filterName={toolBarValue} handleFilterName={handleToolBarValue} userIsAdmin={userIsAdmin} />
        </Box>
        <Toolbar
          sx={{
            textAlign: 'right',
            height: 50,
            display: 'flex',
            justifyContent: 'space-between',
            p: (theme) => theme.spacing(0, 1, 0, 3)
          }}
        >
          <Container>
            <ButtonGroup variant="outlined" aria-label="outlined small primary button group">
              <Button onClick={handleRefresh} startIcon={<IconRefresh width={'18px'} />}>
                刷新/清除搜索条件
              </Button>

              <Button onClick={searchLogs} startIcon={<IconSearch width={'18px'} />}>
                搜索
              </Button>
            </ButtonGroup>
          </Container>
        </Toolbar>
        {searching && <LinearProgress />}
        <PerfectScrollbar component="div">
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <KeywordTableHead
                order={order}
                orderBy={orderBy}
                onRequestSort={handleSort}
                headLabel={[
                  {
                    id: 'task_id',
                    label: '任务ID',
                    disableSort: true
                  },
                  {
                    id: 'submit_time',
                    label: '提交时间',
                    disableSort: false
                  },
                  {
                    id: 'finish_time',
                    label: '完成时间',
                    disableSort: false
                  },
                  {
                    id: 'channel_id',
                    label: '渠道',
                    disableSort: false,
                    hide: !userIsAdmin
                  },
                  {
                    id: 'user_id',
                    label: '用户',
                    disableSort: false,
                    hide: !userIsAdmin
                  },
                  {
                    id: 'platform',
                    label: '平台',
                    disableSort: false
                  },
                  {
                    id: 'action',
                    label: '类型',
                    disableSort: true
                  },
                  {
                    id: 'time',
                    label: '耗时',
                    disableSort: true
                  },
                  {
                    id: 'progress',
                    label: '进度',
                    disableSort: true
                  },
                  {
                    id: 'status',
                    label: '任务状态(点击查看结果)',
                    disableSort: false
                  },
                  {
                    id: 'fail_reason',
                    label: '失败原因',
                    disableSort: true
                  }
                ]}
              />
              <TableBody>
                {logs.map((row, index) => (
                  <LogTableRow item={row} key={`${row.id}_${index}`} userIsAdmin={userIsAdmin} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </PerfectScrollbar>
        <TablePagination
          page={page}
          component="div"
          count={listCount}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={[10, 25, 30]}
          onRowsPerPageChange={handleChangeRowsPerPage}
          showFirstButton
          showLastButton
        />
      </Card>
    </>
  );
}
