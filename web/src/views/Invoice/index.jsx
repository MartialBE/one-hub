import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess } from 'utils/common';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import PerfectScrollbar from 'react-perfect-scrollbar';
import TablePagination from '@mui/material/TablePagination';
import LinearProgress from '@mui/material/LinearProgress';
import Toolbar from '@mui/material/Toolbar';

import { Button, Card, Box, Stack, Container, Typography, Alert } from '@mui/material';
import InvoiceTableRow from './component/TableRow';
import KeywordTableHead from 'ui-component/TableHead';
import { API } from 'utils/api';
import { Icon } from '@iconify/react';
import { PAGE_SIZE_OPTIONS, getPageSize, savePageSize } from 'constants';
import { useTranslation } from 'react-i18next';

export default function Invoice() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('date');
  const [rowsPerPage, setRowsPerPage] = useState(() => getPageSize('invoice'));
  const [listCount, setListCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(false);

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
    const newRowsPerPage = parseInt(event.target.value, 10);
    setPage(0);
    setRowsPerPage(newRowsPerPage);
    savePageSize('invoice', newRowsPerPage);
  };

  const handlerViewInvoice = (date) => {
    //时间只取年月日
    date = date.substring(0, 7)
    navigate(`/panel/invoice/detail/${date}`);
  }

  const fetchData = async (page, rowsPerPage, order, orderBy) => {
    setSearching(true);
    try {
      if (orderBy) {
        orderBy = order === 'desc' ? '-' + orderBy : orderBy;
      }
      const res = await API.get(`/api/user/invoice`, {
        params: {
          page: page + 1,
          size: rowsPerPage,
          order: orderBy
        }
      });
      const { success, message, data } = res.data;
      if (success) {
        setListCount(data.total_count);
        setInvoices(data.data || []);
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
    setSearching(false);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setOrderBy('date');
    setOrder('desc');
    setRefreshFlag(!refreshFlag);
  };

  useEffect(() => {
    fetchData(page, rowsPerPage, order, orderBy);
  }, [page, rowsPerPage, order, orderBy, refreshFlag]);


  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Stack direction="column" spacing={1}>
          <Typography variant="h2">{t('invoice_index.invoice')}</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Invoice
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {t('invoice_index.alert')}
          </Typography>
        </Stack>
      </Stack>
      <Card>
        <Toolbar
          sx={{
            textAlign: 'right',
            height: 50,
            display: 'flex',
            justifyContent: 'space-between',
            p: (theme) => theme.spacing(0, 1, 0, 3)
          }}
        >
          <Container maxWidth="xl">
            <Button onClick={handleRefresh} startIcon={<Icon icon="solar:refresh-bold-duotone" width={18} />}>
              {t('invoice_index.refresh')}
            </Button>
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
                  { id: 'date', label: t('invoice_index.date'), disableSort: false },
                  { id: 'quota', label: t('invoice_index.quota'), disableSort: false },
                  { id: 'tokens', label: t('invoice_index.tokens'), disableSort: true },
                  { id: 'request_count', label: t('invoice_index.requestCount'), disableSort: false },
                  { id: 'request_time', label: t('invoice_index.requestTime'), disableSort: false },
                  { id: 'option', label: t('invoice_index.option'), disableSort: true }
                ]}
              />
              <TableBody>
                {invoices.map((row) => (
                  <InvoiceTableRow item={row} key={row.id} manageInvoice={handlerViewInvoice} />
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
