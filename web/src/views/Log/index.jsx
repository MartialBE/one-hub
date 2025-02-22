import { useState, useEffect, useCallback, useContext } from 'react';
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
import { ITEMS_PER_PAGE, PAGE_SIZE_OPTIONS } from 'constants';
import { Icon } from '@iconify/react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { UserContext } from 'contexts/UserContext';

export default function Log() {
  const { t } = useTranslation();
  const originalKeyword = {
    p: 0,
    username: '',
    token_name: '',
    model_name: '',
    start_timestamp: 0,
    end_timestamp: dayjs().unix() + 3600,
    log_type: 0,
    channel_id: ''
  };

  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('created_at');
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);
  const [listCount, setListCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [toolBarValue, setToolBarValue] = useState(originalKeyword);
  const [searchKeyword, setSearchKeyword] = useState(originalKeyword);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const { userGroup } = useContext(UserContext);

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
        const url = userIsAdmin ? '/api/log/' : '/api/log/self/';
        if (!userIsAdmin) {
          delete keyword.username;
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
    setOrderBy('created_at');
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
        <Typography variant="h4">{t('logPage.title')}</Typography>
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
              <Button onClick={handleRefresh} startIcon={<Icon icon="solar:refresh-bold-duotone" width={18} />}>
                {t('logPage.refreshButton')}
              </Button>

              <Button onClick={searchLogs} startIcon={<Icon icon="solar:minimalistic-magnifer-line-duotone" width={18} />}>
                {t('logPage.searchButton')}
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
                    id: 'created_at',
                    label: t('logPage.timeLabel'),
                    disableSort: false
                  },
                  {
                    id: 'channel_id',
                    label: t('logPage.channelLabel'),
                    disableSort: false,
                    hide: !userIsAdmin
                  },
                  {
                    id: 'user_id',
                    label: t('logPage.userLabel'),
                    disableSort: false,
                    hide: !userIsAdmin
                  },
                  {
                    id: 'group',
                    label: t('logPage.groupLabel'),
                    disableSort: false
                  },
                  {
                    id: 'token_name',
                    label: t('logPage.tokenLabel'),
                    disableSort: false
                  },
                  {
                    id: 'type',
                    label: t('logPage.typeLabel'),
                    disableSort: false
                  },
                  {
                    id: 'model_name',
                    label: t('logPage.modelLabel'),
                    disableSort: false
                  },
                  {
                    id: 'duration',
                    label: t('logPage.durationLabel'),
                    tooltip: t('logPage.durationTooltip'),
                    disableSort: true
                  },
                  {
                    id: 'message',
                    label: t('logPage.inputLabel'),
                    disableSort: true
                  },
                  {
                    id: 'completion',
                    label: t('logPage.outputLabel'),
                    disableSort: true
                  },
                  {
                    id: 'quota',
                    label: t('logPage.quotaLabel'),
                    disableSort: true
                  },
                  {
                    id: 'detail',
                    label: t('logPage.detailLabel'),
                    disableSort: true
                  }
                ]}
              />
              <TableBody>
                {logs.map((row, index) => (
                  <LogTableRow item={row} key={`${row.id}_${index}`} userIsAdmin={userIsAdmin} userGroup={userGroup} />
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
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
          onRowsPerPageChange={handleChangeRowsPerPage}
          showFirstButton
          showLastButton
        />
      </Card>
    </>
  );
}
