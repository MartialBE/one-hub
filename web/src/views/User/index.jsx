import { useState, useEffect } from 'react';
import { showError, showSuccess, trims } from 'utils/common';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import PerfectScrollbar from 'react-perfect-scrollbar';
import TablePagination from '@mui/material/TablePagination';
import LinearProgress from '@mui/material/LinearProgress';
import ButtonGroup from '@mui/material/ButtonGroup';
import Toolbar from '@mui/material/Toolbar';
import { Icon } from '@iconify/react';

import { Button, Card, Box, Stack, Container, Typography } from '@mui/material';
import UsersTableRow from './component/TableRow';
import KeywordTableHead from 'ui-component/TableHead';
import TableToolBar from 'ui-component/TableToolBar';
import { API } from 'utils/api';
import { ITEMS_PER_PAGE, PAGE_SIZE_OPTIONS } from 'constants';
import EditeModal from './component/EditModal';

import { useTranslation } from 'react-i18next';
// ----------------------------------------------------------------------
export default function Users() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('id');
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);
  const [listCount, setListCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [users, setUsers] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [editUserId, setEditUserId] = useState(0);

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

  const searchUsers = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    setPage(0);
    setSearchKeyword(formData.get('keyword'));
  };

  const fetchData = async (page, rowsPerPage, keyword, order, orderBy) => {
    setSearching(true);
    keyword = trims(keyword);
    try {
      if (orderBy) {
        orderBy = order === 'desc' ? '-' + orderBy : orderBy;
      }
      const res = await API.get(`/api/user/`, {
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
        setUsers(data.data);
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
    setSearching(false);
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

  const manageUser = async (username, action, value) => {
    let url = '/api/user/manage';
    let valueData = {};
    // let data = { username: username, action: '' };
    let res;
    switch (action) {
      case 'delete':
        valueData = { username, action: 'delete' };
        break;
      case 'status':
        valueData = { username, action: value === 1 ? 'enable' : 'disable' };
        break;
      case 'role':
        valueData = { username, action: value === true ? 'promote' : 'demote' };
        break;
      case 'quota':
        url = `/api/user/quota/${username}`;
        valueData = value;
        break;
    }

    try {
      res = await API.post(url, valueData);
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('userPage.operationSuccess'));
        await handleRefresh();
      } else {
        showError(message);
      }

      return res.data;
    } catch (error) {
      return;
    }
  };

  const handleOpenModal = (userId) => {
    setEditUserId(userId);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditUserId(0);
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
        <Typography variant="h4">{t('userPage.users')}</Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<Icon icon="solar:add-circle-line-duotone" />}
          onClick={() => handleOpenModal(0)}
        >
          {t('userPage.createUser')}
        </Button>
      </Stack>
      <Card>
        <Box component="form" onSubmit={searchUsers} noValidate>
          <TableToolBar placeholder={t('userPage.searchPlaceholder')} />
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
                {t('userPage.refresh')}
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
                  { id: 'id', label: t('userPage.id'), disableSort: false },
                  { id: 'username', label: t('userPage.username'), disableSort: false },
                  { id: 'group', label: t('userPage.group'), disableSort: true },
                  { id: 'stats', label: t('userPage.statistics'), disableSort: true },
                  { id: 'role', label: t('userPage.userRole'), disableSort: false },
                  { id: 'bind', label: t('userPage.bind'), disableSort: true },
                  { id: 'created_time', label: t('userPage.creationTime'), disableSort: false },
                  { id: 'status', label: t('userPage.status'), disableSort: false },
                  { id: 'action', label: t('userPage.action'), disableSort: true }
                ]}
              />
              <TableBody>
                {users.map((row) => (
                  <UsersTableRow
                    item={row}
                    manageUser={manageUser}
                    key={row.id}
                    handleOpenModal={handleOpenModal}
                    setModalUserId={setEditUserId}
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
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
          onRowsPerPageChange={handleChangeRowsPerPage}
          showFirstButton
          showLastButton
        />
      </Card>
      <EditeModal open={openModal} onCancel={handleCloseModal} onOk={handleOkModal} userId={editUserId} />
    </>
  );
}
