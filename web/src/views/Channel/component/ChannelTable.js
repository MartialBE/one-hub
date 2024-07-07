import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import PerfectScrollbar from 'react-perfect-scrollbar';
import TablePagination from '@mui/material/TablePagination';
import LinearProgress from '@mui/material/LinearProgress';
import ChannelTableRow from './TableRow';
import KeywordTableHead from 'ui-component/TableHead';
import { ITEMS_PER_PAGE } from 'constants';
import { fetchChannelData } from '../ChannelList';
import { API } from 'utils/api';
import { showError, showSuccess, trims } from 'utils/common';
import { useTranslation } from 'react-i18next';

export default function ChannelTable({ tag }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('id');
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);
  const [listCount, setListCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [channels, setChannels] = useState([]);
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
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  // 处理刷新
  const handleRefresh = async () => {
    setOrderBy('id');
    setOrder('desc');
    setRefreshFlag(!refreshFlag);
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

  const fetchData = async (page, rowsPerPage, order, orderBy) => {
    setSearching(true);
    const data = await fetchChannelData(page, rowsPerPage, { tag: trims(tag) }, order, orderBy);

    if (data) {
      setListCount(data.total_count);
      setChannels(data.data);
    }
    setSearching(false);
  };

  useEffect(() => {
    fetchData(page, rowsPerPage, order, orderBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, order, orderBy, refreshFlag]);

  return (
    <>
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
                { id: 'used', label: t('channel_index.usedBalance'), disableSort: false },
                { id: 'priority', label: t('channel_index.priority'), disableSort: false, width: '80px' },
                { id: 'weight', label: t('channel_index.weight'), disableSort: false, width: '80px' },
                { id: 'action', label: t('userPage.action'), disableSort: true }
              ]}
            />
            <TableBody>
              {channels.map((row) => (
                <ChannelTableRow item={row} key={'channelsTag' + row.id} hideEdit={true} manageChannel={manageChannel} />
              ))}
            </TableBody>
          </Table>
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
        </TableContainer>
      </PerfectScrollbar>
    </>
  );
}

ChannelTable.propTypes = {
  tag: PropTypes.string
};
