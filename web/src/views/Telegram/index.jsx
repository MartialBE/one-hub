import { useState, useEffect } from 'react';
import { showError, showSuccess } from 'utils/common';
import { useTranslation } from 'react-i18next'; // 引入 i18n

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import PerfectScrollbar from 'react-perfect-scrollbar';
import TablePagination from '@mui/material/TablePagination';
import LinearProgress from '@mui/material/LinearProgress';
import ButtonGroup from '@mui/material/ButtonGroup';
import Toolbar from '@mui/material/Toolbar';

import { Button, Card, Box, Stack, Container, Typography, Chip, Alert } from '@mui/material';
import TelegramTableRow from './component/TableRow';
import KeywordTableHead from 'ui-component/TableHead';
import TableToolBar from 'ui-component/TableToolBar';
import { API } from 'utils/api';
import { ITEMS_PER_PAGE } from 'constants';
import { IconRefresh, IconPlus, IconBrandTelegram, IconReload } from '@tabler/icons-react';
import EditeModal from './component/EditModal';

// ----------------------------------------------------------------------
export default function Telegram() {
  const { t } = useTranslation(); // 使用 useTranslation hook 获取 t 函数

  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('id');
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);
  const [listCount, setListCount] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [telegramMenus, setTelegramMenus] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(false);
  let [status, setStatus] = useState(false);
  let [isWebhook, setIsWebhook] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [editTelegramMenusId, setEditTelegramMenusId] = useState(0);

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

  const searchMenus = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    setPage(0);
    setSearchKeyword(formData.get('keyword'));
  };

  const fetchData = async (page, rowsPerPage, keyword, order, orderBy) => {
    setSearching(true);
    try {
      if (orderBy) {
        orderBy = order === 'desc' ? '-' + orderBy : orderBy;
      }
      const res = await API.get(`/api/option/telegram/`, {
        params: {
          page: page + 1,
          size: rowsPerPage,
          keyword: keyword,
          order: orderBy
        }
      });
      const { success, message, data } = res.data;
      if (success) {
        setListCount(data.total_count);
        setTelegramMenus(data.data);
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
    setSearching(false);
  };

  const reload = async () => {
    try {
      const res = await API.put('/api/option/telegram/reload');
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('telegramPage.reloadSuccess'));
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  const getStatus = async () => {
    try {
      const res = await API.get('/api/option/telegram/status');
      const { success, data } = res.data;
      if (success) {
        setStatus(data.status);
        setIsWebhook(data.is_webhook);
      }
    } catch (error) {
      return;
    }
  };

  // 处理刷新
  const handleRefresh = async () => {
    setOrderBy('id');
    setOrder('desc');
    setRefreshFlag(!refreshFlag);
  };

  useEffect(() => {
    fetchData(page, rowsPerPage, searchKeyword, order, orderBy);
  }, [page, rowsPerPage, searchKeyword, order, orderBy, refreshFlag]);

  useEffect(() => {
    getStatus().then();
  }, []);

  const manageMenus = async (id, action) => {
    const url = '/api/option/telegram/';
    let res;

    try {
      switch (action) {
        case 'delete':
          res = await API.delete(url + id);
          break;
      }
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('telegramPage.operationSuccess'));
        if (action === 'delete') {
          await handleRefresh();
        }
      } else {
        showError(message);
      }

      return res.data;
    } catch (error) {
      return;
    }
  };

  const handleOpenModal = (id) => {
    setEditTelegramMenusId(id);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditTelegramMenusId(0);
  };

  const handleOkModal = (status) => {
    if (status === true) {
      handleCloseModal();
      handleRefresh();
    }
  };

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">{t('telegramPage.title')}</Typography>
        <Button variant="contained" color="primary" startIcon={<IconPlus />} onClick={() => handleOpenModal(0)}>
          {t('telegramPage.createMenu')}
        </Button>
      </Stack>
      <Stack mb={5}>
        <Alert severity="info">{t('telegramPage.infoMessage')}</Alert>
      </Stack>
      <Stack direction="row" alignItems="center" justifyContent="flex-start" mb={2} spacing={2}>
        <Chip
          icon={<IconBrandTelegram />}
          label={(status ? t('telegramPage.online') : t('telegramPage.offline')) + (isWebhook ? '(Webhook)' : '(Polling)')}
          color={status ? 'primary' : 'error'}
          variant="outlined"
          size="small"
        />

        <Button variant="contained" size="small" endIcon={<IconReload />} onClick={reload}>
          {t('telegramPage.reloadMenu')}
        </Button>
      </Stack>
      <Card>
        <Box component="form" onSubmit={searchMenus} noValidate>
          <TableToolBar placeholder={t('telegramPage.searchPlaceholder')} />
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
                {t('telegramPage.refresh')}
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
                  { id: 'id', label: t('telegramPage.id'), disableSort: false },
                  { id: 'command', label: t('telegramPage.command'), disableSort: false },
                  { id: 'description', label: t('telegramPage.description'), disableSort: false },
                  { id: 'parse_mode', label: t('telegramPage.replyType'), disableSort: false },
                  { id: 'reply_message', label: t('telegramPage.replyContent'), disableSort: false },
                  { id: 'action', label: t('telegramPage.action'), disableSort: true }
                ]}
              />
              <TableBody>
                {telegramMenus.map((row) => (
                  <TelegramTableRow
                    item={row}
                    manageAction={manageMenus}
                    key={row.id}
                    handleOpenModal={handleOpenModal}
                    setModalId={setEditTelegramMenusId}
                  />
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
      <EditeModal open={openModal} onCancel={handleCloseModal} onOk={handleOkModal} actionId={editTelegramMenusId} />
    </>
  );
}
