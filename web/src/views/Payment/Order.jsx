import { useState, useEffect, useCallback } from 'react';
import { showError, trims } from 'utils/common';
import { useTranslation } from 'react-i18next';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import LinearProgress from '@mui/material/LinearProgress';
import ButtonGroup from '@mui/material/ButtonGroup';
import Toolbar from '@mui/material/Toolbar';

import { Button, Card, Stack, Container, Typography, Box } from '@mui/material';
import LogTableRow from './component/OrderTableRow';
import KeywordTableHead from 'ui-component/TableHead';
import TableToolBar from './component/OrderTableToolBar';
import { API } from 'utils/api';
import { ITEMS_PER_PAGE } from 'constants';
import { Icon } from '@iconify/react';
import dayjs from 'dayjs';

export default function Order() {
  const { t } = useTranslation();

  const originalKeyword = {
    p: 0,
    user_id: '',
    trade_no: '',
    status: '',
    gateway_no: '',
    start_timestamp: 0,
    end_timestamp: dayjs().unix() + 3600
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

  const [orderList, setOrderList] = useState([]);

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

  const fetchData = useCallback(async (page, rowsPerPage, keyword, order, orderBy) => {
    setSearching(true);
    keyword = trims(keyword);
    try {
      if (orderBy) {
        orderBy = order === 'desc' ? '-' + orderBy : orderBy;
      }
      const res = await API.get('/api/payment/order', {
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
        setOrderList(data.data);
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
    setSearching(false);
  }, []);

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
        <Typography variant="h4">{t('orderlogPage.title')}</Typography>
      </Stack>
      <Card>
        <Box component="form" noValidate>
          <TableToolBar filterName={toolBarValue} handleFilterName={handleToolBarValue} />
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
                {t('orderlogPage.refreshClear')}
              </Button>
              <Button onClick={searchLogs} startIcon={<Icon icon="solar:minimalistic-magnifer-line-duotone" width={18} />}>
                {t('orderlogPage.search')}
              </Button>
            </ButtonGroup>
          </Container>
        </Toolbar>
        {searching && <LinearProgress />}
        <TableContainer sx={{ overflow: 'unset' }}>
          <Table sx={{ minWidth: 800 }}>
            <KeywordTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleSort}
              headLabel={[
                { id: 'created_at', label: t('orderlogPage.tableHeaders.created_at'), disableSort: false },
                { id: 'gateway_id', label: t('orderlogPage.tableHeaders.gateway_id'), disableSort: false },
                { id: 'user_id', label: t('orderlogPage.tableHeaders.user_id'), disableSort: false },
                { id: 'trade_no', label: t('orderlogPage.tableHeaders.trade_no'), disableSort: true },
                { id: 'gateway_no', label: t('orderlogPage.tableHeaders.gateway_no'), disableSort: true },
                { id: 'amount', label: t('orderlogPage.tableHeaders.amount'), disableSort: true },
                { id: 'fee', label: t('orderlogPage.tableHeaders.fee'), disableSort: true },
                { id: 'discount', label: t('orderlogPage.tableHeaders.discount'), disableSort: true },
                { id: 'order_amount', label: t('orderlogPage.tableHeaders.order_amount'), disableSort: true },
                { id: 'quota', label: t('orderlogPage.tableHeaders.quota'), disableSort: true },
                { id: 'status', label: t('orderlogPage.tableHeaders.status'), disableSort: false }
              ]}
            />
            <TableBody>
              {orderList.map((row, index) => (
                <LogTableRow item={row} key={`${row.id}_${index}`} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
