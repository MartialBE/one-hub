import { useState, useEffect } from 'react';
import { showError, showSuccess, showInfo, trims } from 'utils/common';

import { useTheme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import PerfectScrollbar from 'react-perfect-scrollbar';
import TablePagination from '@mui/material/TablePagination';
import LinearProgress from '@mui/material/LinearProgress';
import ButtonGroup from '@mui/material/ButtonGroup';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import Alert from '@mui/material/Alert';

import { Button, IconButton, Card, Box, Stack, Container, Typography, Divider } from '@mui/material';
import ChannelTableRow from './component/TableRow';
import KeywordTableHead from 'ui-component/TableHead';
import { API } from 'utils/api';
import { IconRefresh, IconTrash, IconPlus, IconMenu2, IconBrandSpeedtest, IconCoinYuan, IconSearch } from '@tabler/icons-react';
import EditeModal from './component/EditModal';
import { ITEMS_PER_PAGE } from 'constants';
import TableToolBar from './component/TableToolBar';
import BatchModal from './component/BatchModal';
import { useTranslation } from 'react-i18next';

const originalKeyword = {
  type: 0,
  status: 0,
  name: '',
  group: '',
  models: '',
  key: '',
  test_model: '',
  other: '',
  filter_tag: false,
  tag: ''
};

export async function fetchChannelData(page, rowsPerPage, keyword, order, orderBy) {
  try {
    if (orderBy) {
      orderBy = order === 'desc' ? '-' + orderBy : orderBy;
    }
    const res = await API.get(`/api/channel/`, {
      params: {
        page: page + 1,
        size: rowsPerPage,
        order: orderBy,
        ...keyword
      }
    });
    const { success, message, data } = res.data;
    if (success) {
      return data;
    } else {
      showError(message);
    }
  } catch (error) {
    console.error(error);
  }

  return false;
}

// ----------------------------------------------------------------------
// CHANNEL_OPTIONS,
export default function ChannelList() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('id');
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);
  const [listCount, setListCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [channels, setChannels] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [tags, setTags] = useState([]);

  const [groupOptions, setGroupOptions] = useState([]);
  const [toolBarValue, setToolBarValue] = useState(originalKeyword);
  const [searchKeyword, setSearchKeyword] = useState(originalKeyword);

  const theme = useTheme();
  const matchUpMd = useMediaQuery(theme.breakpoints.up('sm'));
  const [openModal, setOpenModal] = useState(false);
  const [editChannelId, setEditChannelId] = useState(0);
  const [openBatchModal, setOpenBatchModal] = useState(false);

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

  const searchChannels = async () => {
    // event.preventDefault();
    // const formData = new FormData(event.target);
    setPage(0);
    setSearchKeyword(toolBarValue);
  };

  const handleToolBarValue = (event) => {
    setToolBarValue({ ...toolBarValue, [event.target.name]: event.target.value });
  };

  const manageChannel = async (id, action, value) => {
    const url = '/api/channel/';
    let data = { id };
    let res;

    try {
      switch (action) {
        case 'copy': {
          let oldRes = await API.get(`/api/channel/${id}`);
          const { success, message, data } = oldRes.data;
          if (!success) {
            showError(message);
            return;
          }
          // 删除 data.id
          delete data.id;
          data.name = data.name + '_copy';
          res = await API.post(`/api/channel/`, { ...data });
          break;
        }
        case 'delete':
          res = await API.delete(url + id);
          break;
        case 'delete_tag':
          res = await API.delete(url + id + '/tag');
          break;
        case 'status':
          res = await API.put(url, {
            ...data,
            status: value
          });
          break;
        case 'priority':
          if (value === '') {
            return;
          }
          res = await API.put(url, {
            ...data,
            priority: parseInt(value)
          });
          break;
        case 'weight':
          if (value === '') {
            return;
          }
          res = await API.put(url, {
            ...data,
            weight: parseInt(value)
          });
          break;
        case 'test':
          res = await API.get(url + `test/${id}`, {
            params: { model: value }
          });
          break;
      }
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('userPage.operationSuccess'));
        if (action === 'delete' || action === 'copy' || action == 'delete_tag') {
          await handleRefresh(false);
        }
      } else {
        showError(message);
      }

      return res.data;
    } catch (error) {
      return;
    }
  };

  // 处理刷新
  const handleRefresh = async (reset) => {
    if (reset) {
      setOrderBy('id');
      setOrder('desc');
      setToolBarValue(originalKeyword);
      setSearchKeyword(originalKeyword);
    }
    setRefreshFlag(!refreshFlag);
  };

  // 处理测试所有启用渠道
  const testAllChannels = async () => {
    try {
      const res = await API.get(`/api/channel/test`);
      const { success, message } = res.data;
      if (success) {
        showInfo(t('channel_row.testAllChannel'));
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  // 处理删除所有禁用渠道
  const deleteAllDisabledChannels = async () => {
    try {
      const res = await API.delete(`/api/channel/disabled`);
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(t('channel_row.delChannelCount', { count: data }));
        await handleRefresh();
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  // 处理更新所有启用渠道余额
  const updateAllChannelsBalance = async () => {
    setSearching(true);
    try {
      const res = await API.get(`/api/channel/update_balance`);
      const { success, message } = res.data;
      if (success) {
        showInfo(t('channel_row.updateChannelBalance'));
      } else {
        showError(message);
      }
    } catch (error) {
      console.log(error);
    }

    setSearching(false);
  };

  const handleOpenModal = (channelId) => {
    setEditChannelId(channelId);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditChannelId(0);
  };

  const handleOkModal = (status) => {
    if (status === true) {
      handleCloseModal();
      handleRefresh(false);
    }
  };

  const fetchData = async (page, rowsPerPage, keyword, order, orderBy) => {
    setSearching(true);
    keyword = trims(keyword);
    const data = await fetchChannelData(page, rowsPerPage, keyword, order, orderBy);

    if (data) {
      setListCount(data.total_count);
      setChannels(data.data);
    }
    setSearching(false);
  };

  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
      setGroupOptions(res.data.data);
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchTags = async () => {
    try {
      let res = await API.get(`/api/channel_tag/_all`);
      const { success, data } = res.data;
      if (success) {
        setTags(data);
      }
    } catch (error) {
      showError(error.message);
    }
  };

  useEffect(() => {
    fetchData(page, rowsPerPage, searchKeyword, order, orderBy);
  }, [page, rowsPerPage, searchKeyword, order, orderBy, refreshFlag]);

  useEffect(() => {
    fetchGroups().then();
    fetchTags().then();
  }, []);

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">{t('channel_index.channel')}</Typography>

        <ButtonGroup variant="contained" aria-label="outlined small primary button group">
          <Button color="primary" startIcon={<IconPlus />} onClick={() => handleOpenModal(0)}>
            {t('channel_index.newChannel')}
          </Button>
          <Button color="primary" startIcon={<IconMenu2 />} onClick={() => setOpenBatchModal(true)}>
            {t('channel_index.batchProcessing')}
          </Button>
        </ButtonGroup>
      </Stack>
      <Stack mb={5}>
        <Alert severity="info">
          {t('channel_index.priorityWeightExplanation')}
          <br />
          {t('channel_index.description1')}
          <br />
          {t('channel_index.description2')}
          <br />
          {t('channel_index.description3')}
          <br />
          {t('channel_index.description4')}
        </Alert>
      </Stack>
      <Card>
        <Box component="form" noValidate>
          <TableToolBar filterName={toolBarValue} handleFilterName={handleToolBarValue} groupOptions={groupOptions} tags={tags} />
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
            {matchUpMd ? (
              <ButtonGroup variant="outlined" aria-label="outlined small primary button group">
                <Button onClick={() => handleRefresh(true)} startIcon={<IconRefresh width={'18px'} />}>
                  {t('channel_index.refreshClearSearchConditions')}
                </Button>
                <Button onClick={searchChannels} startIcon={<IconSearch width={'18px'} />}>
                  {t('channel_index.search')}
                </Button>
                <Button onClick={testAllChannels} startIcon={<IconBrandSpeedtest width={'18px'} />}>
                  {t('channel_index.testAllChannels')}
                </Button>
                <Button onClick={updateAllChannelsBalance} startIcon={<IconCoinYuan width={'18px'} />}>
                  {t('channel_index.updateEnabledBalance')}
                </Button>
                <Button onClick={deleteAllDisabledChannels} startIcon={<IconTrash width={'18px'} />}>
                  {t('channel_index.deleteDisabledChannels')}
                </Button>
              </ButtonGroup>
            ) : (
              <Stack
                direction="row"
                spacing={1}
                divider={<Divider orientation="vertical" flexItem />}
                justifyContent="space-around"
                alignItems="center"
              >
                <IconButton onClick={() => handleRefresh(true)} size="large">
                  <IconRefresh />
                </IconButton>
                <IconButton onClick={searchChannels} size="large">
                  <IconSearch />
                </IconButton>
                <IconButton onClick={testAllChannels} size="large">
                  <IconBrandSpeedtest />
                </IconButton>
                <IconButton onClick={updateAllChannelsBalance} size="large">
                  <IconCoinYuan />
                </IconButton>
                <IconButton onClick={deleteAllDisabledChannels} size="large">
                  <IconTrash />
                </IconButton>
              </Stack>
            )}
          </Container>
        </Toolbar>
        {searching && <LinearProgress />}
        <PerfectScrollbar component="div">
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <KeywordTableHead
                order={order}
                orderBy={orderBy}
                onRequestSort={handleSort}
                headLabel={[
                  { id: 'collapse', label: '', disableSort: true, width: '50px' },
                  { id: 'id', label: 'ID', disableSort: false, width: '80px' },
                  { id: 'name', label: t('channel_index.name'), disableSort: false },
                  { id: 'group', label: t('channel_index.group'), disableSort: true },
                  { id: 'tag', label: t('channel_index.tags'), disableSort: true },
                  { id: 'type', label: t('channel_index.type'), disableSort: false },
                  { id: 'status', label: t('channel_index.status'), disableSort: false },
                  { id: 'response_time', label: t('channel_index.responseTime'), disableSort: false },
                  // { id: 'balance', label: '余额', disableSort: false },
                  { id: 'used', label: t('channel_index.usedBalance'), disableSort: true },
                  { id: 'priority', label: t('channel_index.priority'), disableSort: false, width: '80px' },
                  { id: 'weight', label: t('channel_index.weight'), disableSort: false, width: '80px' },
                  { id: 'action', label: t('channel_index.actions'), disableSort: true }
                ]}
              />
              <TableBody>
                {channels.map((row) => (
                  <ChannelTableRow
                    item={row}
                    manageChannel={manageChannel}
                    key={row.id}
                    handleOpenModal={handleOpenModal}
                    setModalChannelId={setEditChannelId}
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
      <EditeModal open={openModal} onCancel={handleCloseModal} onOk={handleOkModal} channelId={editChannelId} groupOptions={groupOptions} />
      <BatchModal open={openBatchModal} setOpen={setOpenBatchModal} />
    </>
  );
}
