import { useState, useEffect } from 'react';
import { showError, showSuccess } from 'utils/common';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import PerfectScrollbar from 'react-perfect-scrollbar';
import ButtonGroup from '@mui/material/ButtonGroup';
import Toolbar from '@mui/material/Toolbar';

import { Button, Card, Stack, Container, Typography, OutlinedInput, TablePagination } from '@mui/material';
import ModelInfoTableRow from './component/TableRow';
import KeywordTableHead from 'ui-component/TableHead';
import { API } from 'utils/api';
import EditModal from './component/EditModal';
import ImportModal from './component/ImportModal';
import { Icon } from '@iconify/react';

// ----------------------------------------------------------------------
export default function ModelInfo() {
  const [modelInfos, setModelInfos] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(0);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchData = async () => {
    try {
      const res = await API.get(`/api/model_info/`);
      const { success, message, data } = res.data;
      if (success) {
        setModelInfos(data);
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 处理刷新
  const handleRefresh = async () => {
    setRefreshFlag(!refreshFlag);
  };

  useEffect(() => {
    fetchData();
  }, [refreshFlag]);

  const manageModelInfo = async (id, action) => {
    const url = '/api/model_info/';
    let res;
    try {
      switch (action) {
        case 'delete':
          res = await API.delete(url + id);
          break;
        default:
          return false;
      }

      const { success, message } = res.data;
      if (success) {
        showSuccess('操作成功');
        await handleRefresh();
      } else {
        showError(message);
      }

      return res.data;
    } catch (error) {
      return;
    }
  };

  const handleOpenModal = (id) => {
    setEditId(id);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditId(0);
  };

  const handleOkModal = (status) => {
    if (status === true) {
      handleCloseModal();
      handleRefresh();
    }
  };

  const [keyword, setKeyword] = useState('');

  const handleSearch = (event) => {
    setKeyword(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredModelInfos = modelInfos.filter((info) => {
    if (!keyword) return true;
    const lowerKeyword = keyword.toLowerCase();
    return (
      info.model.toLowerCase().includes(lowerKeyword) ||
      info.name.toLowerCase().includes(lowerKeyword) ||
      (info.input_modalities && info.input_modalities.toLowerCase().includes(lowerKeyword)) ||
      (info.output_modalities && info.output_modalities.toLowerCase().includes(lowerKeyword)) ||
      (info.tags && info.tags.toLowerCase().includes(lowerKeyword))
    );
  });

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Stack direction="column" spacing={1}>
          <Typography variant="h2">模型详情</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Model Info
          </Typography>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Icon icon="solar:upload-bold-duotone" />}
            onClick={() => setOpenImportModal(true)}
          >
            批量导入
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Icon icon="solar:add-circle-line-duotone" />}
            onClick={() => handleOpenModal(0)}
          >
            新建模型信息
          </Button>
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
            <ButtonGroup variant="outlined" aria-label="outlined small primary button group">
              <Button onClick={handleRefresh} startIcon={<Icon icon="solar:refresh-bold-duotone" width={18} />}>
                刷新
              </Button>
            </ButtonGroup>
          </Container>
          <OutlinedInput
            value={keyword}
            onChange={handleSearch}
            placeholder="搜索模型标识、名称、模态或标签..."
            startAdornment={<Icon icon="eva:search-fill" style={{ color: 'text.disabled', width: 20, height: 20, marginRight: 8 }} />}
            sx={{ height: 40, width: 600 }}
          />
        </Toolbar>
        <PerfectScrollbar component="div">
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <KeywordTableHead
                headLabel={[
                  { id: 'model', label: '模型标识', disableSort: false },
                  { id: 'name', label: '模型名称', disableSort: false },
                  { id: 'context_length', label: '上下文长度', disableSort: false },
                  { id: 'max_tokens', label: '最大Token', disableSort: false },
                  { id: 'input_modalities', label: '输入模态', disableSort: false },
                  { id: 'output_modalities', label: '输出模态', disableSort: false },
                  { id: 'tags', label: '标签', disableSort: false },
                  { id: 'action', label: '操作', disableSort: true }
                ]}
              />
              <TableBody>
                {filteredModelInfos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                  <ModelInfoTableRow item={row} manageModelInfo={manageModelInfo} key={row.id} handleOpenModal={handleOpenModal} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </PerfectScrollbar>
        <TablePagination
          page={page}
          component="div"
          count={filteredModelInfos.length}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={[10, 30, 50, 100]}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
      <EditModal
        open={openModal}
        onCancel={handleCloseModal}
        onOk={handleOkModal}
        editId={editId}
        existingModels={modelInfos.map((info) => info.model)}
      />
      <ImportModal
        open={openImportModal}
        onCancel={() => setOpenImportModal(false)}
        onOk={(status) => {
          if (status === true) {
            setOpenImportModal(false);
            handleRefresh();
          }
        }}
        existingModels={modelInfos.map((info) => info.model)}
      />
    </>
  );
}
