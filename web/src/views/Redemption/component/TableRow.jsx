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
  Stack
} from '@mui/material';

import Label from 'ui-component/Label';
import TableSwitch from 'ui-component/Switch';
import { timestamp2string, renderQuota, copy } from 'utils/common';

import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';

export default function RedemptionTableRow({ item, manageRedemption, handleOpenModal, setModalRedemptionId }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [statusSwitch, setStatusSwitch] = useState(item.status);

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

  const handleStatus = async () => {
    const switchVlue = statusSwitch === 1 ? 2 : 1;
    const { success } = await manageRedemption(item.id, 'status', switchVlue);
    if (success) {
      setStatusSwitch(switchVlue);
    }
  };

  const handleDelete = async () => {
    handleCloseMenu();
    await manageRedemption(item.id, 'delete', '');
  };

  return (
    <>
      <TableRow tabIndex={item.id}>
        <TableCell>{item.id}</TableCell>

        <TableCell>{item.name}</TableCell>

        <TableCell>
          {item.status !== 1 && item.status !== 2 ? (
            <Label variant="filled" color={item.status === 3 ? 'success' : 'orange'}>
              {item.status === 3 ? t('analytics_index.used') : t('common.unknown')}
            </Label>
          ) : (
            <TableSwitch id={`switch-${item.id}`} checked={statusSwitch === 1} onChange={handleStatus} />
          )}
        </TableCell>

        <TableCell>{renderQuota(item.quota)}</TableCell>
        <TableCell>{timestamp2string(item.created_time)}</TableCell>
        <TableCell>{item.redeemed_time ? timestamp2string(item.redeemed_time) : t('redemptionPage.unredeemed')}</TableCell>
        <TableCell>
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {
                copy(item.key, t('topupCard.inputLabel'));
              }}
            >
              {t('token_index.copy')}
            </Button>
            <IconButton onClick={handleOpenMenu} sx={{ color: 'rgb(99, 115, 129)' }}>
              <Icon icon="solar:menu-dots-circle-bold-duotone" />
            </IconButton>
          </Stack>
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
        <MenuItem
          disabled={item.status !== 1 && item.status !== 2}
          onClick={() => {
            handleCloseMenu();
            handleOpenModal();
            setModalRedemptionId(item.id);
          }}
        >
          <Icon icon="solar:pen-bold-duotone" style={{ marginRight: '16px' }} />
          {t('common.edit')}
        </MenuItem>
        <MenuItem onClick={handleDeleteOpen} sx={{ color: 'error.main' }}>
          <Icon icon="solar:trash-bin-trash-bold-duotone" style={{ marginRight: '16px' }} />
          {t('common.delete')}
        </MenuItem>
      </Popover>

      <Dialog open={openDelete} onClose={handleDeleteClose}>
        <DialogTitle>{t('redemptionPage.del')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('redemptionPage.delTip')} {item.name}？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>{t('common.close')}</Button>
          <Button onClick={handleDelete} sx={{ color: 'error.main' }} autoFocus>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

RedemptionTableRow.propTypes = {
  item: PropTypes.object,
  manageRedemption: PropTypes.func,
  handleOpenModal: PropTypes.func,
  setModalRedemptionId: PropTypes.func
};
