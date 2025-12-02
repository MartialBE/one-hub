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

import { Icon } from '@iconify/react';

import Label from 'ui-component/Label';
import { MODALITY_OPTIONS } from 'constants/Modality';
import { copy } from 'utils/common';

export default function ModelInfoTableRow({ item, manageModelInfo, handleOpenModal }) {
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
    await manageModelInfo(item.id, 'delete');
  };

  return (
    <>
      <TableRow tabIndex={item.id}>
        <TableCell>
          <Label color="success" sx={{ mr: 0.5, cursor: 'pointer' }} onClick={() => copy(item.model, '模型标识')}>
            {item.model}
          </Label>
        </TableCell>
        <TableCell>{item.name}</TableCell>
        <TableCell>{item.context_length}</TableCell>
        <TableCell>{item.max_tokens}</TableCell>
        <TableCell>
          {(() => {
            try {
              const inputModalities = JSON.parse(item.input_modalities || '[]');
              return inputModalities.map((modality, index) => (
                <Label key={index} variant="soft" color={MODALITY_OPTIONS[modality]?.color || 'primary'} sx={{ mr: 0.5 }}>
                  {MODALITY_OPTIONS[modality]?.text}
                </Label>
              ));
            } catch (e) {
              return '';
            }
          })()}
        </TableCell>
        <TableCell>
          {(() => {
            try {
              const outputModalities = JSON.parse(item.output_modalities || '[]');
              return outputModalities.map((modality, index) => (
                <Label key={index} variant="soft" color={MODALITY_OPTIONS[modality]?.color || 'secondary'} sx={{ mr: 0.5 }}>
                  {MODALITY_OPTIONS[modality]?.text}
                </Label>
              ));
            } catch (e) {
              return '';
            }
          })()}
        </TableCell>
        <TableCell>
          {(() => {
            try {
              const tags = JSON.parse(item.tags || '[]');
              return tags.map((tag, index) => (
                <Label key={index} variant="soft" color="info" sx={{ mr: 0.5 }}>
                  {tag}
                </Label>
              ));
            } catch (e) {
              return '';
            }
          })()}
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
            handleOpenModal(item.id);
          }}
        >
          <Icon icon="solar:pen-bold-duotone" style={{ marginRight: '16px' }} />
          编辑
        </MenuItem>
        <MenuItem onClick={handleDeleteOpen} sx={{ color: 'error.main' }}>
          <Icon icon="solar:trash-bin-trash-bold-duotone" style={{ marginRight: '16px' }} />
          删除
        </MenuItem>
      </Popover>

      <Dialog open={openDelete} onClose={handleDeleteClose}>
        <DialogTitle>删除模型信息</DialogTitle>
        <DialogContent>
          <DialogContentText>确定要删除 {item.name} 吗？</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>取消</Button>
          <Button onClick={handleDelete} sx={{ color: 'error.main' }} autoFocus>
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

ModelInfoTableRow.propTypes = {
  item: PropTypes.object,
  manageModelInfo: PropTypes.func,
  handleOpenModal: PropTypes.func
};
