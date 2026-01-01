import { useState, useEffect, useContext } from 'react';
import { showError, showSuccess, trims, copy, useIsReliable, useIsAdmin } from 'utils/common';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import PerfectScrollbar from 'react-perfect-scrollbar';
import TablePagination from '@mui/material/TablePagination';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import ButtonGroup from '@mui/material/ButtonGroup';
import Toolbar from '@mui/material/Toolbar';

import { Button, Card, Box, Stack, Container, Typography, FormControl, InputLabel, OutlinedInput, InputAdornment, Collapse } from '@mui/material';
import TokensTableRow from './component/TableRow';
import KeywordTableHead from 'ui-component/TableHead';
import TableToolBar from 'ui-component/TableToolBar';
import { API } from 'utils/api';
import { Icon } from '@iconify/react';
import EditeModal from './component/EditModal';
import { useSelector } from 'react-redux';
import { PAGE_SIZE_OPTIONS, getPageSize, savePageSize } from 'constants';
import { useTranslation } from 'react-i18next';
import { UserContext } from 'contexts/UserContext';
import { useTheme } from '@mui/material/styles';

export default function Token() {
  const { t } = useTranslation();
  const theme = useTheme();
  const grey500 = theme.palette.grey[500];
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('id');
  const [rowsPerPage, setRowsPerPage] = useState(() => getPageSize('token'));
  const [listCount, setListCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [tokens, setTokens] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const { loadUserGroup } = useContext(UserContext);
  const [userGroupOptions, setUserGroupOptions] = useState([]);

  const [openModal, setOpenModal] = useState(false);
  const [editTokenId, setEditTokenId] = useState(0);
  const siteInfo = useSelector((state) => state.siteInfo);
  const { userGroup } = useSelector((state) => state.account);
  const userIsReliable = useIsReliable();
  const userIsAdmin = useIsAdmin();

  // 管理员搜索相关状态
  const [adminSearchEnabled, setAdminSearchEnabled] = useState(false);
  const [adminSearchUserId, setAdminSearchUserId] = useState('');
  const [adminSearchTokenId, setAdminSearchTokenId] = useState('');

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
    savePageSize('token', newRowsPerPage);
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

      let res;
      // 如果启用了管理员搜索模式且有搜索条件
      if (adminSearchEnabled && (adminSearchUserId || adminSearchTokenId)) {
        res = await API.get(`/api/token/admin/search`, {
          params: {
            page: page + 1,
            size: rowsPerPage,
            keyword: keyword,
            order: orderBy,
            user_id: adminSearchUserId ? parseInt(adminSearchUserId, 10) : undefined,
            token_id: adminSearchTokenId ? parseInt(adminSearchTokenId, 10) : undefined
          }
        });
      } else {
        res = await API.get(`/api/token/`, {
          params: {
            page: page + 1,
            size: rowsPerPage,
            keyword: keyword,
            order: orderBy
          }
        });
      }

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
  }, [page, rowsPerPage, searchKeyword, order, orderBy, refreshFlag, adminSearchEnabled, adminSearchUserId, adminSearchTokenId]);

  useEffect(() => {
    loadUserGroup();
  }, [loadUserGroup]);

  useEffect(() => {
    let options = [];
    Object.values(userGroup).forEach((item) => {
      options.push({ label: `${item.name} (倍率：${item.ratio})`, value: item.symbol });
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
      showError(error);
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
        <Stack direction="column" spacing={1}>
          <Typography variant="h2">{t('token_index.token')}</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Token
          </Typography>
        </Stack>

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
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              padding: '4px 8px',
              borderRadius: '4px',
              margin: '0 4px',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.12)'
              }
            }}
            onClick={() => copy(siteInfo.server_address, 'API地址')}
          >
            <b>{siteInfo.server_address}</b>
            <Icon icon="solar:copy-line-duotone" style={{ marginLeft: '8px', fontSize: '18px' }} />
          </Box>
          {t('token_index.replaceApiAddress2')}
        </Alert>
      </Stack>

      {/* 管理员搜索面板 */}
      {userIsAdmin && (
        <Card sx={{ mb: 3 }}>
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderBottom: adminSearchEnabled ? '1px solid' : 'none',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
            onClick={() => setAdminSearchEnabled(!adminSearchEnabled)}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Icon icon="solar:shield-keyhole-bold-duotone" width={24} color={theme.palette.warning.main} />
              <Typography variant="subtitle1" fontWeight={600}>
                {t('token_index.adminSearch')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('token_index.adminSearchDesc')}
              </Typography>
            </Stack>
            <Icon
              icon={adminSearchEnabled ? 'solar:alt-arrow-up-bold-duotone' : 'solar:alt-arrow-down-bold-duotone'}
              width={20}
              color={grey500}
            />
          </Box>
          <Collapse in={adminSearchEnabled}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ p: 2 }}
            >
              <FormControl sx={{ flex: 1 }}>
                <InputLabel htmlFor="admin-search-user-id">{t('token_index.userId')}</InputLabel>
                <OutlinedInput
                  id="admin-search-user-id"
                  type="number"
                  value={adminSearchUserId}
                  onChange={(e) => {
                    setAdminSearchUserId(e.target.value);
                    setPage(0);
                  }}
                  label={t('token_index.userId')}
                  placeholder={t('token_index.userIdPlaceholder')}
                  startAdornment={
                    <InputAdornment position="start">
                      <Icon icon="solar:user-id-bold-duotone" width={20} color={grey500} />
                    </InputAdornment>
                  }
                />
              </FormControl>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel htmlFor="admin-search-token-id">{t('token_index.tokenId')}</InputLabel>
                <OutlinedInput
                  id="admin-search-token-id"
                  type="number"
                  value={adminSearchTokenId}
                  onChange={(e) => {
                    setAdminSearchTokenId(e.target.value);
                    setPage(0);
                  }}
                  label={t('token_index.tokenId')}
                  placeholder={t('token_index.tokenIdPlaceholder')}
                  startAdornment={
                    <InputAdornment position="start">
                      <Icon icon="solar:key-bold-duotone" width={20} color={grey500} />
                    </InputAdornment>
                  }
                />
              </FormControl>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setAdminSearchUserId('');
                  setAdminSearchTokenId('');
                  setPage(0);
                }}
                startIcon={<Icon icon="solar:refresh-bold-duotone" width={18} />}
              >
                {t('token_index.clearSearch')}
              </Button>
            </Stack>
          </Collapse>
        </Card>
      )}

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
          <Container maxWidth="xl">
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
                headLabel={(() => {
                  const isAdminSearch = adminSearchEnabled && (adminSearchUserId || adminSearchTokenId);
                  if (isAdminSearch) {
                    // 管理员搜索模式：合并额度列、合并时间列、新增最近使用
                    return [
                      { id: 'owner', label: t('token_index.owner'), disableSort: true },
                      { id: 'name', label: t('token_index.name'), disableSort: false },
                      { id: 'group', label: t('token_index.userGroup') + ' / ' + t('token_index.userBackupGroup'), disableSort: false },
                      { id: 'billing_tag', label: t('token_index.billingTag'), disableSort: true, hide: !userIsReliable },
                      { id: 'status', label: t('token_index.status'), disableSort: false },
                      { id: 'quota', label: t('token_index.usedQuota') + ' / ' + t('token_index.remainingQuota'), disableSort: true },
                      { id: 'time', label: t('token_index.createdTime') + ' / ' + t('token_index.expiryTime'), disableSort: true },
                      { id: 'accessed_time', label: t('token_index.accessedTime'), disableSort: false },
                      { id: 'action', label: t('token_index.actions'), disableSort: true }
                    ].filter(col => !col.hide);
                  } else {
                    // 普通模式
                    return [
                      { id: 'name', label: t('token_index.name'), disableSort: false },
                      { id: 'group', label: t('token_index.userGroup'), disableSort: false },
                      { id: 'billing_tag', label: t('token_index.billingTag'), disableSort: true, hide: !userIsReliable },
                      { id: 'status', label: t('token_index.status'), disableSort: false },
                      { id: 'used_quota', label: t('token_index.usedQuota'), disableSort: false },
                      { id: 'remain_quota', label: t('token_index.remainingQuota'), disableSort: false },
                      { id: 'created_time', label: t('token_index.createdTime'), disableSort: false },
                      { id: 'expired_time', label: t('token_index.expiryTime'), disableSort: false },
                      { id: 'action', label: t('token_index.actions'), disableSort: true }
                    ].filter(col => !col.hide);
                  }
                })()}
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
                    userIsReliable={userIsReliable}
                    isAdminSearch={adminSearchEnabled && (adminSearchUserId || adminSearchTokenId)}
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
      <EditeModal
        open={openModal}
        onCancel={handleCloseModal}
        onOk={handleOkModal}
        tokenId={editTokenId}
        userGroupOptions={userGroupOptions}
        adminMode={adminSearchEnabled && (adminSearchUserId || adminSearchTokenId)}
      />
    </>
  );
}
