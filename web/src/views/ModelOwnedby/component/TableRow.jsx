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
  Button
} from '@mui/material';

import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import IconWrapper from 'ui-component/IconWrapper';

export default function ModelOwnedbyTableRow({ item, manageModelOwnedBy, handleOpenModal, setModalId }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);

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

  const handleDelete = async () => {
    handleCloseMenu();
    await manageModelOwnedBy(item.id, 'delete');
  };

  return (
    <>
      <TableRow tabIndex={item.id}>
        <TableCell>{item.id}</TableCell>

        <TableCell>{item.name}</TableCell>
        <TableCell>
          <IconWrapper url={item.icon} />
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
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            handleOpenModal();
            setModalId(item.id);
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
        <DialogTitle>{t('common.delete')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('common.deleteConfirm', { title: item.name })}</DialogContentText>
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

ModelOwnedbyTableRow.propTypes = {
  item: PropTypes.object,
  manageModelOwnedBy: PropTypes.func,
  handleOpenModal: PropTypes.func,
  setModalId: PropTypes.func
};
