import PropTypes from 'prop-types';
import { useState } from 'react';

import {
  Popover,
  TableRow,
  MenuItem,
  TableCell,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Tooltip,
  Stack,
  TextField,
  InputAdornment
} from '@mui/material';

import Label from 'ui-component/Label';
import TableSwitch from 'ui-component/Switch';
import { renderQuota, renderNumber, timestamp2string, renderQuotaByMoney, showError } from 'utils/common';
import { Icon } from '@iconify/react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from 'ui-component/confirm-dialog';

function renderRole(t, role) {
  switch (role) {
    case 1:
      return <Label color="default">{t('userPage.cUserRole')}</Label>;
    case 10:
      return <Label color="orange">{t('userPage.adminUserRole')}</Label>;
    case 100:
      return <Label color="success">{t('userPage.superAdminRole')}</Label>;
    default:
      return <Label color="error">{t('userPage.uUserRole')}</Label>;
  }
}

export default function UsersTableRow({ item, manageUser, handleOpenModal, setModalUserId }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [openChangeQuota, setOpenChangeQuota] = useState(false);
  const [statusSwitch, setStatusSwitch] = useState(item.status);
  const [money, setMoney] = useState(0);
  const [remark, setRemark] = useState('');

  const handleDeleteOpen = () => {
    handleCloseMenu();
    setOpenDelete(true);
  };

  const handleDeleteClose = () => {
    setOpenDelete(false);
  };

  const handleOpenMenu = (event) => {
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const handleChangeQuota = async () => {
    if (money === 0) {
      showError(t('userPage.changeQuotaNotEmpty'));
    }

    const quota = Number(renderQuotaByMoney(money));

    if (money < 0 && Math.abs(quota) > item.quota) {
      showError(t('userPage.changeQuotaNotEnough'));
      return;
    }
    const ok = await manageUser(item.id, 'quota', { quota: Number(quota), remark });
    if (ok) {
      setOpenChangeQuota(false);
    }
  };

  const handleStatus = async () => {
    const switchVlue = statusSwitch === 1 ? 2 : 1;
    const { success } = await manageUser(item.username, 'status', switchVlue);
    if (success) {
      setStatusSwitch(switchVlue);
    }
  };

  const handleDelete = async () => {
    handleCloseMenu();
    await manageUser(item.username, 'delete', '');
  };

  return (
    <>
      <TableRow tabIndex={item.id}>
        <TableCell>{item.id}</TableCell>

        <TableCell>{item.username}</TableCell>

        <TableCell>
          <Label>{item.group}</Label>
        </TableCell>

        <TableCell>
          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
            <Tooltip title={t('token_index.remainingQuota')} placement="top">
              <Label color={'primary'} variant="outlined">
                {' '}
                {renderQuota(item.quota)}{' '}
              </Label>
            </Tooltip>
            <Tooltip title={t('token_index.usedQuota')} placement="top">
              <Label color={'primary'} variant="outlined">
                {' '}
                {renderQuota(item.used_quota)}{' '}
              </Label>
            </Tooltip>
            <Tooltip title={t('userPage.useQuota')} placement="top">
              <Label color={'primary'} variant="outlined">
                {' '}
                {renderNumber(item.request_count)}{' '}
              </Label>
            </Tooltip>
          </Stack>
        </TableCell>
        <TableCell>{renderRole(t, item.role)}</TableCell>
        <TableCell>
          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
            <Tooltip title={item.wechat_id ? item.wechat_id : t('profilePage.notBound')} placement="top">
              <Icon icon="ri:wechat-fill" color={item.wechat_id ? theme.palette.success.dark : theme.palette.grey[400]} />
            </Tooltip>
            <Tooltip title={item.github_id ? item.github_id : t('profilePage.notBound')} placement="top">
              <Icon icon="ri:github-fill" color={item.github_id ? theme.palette.grey[900] : theme.palette.grey[400]} />
            </Tooltip>
            <Tooltip title={item.email ? item.email : t('profilePage.notBound')} placement="top">
              <Icon icon="ri:mail-fill" color={item.email ? theme.palette.grey[900] : theme.palette.grey[400]} />
            </Tooltip>
          </Stack>
        </TableCell>
        <TableCell>{item.created_time === 0 ? t('common.unknown') : timestamp2string(item.created_time)}</TableCell>
        <TableCell>
          {' '}
          <TableSwitch id={`switch-${item.id}`} checked={statusSwitch === 1} onChange={handleStatus} />
        </TableCell>
        <TableCell>
          <IconButton onClick={handleOpenMenu} sx={{ color: 'rgb(99, 115, 129)' }}>
            <Icon icon="solar:menu-dots-circle-bold-duotone" />
          </IconButton>
        </TableCell>
      </TableRow>

      <Popover
        open={!!open}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { minWidth: 140 }
        }}
      >
        {item.role !== 100 && (
          <MenuItem
            onClick={() => {
              handleCloseMenu();
              manageUser(item.username, 'role', item.role === 1 ? true : false);
            }}
          >
            <Icon icon="solar:user-bold-duotone" style={{ marginRight: '16px' }} />
            {item.role === 1 ? t('userPage.setAdmin') : t('userPage.cancelAdmin')}
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            handleCloseMenu();
            handleOpenModal();
            setModalUserId(item.id);
          }}
        >
          <Icon icon="solar:pen-bold-duotone" style={{ marginRight: '16px' }} />
          {t('common.edit')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            setOpenChangeQuota(true);
          }}
        >
          <Icon icon="solar:wallet-money-bold-duotone" style={{ marginRight: '16px' }} />
          {t('userPage.changeQuota')}
        </MenuItem>
        <MenuItem onClick={handleDeleteOpen} sx={{ color: 'error.main' }}>
          <Icon icon="solar:trash-bin-trash-bold-duotone" style={{ marginRight: '16px' }} />
          {t('common.delete')}
        </MenuItem>
      </Popover>

      <Dialog open={openDelete} onClose={handleDeleteClose}>
        <DialogTitle>{t('userPage.del')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('userPage.delTip')} {item.name}？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>{t('common.close')}</Button>
          <Button onClick={handleDelete} sx={{ color: 'error.main' }} autoFocus>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={openChangeQuota}
        onClose={() => setOpenChangeQuota(false)}
        title={t('userPage.changeQuota')}
        content={
          <>
            <TextField
              fullWidth
              id="quota-label"
              label={t('userPage.changeQuota')}
              type="number"
              value={money}
              onChange={(e) => setMoney(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                endAdornment: <InputAdornment position="end">{renderQuotaByMoney(money)}</InputAdornment>
              }}
              helperText={t('userPage.changeQuotaHelperText', { quota: renderQuota(item.quota, 6) })}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              id="quota-remark-label"
              label={t('userPage.quotaRemark')}
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              sx={{ mt: 2 }}
            />
          </>
        }
        action={
          <Button variant="contained" color="primary" onClick={handleChangeQuota}>
            {t('common.submit')}
          </Button>
        }
      />
    </>
  );
}

UsersTableRow.propTypes = {
  item: PropTypes.object,
  manageUser: PropTypes.func,
  handleOpenModal: PropTypes.func,
  setModalUserId: PropTypes.func
};
