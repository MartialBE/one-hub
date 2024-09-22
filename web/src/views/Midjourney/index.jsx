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

import { useTranslation } from 'react-i18next'; // Add this import
export default function Log() {
  const { t } = useTranslation(); // Use i18n translations
  const originalKeyword = {
    p: 0,
    channel_id: '',
    mj_id: '',
    start_timestamp: 0,
    end_timestamp: dayjs().unix() * 1000 + 3600
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
        const url = userIsAdmin ? '/api/mj/' : '/api/mj/self/';
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
        <Typography variant="h4">{t('midjourneyPage.midjourney')}</Typography>
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
                {t('midjourneyPage.refreshClearSearch')}
              </Button>

              <Button onClick={searchLogs} startIcon={<IconSearch width={'18px'} />}>
                {t('midjourneyPage.search')}
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
                    id: 'mj_id',
                    label: t('midjourneyPage.taskID'),
                    disableSort: false
                  },
                  {
                    id: 'submit_time',
                    label: t('midjourneyPage.submitTime'),
                    disableSort: false
                  },
                  {
                    id: 'channel_id',
                    label: t('midjourneyPage.channel'),
                    disableSort: false,
                    hide: !userIsAdmin
                  },
                  {
                    id: 'user_id',
                    label: t('midjourneyPage.user'),
                    disableSort: false,
                    hide: !userIsAdmin
                  },
                  {
                    id: 'action',
                    label: t('midjourneyPage.type'),
                    disableSort: false
                  },
                  {
                    id: 'code',
                    label: t('midjourneyPage.submissionResult'),
                    disableSort: false,
                    hide: !userIsAdmin
                  },
                  {
                    id: 'status',
                    label: t('midjourneyPage.taskStatus'),
                    disableSort: false,
                    hide: !userIsAdmin
                  },
                  {
                    id: 'progress',
                    label: t('midjourneyPage.progress'),
                    disableSort: true
                  },
                  {
                    id: 'time',
                    label: t('midjourneyPage.timeConsuming'),
                    disableSort: true
                  },
                  {
                    id: 'image_url',
                    label: t('midjourneyPage.resultImage'),
                    disableSort: true,
                    width: '120px'
                  },
                  {
                    id: 'prompt',
                    label: t('midjourneyPage.prompt'),
                    disableSort: true
                  },
                  {
                    id: 'prompt_en',
                    label: t('midjourneyPage.promptEn'),
                    disableSort: true
                  },
                  {
                    id: 'fail_reason',
                    label: t('midjourneyPage.failureReason'),
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
