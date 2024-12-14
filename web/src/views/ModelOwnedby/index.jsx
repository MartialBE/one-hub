import { useState, useEffect } from 'react';
import { showError, showSuccess } from 'utils/common';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import PerfectScrollbar from 'react-perfect-scrollbar';
import ButtonGroup from '@mui/material/ButtonGroup';
import Toolbar from '@mui/material/Toolbar';

import { Button, Card, Stack, Container, Typography } from '@mui/material';
import ModelOwnedbyTableRow from './component/TableRow';
import KeywordTableHead from 'ui-component/TableHead';
import { API } from 'utils/api';
import EditeModal from './component/EditModal';
import { Icon } from '@iconify/react';

import { useTranslation } from 'react-i18next';
// ----------------------------------------------------------------------
export default function ModelOwnedby() {
  const { t } = useTranslation();
  const [modelOwnedby, setModelOwnedby] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(0);

  const fetchData = async () => {
    try {
      const res = await API.get(`/api/model_ownedby/`);
      const { success, message, data } = res.data;
      if (success) {
        setModelOwnedby(data);
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

  const manageModelOwnedBy = async (id, action) => {
    const url = '/api/model_ownedby/';
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
    setEditId(userId);
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

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">{t('modelOwnedby.title')}</Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<Icon icon="solar:add-circle-line-duotone" />}
          onClick={() => handleOpenModal(0)}
        >
          {t('modelOwnedby.create')}
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
        <PerfectScrollbar component="div">
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <KeywordTableHead
                headLabel={[
                  { id: 'id', label: t('modelOwnedby.id'), disableSort: false },
                  { id: 'name', label: t('modelOwnedby.name'), disableSort: false },
                  { id: 'icon', label: t('modelOwnedby.icon'), disableSort: false },
                  { id: 'action', label: t('modelOwnedby.action'), disableSort: true }
                ]}
              />
              <TableBody>
                {modelOwnedby.map((row) => (
                  <ModelOwnedbyTableRow
                    item={row}
                    manageModelOwnedBy={manageModelOwnedBy}
                    key={row.id}
                    handleOpenModal={handleOpenModal}
                    setModalId={setEditId}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </PerfectScrollbar>
      </Card>
      <EditeModal open={openModal} onCancel={handleCloseModal} onOk={handleOkModal} Oid={editId} />
    </>
  );
}
