import { useState, useEffect } from 'react';
import { showError } from 'utils/common';

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
import LogTableHead from './component/TableHead';
import TableToolBar from './component/TableToolBar';
import { API } from 'utils/api';
import { isAdmin } from 'utils/common';
import { ITEMS_PER_PAGE } from 'constants';
import { IconRefresh, IconSearch } from '@tabler/icons-react';

export default function Log() {
  const originalKeyword = {
    p: 0,
    username: '',
    token_name: '',
    model_name: '',
    start_timestamp: 0,
    end_timestamp: new Date().getTime() / 1000 + 3600,
    type: 0,
    channel: ''
  };
  const [logs, setLogs] = useState([]);
  const [activePage, setActivePage] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(originalKeyword);
  const [initPage, setInitPage] = useState(true);
  const userIsAdmin = isAdmin();

  const loadLogs = async (startIdx) => {
    setSearching(true);
    const url = userIsAdmin ? '/api/log/' : '/api/log/self/';
    const statUrl = '/api/log/stat';  // 新增
    const query = searchKeyword;

    query.p = startIdx;
    if (!userIsAdmin) {
      delete query.username;
      delete query.channel;
    }
    const res = await API.get(url, { params: query });
    const statRes = await API.get(statUrl, { params: query });  // 新增
    const { success, message, data } = res.data;
    const { success: statSuccess, data: statData } = statRes.data;  // 新增
    if (success) {
      if (startIdx === 0) {
        setLogs(data);
      } else {
        let newLogs = [...logs];
        newLogs.splice(startIdx * ITEMS_PER_PAGE, data.length, ...data);
        setLogs(newLogs);
      }
    } else {
      showError(message);
    }
    if (statSuccess) {  // 新增
      const quotaPerUnit = localStorage.getItem('quota_per_unit') || 500000;
      setQuota(statData.quota / quotaPerUnit);
    }
    setSearching(false);
  };

  const onPaginationChange = (event, activePage) => {
    (async () => {
      if (activePage === Math.ceil(logs.length / ITEMS_PER_PAGE)) {
        // In this case we have to load more data and then append them.
        await loadLogs(activePage);
      }
      setActivePage(activePage);
    })();
  };

  const searchLogs = async (event) => {
    event.preventDefault();
    await loadLogs(0);
    setActivePage(0);
    return;
  };

  const handleSearchKeyword = (event) => {
    setSearchKeyword({ ...searchKeyword, [event.target.name]: event.target.value });
    loadLogs(0);  // 修改
  };

  // 处理刷新
  const handleRefresh = () => {
    setSearchKeyword(originalKeyword);
    loadLogs(0);
  };

  //新增统计和时间筛选
  const [quota, setQuota] = useState(0);  // 新增

  // 快速选时间
  const handleTimePresetClick = (preset) => {
    let starttime, endtime;
    const now = new Date();

    switch (preset) {
      case 'today':
        starttime = new Date();
        starttime.setHours(0, 0, 0, 0);
        endtime = new Date();
        endtime.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        starttime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        starttime.setHours(0, 0, 0, 0);
        endtime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        endtime.setHours(23, 59, 59, 999);
        break;
      case 'week':
        starttime = new Date();
        starttime.setDate(starttime.getDate() - starttime.getDay() + (starttime.getDay() === 0 ? -6 : 1));
        starttime.setHours(0, 0, 0, 0);
        endtime = new Date();
        endtime.setHours(23, 59, 59, 999);
        break;
      case 'lastWeek':
        starttime = new Date();
        starttime.setDate(starttime.getDate() - starttime.getDay() + (starttime.getDay() === 0 ? -13 : -6));
        starttime.setHours(0, 0, 0, 0);
        endtime = new Date(starttime);
        endtime.setDate(endtime.getDate() + 6);
        endtime.setHours(23, 59, 59, 999);
        break;
      case '30days':
        starttime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        starttime.setHours(0, 0, 0, 0);
        endtime = new Date();
        endtime.setHours(23, 59, 59, 999);
        break;
      case 'month':
        starttime = new Date();
        starttime.setDate(1);
        starttime.setHours(0, 0, 0, 0);
        endtime = new Date();
        endtime.setHours(23, 59, 59, 999);
        break;
      case 'lastMonth':
        starttime = new Date();
        starttime.setDate(1);
        starttime.setMonth(starttime.getMonth() - 1);
        starttime.setHours(0, 0, 0, 0);
        endtime = new Date(starttime);
        endtime.setMonth(endtime.getMonth() + 1);
        endtime.setDate(endtime.getDate() - 1);
        endtime.setHours(23, 59, 59, 999);
        break;
      case 'reset':
        starttime = new Date(0);
        endtime = new Date(now.getTime() + 3600 * 1000);
        break;
      default:
        break;
    }
    setSearchKeyword({
      // ...searchKeyword,
      start_timestamp: Math.floor(starttime.getTime() / 1000),  // Convert to seconds
      end_timestamp: Math.floor(endtime.getTime() / 1000)  // Convert to seconds
    });
  };

  useEffect(() => {
    setSearchKeyword(originalKeyword);
    setActivePage(0);
    loadLogs(0)
      .then()
      .catch((reason) => {
        showError(reason);
      });
    setInitPage(false);
  }, [initPage]);

  useEffect(() => {
    loadLogs(0);
  }, [searchKeyword]);

  return (
    <>
      <Stack direction="column" alignItems="left" justifyContent="space-between" mb={5}>
        <Typography variant="h4">日志</Typography>
        <Typography variant="h5" color="secondary.main">消耗额度：{quota}</Typography>
      </Stack>
      <Card>
        <Box component="form" onSubmit={searchLogs} noValidate>
          <TableToolBar filterName={searchKeyword} handleFilterName={handleSearchKeyword} userIsAdmin={userIsAdmin} />
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
          <Container
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 2,
              marginRight: 0
            }}
          >
            <ButtonGroup>
              <Button onClick={() => handleTimePresetClick('today')}>今天</Button>
              <Button onClick={() => handleTimePresetClick('yesterday')}>昨天</Button>
              <Button onClick={() => handleTimePresetClick('week')}>本周</Button>
              <Button onClick={() => handleTimePresetClick('lastWeek')}>上周</Button>
              <Button onClick={() => handleTimePresetClick('month')}>本月</Button>
              <Button onClick={() => handleTimePresetClick('lastMonth')}>上月</Button>
              <Button onClick={() => handleTimePresetClick('30days')}>30天内</Button>
              <Button onClick={() => handleTimePresetClick('reset')}>重置</Button>
            </ButtonGroup>
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
              <LogTableHead userIsAdmin={userIsAdmin} />
              <TableBody>
                {logs.slice(activePage * ITEMS_PER_PAGE, (activePage + 1) * ITEMS_PER_PAGE).map((row, index) => (
                  <LogTableRow item={row} key={`${row.id}_${index}`} userIsAdmin={userIsAdmin} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </PerfectScrollbar>
        <TablePagination
          page={activePage}
          component="div"
          count={logs.length + (logs.length % ITEMS_PER_PAGE === 0 ? 1 : 0)}
          rowsPerPage={ITEMS_PER_PAGE}
          onPageChange={onPaginationChange}
          rowsPerPageOptions={[ITEMS_PER_PAGE]}
        />
      </Card>
    </>
  );
}
