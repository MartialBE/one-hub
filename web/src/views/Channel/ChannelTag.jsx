import { useState, useEffect } from 'react'; //
import { showError, trims, showSuccess } from 'utils/common';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import LinearProgress from '@mui/material/LinearProgress';
import Toolbar from '@mui/material/Toolbar';

import EditeModal from './component/EditModal';
import { Card, Stack, Typography } from '@mui/material';
import TagTableRow from './component/TagTableRow';
import KeywordTableHead from 'ui-component/TableHead';
import { API } from 'utils/api';
import { ITEMS_PER_PAGE } from 'constants';
import { useTranslation } from 'react-i18next';
// import TableToolBar from 'ui-component/TableToolBar';

const originalKeyword = {
  tag: ''
};

export default function ChannelTag() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('id');
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);
  const [listCount, setListCount] = useState(0);
  const [channelTags, setChannelTags] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(originalKeyword);
  const [groupOptions, setGroupOptions] = useState([]);

  const [openModal, setOpenModal] = useState(false);
  const [editChannelId, setEditChannelId] = useState('');

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

  // const searchRedemptions = async (event) => {
  //   event.preventDefault();
  //   const formData = new FormData(event.target);
  //   setPage(0);
  //   setSearchKeyword(formData.get('keyword'));
  // };

  const handleRefresh = async () => {
    setOrderBy('id');
    setOrder('desc');
    // setToolBarValue(originalKeyword);
    setSearchKeyword(originalKeyword);
    setRefreshFlag(!refreshFlag);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditChannelId(0);
  };

  const handleOkModal = (status) => {
    if (status === true) {
      handleCloseModal();
      handleRefresh();
    }
  };

  const handleOpenModal = (channelId) => {
    setEditChannelId(channelId);
    setOpenModal(true);
  };

  const manageChannel = async (id, action) => {
    const url = '/api/channel_tag/';
    let res;

    try {
      switch (action) {
        case 'delete':
          res = await API.delete(url + encodeURIComponent(id));
          break;
      }
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('userPage.operationSuccess'));
        if (action === 'delete' || action === 'copy') {
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

  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
      setGroupOptions(res.data.data);
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchData = async (page, rowsPerPage, keyword, order, orderBy) => {
    setSearching(true);
    keyword = trims(keyword);
    try {
      if (orderBy) {
        orderBy = order === 'desc' ? '-' + orderBy : orderBy;
      }
      const res = await API.get(`/api/channel_tag/`, {
        params: {
          page: page + 1,
          size: rowsPerPage,
          order: orderBy,
          ...keyword
        }
      });
      const { success, message, data } = res.data;
      if (success) {
        setChannelTags(data.data);
        setListCount(data.total_count);
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }

    setSearching(false);
  };

  useEffect(() => {
    fetchData(page, rowsPerPage, searchKeyword, order, orderBy);
  }, [page, rowsPerPage, searchKeyword, order, orderBy, refreshFlag]); //

  useEffect(() => {
    fetchGroups().then();
  }, []);

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">{t('channel_index.channelTags')}</Typography>
      </Stack>
      <Card>
        {/* <Box component="form" onSubmit={searchRedemptions} noValidate>
          <TableToolBar placeholder={'搜索标签名称...'} />
        </Box> */}

        <Toolbar
          sx={{
            textAlign: 'right',
            height: 50,
            display: 'flex',
            justifyContent: 'space-between',
            p: (theme) => theme.spacing(0, 1, 0, 3)
          }}
        ></Toolbar>
        {searching && <LinearProgress />}
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <KeywordTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleSort}
              headLabel={[
                { id: 'collapse', label: '', disableSort: true, width: '50px' },
                { id: 'Tag', label: t('channel_index.tags'), disableSort: false },
                { id: 'type', label: t('channel_index.supplier'), disableSort: false },
                { id: 'group', label: t('channel_index.group'), disableSort: true, width: '80px' },
                { id: 'models', label: t('channel_index.model'), disableSort: false },
                { id: 'action', label: t('channel_index.actions'), disableSort: true }
              ]}
            />
            <TableBody>
              {channelTags.map((row) => (
                <TagTableRow
                  item={row}
                  manageChannel={manageChannel}
                  key={'TagTableRow-' + row.tag}
                  handleOpenModal={handleOpenModal}
                  setModalChannelId={setEditChannelId}
                />
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
      <EditeModal
        open={openModal}
        onCancel={handleCloseModal}
        onOk={handleOkModal}
        channelId={editChannelId}
        groupOptions={groupOptions}
        isTag={true}
      />
    </>
  );
}
