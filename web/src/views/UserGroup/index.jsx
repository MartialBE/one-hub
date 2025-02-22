import { useState, useEffect } from 'react';
import { showError, showSuccess } from 'utils/common';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import PerfectScrollbar from 'react-perfect-scrollbar';
import TablePagination from '@mui/material/TablePagination';
import LinearProgress from '@mui/material/LinearProgress';
import ButtonGroup from '@mui/material/ButtonGroup';
import Toolbar from '@mui/material/Toolbar';

import { Button, Card, Stack, Container, Typography } from '@mui/material';
import UserGroupTableRow from './component/TableRow';
import KeywordTableHead from 'ui-component/TableHead';
import { API } from 'utils/api';
import { ITEMS_PER_PAGE, PAGE_SIZE_OPTIONS } from 'constants';
import EditeModal from './component/EditModal';
import { Icon } from '@iconify/react';

import { useTranslation } from 'react-i18next';
// ----------------------------------------------------------------------
export default function UserGroup() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('id');
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);
  const [listCount, setListCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [userGroup, setUserGroup] = useState([]);
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

  const fetchData = async (page, rowsPerPage, order, orderBy) => {
    setSearching(true);
    try {
      if (orderBy) {
        orderBy = order === 'desc' ? '-' + orderBy : orderBy;
      }
      const res = await API.get(`/api/user_group/`, {
        params: {
          page: page + 1,
          size: rowsPerPage,
          order: orderBy
        }
      });
      const { success, message, data } = res.data;
      if (success) {
        setListCount(data.total_count);
        setUserGroup(data.data);
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
    fetchData(page, rowsPerPage, order, orderBy);
  }, [page, rowsPerPage, order, orderBy, refreshFlag]);

  const manageUserGroup = async (id, action) => {
    const url = '/api/user_group/';
    let res;
    try {
      switch (action) {
        case 'delete':
          res = await API.delete(url + id);
          break;
        case 'status':
          res = await API.put(`${url}enable/${id}`);
          break;
        default:
          return false;
      }

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
        <Typography variant="h4">{t('userGroup.title')}</Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<Icon icon="solar:add-circle-line-duotone" />}
          onClick={() => handleOpenModal(0)}
        >
          {t('userGroup.create')}
        </Button>
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
                  { id: 'id', label: t('userGroup.id'), disableSort: false },
                  { id: 'symbol', label: t('userGroup.symbol'), disableSort: false },
                  { id: 'name', label: t('userGroup.name'), disableSort: false },
                  { id: 'ratio', label: t('userGroup.ratio'), disableSort: false },
                  { id: 'api_rate', label: t('userGroup.apiRate'), disableSort: false },
                  { id: 'public', label: t('userGroup.public'), disableSort: false },
                  { id: 'enable', label: t('userGroup.enable'), disableSort: false },

                  { id: 'action', label: t('userPage.action'), disableSort: true }
                ]}
              />
              <TableBody>
                {userGroup.map((row) => (
                  <UserGroupTableRow
                    item={row}
                    manageUserGroup={manageUserGroup}
                    key={row.id}
                    handleOpenModal={handleOpenModal}
                    setModalUserGroupId={setEditUserId}
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
      <EditeModal open={openModal} onCancel={handleCloseModal} onOk={handleOkModal} userGroupId={editUserId} />
    </>
  );
}
