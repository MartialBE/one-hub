import { useState, useEffect, useContext } from 'react';
import { showError, showSuccess, trims } from 'utils/common';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import PerfectScrollbar from 'react-perfect-scrollbar';
import TablePagination from '@mui/material/TablePagination';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import ButtonGroup from '@mui/material/ButtonGroup';
import Toolbar from '@mui/material/Toolbar';

import { Button, Card, Box, Stack, Container, Typography } from '@mui/material';
import TokensTableRow from './component/TableRow';
import KeywordTableHead from 'ui-component/TableHead';
import TableToolBar from 'ui-component/TableToolBar';
import { API } from 'utils/api';
import { Icon } from '@iconify/react';
import EditeModal from './component/EditModal';
import { useSelector } from 'react-redux';
import { ITEMS_PER_PAGE } from 'constants';
import { useTranslation } from 'react-i18next';
import { UserContext } from 'contexts/UserContext';

export default function Token() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('id');
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);
  const [listCount, setListCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [tokens, setTokens] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const { userGroup, loadUserGroup } = useContext(UserContext);
  const [userGroupOptions, setUserGroupOptions] = useState([]);

  const [openModal, setOpenModal] = useState(false);
  const [editTokenId, setEditTokenId] = useState(0);
  const siteInfo = useSelector((state) => state.siteInfo);

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

  const searchTokens = async (event) => {
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
      const res = await API.get(`/api/token/`, {
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
        setTokens(data.data);
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

  useEffect(() => {
    loadUserGroup();
  }, [loadUserGroup]);

  useEffect(() => {
    let options = [];
    Object.values(userGroup).forEach((item) => {
      if (item.public) {
        options.push({ label: `${item.name} (倍率：${item.ratio})`, value: item.symbol });
      }
    });
    setUserGroupOptions(options);
  }, [userGroup]);

  const manageToken = async (id, action, value) => {
    const url = '/api/token/';
    let data = { id };
    let res;
    try {
      switch (action) {
        case 'delete':
          res = await API.delete(url + id);
          break;
        case 'status':
          res = await API.put(url + `?status_only=true`, {
            ...data,
            status: value
          });
          break;
      }
      const { success, message } = res.data;
      if (success) {
        showSuccess('操作成功完成！');
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

  const handleOpenModal = (tokenId) => {
    setEditTokenId(tokenId);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditTokenId(0);
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
        <Typography variant="h4">{t('token_index.token')}</Typography>

        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            handleOpenModal(0);
          }}
          startIcon={<Icon icon="solar:add-circle-line-duotone" />}
        >
          {t('token_index.createToken')}
        </Button>
      </Stack>
      <Stack mb={5}>
        <Alert severity="info">
          {t('token_index.replaceApiAddress1')}
          <b>{siteInfo.server_address}</b>
          {t('token_index.replaceApiAddress2')}
        </Alert>
      </Stack>
      <Card>
        <Box component="form" onSubmit={searchTokens} noValidate>
          <TableToolBar placeholder={t('token_index.searchTokenName')} />
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
                {t('token_index.refresh')}
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
                  { id: 'name', label: t('token_index.name'), disableSort: false },
                  { id: 'group', label: t('token_index.userGroup'), disableSort: false },
                  { id: 'status', label: t('token_index.status'), disableSort: false },
                  { id: 'used_quota', label: t('token_index.usedQuota'), disableSort: false },
                  { id: 'remain_quota', label: t('token_index.remainingQuota'), disableSort: false },
                  { id: 'created_time', label: t('token_index.createdTime'), disableSort: false },
                  { id: 'expired_time', label: t('token_index.expiryTime'), disableSort: false },
                  { id: 'action', label: t('token_index.actions'), disableSort: true }
                ]}
              />
              <TableBody>
                {tokens.map((row) => (
                  <TokensTableRow
                    item={row}
                    manageToken={manageToken}
                    key={row.id}
                    handleOpenModal={handleOpenModal}
                    setModalTokenId={setEditTokenId}
                    userGroup={userGroup}
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
      <EditeModal
        open={openModal}
        onCancel={handleCloseModal}
        onOk={handleOkModal}
        tokenId={editTokenId}
        userGroupOptions={userGroupOptions}
      />
    </>
  );
}
