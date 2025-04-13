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
  Collapse,
  Grid,
  Box,
  Typography,
  Button
} from '@mui/material';

import { Icon } from '@iconify/react';
import { ValueFormatter, priceType } from './util';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Label from 'ui-component/Label';
import { copy } from 'utils/common';
import { useTranslation } from 'react-i18next';

export default function PricesTableRow({ item, managePrices, handleOpenModal, ownedby }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  const [openRow, setOpenRow] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const type_label = priceType.find((pt) => pt.value === item.type);
  const channel_label = ownedby.find((ob) => ob.value === item.channel_type);
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
    handleDeleteClose();
    await managePrices(item, 'delete', '');
  };

  return (
    <>
      <TableRow tabIndex={item.id} onClick={() => setOpenRow(!openRow)}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpenRow(!openRow)}>
            {openRow ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        <TableCell>{type_label?.label}</TableCell>

        <TableCell>{channel_label?.label}</TableCell>
        <TableCell>{ValueFormatter(item.input)}</TableCell>
        <TableCell>{ValueFormatter(item.output)}</TableCell>
        <TableCell>{item.models.length}</TableCell>
        <TableCell>
          <Label color={item.locked ? 'error' : 'success'} variant="outlined">
            {item.locked ? t('pricing_edit.locked') : t('pricing_edit.unlocked')}
          </Label>
        </TableCell>

        <TableCell onClick={(event) => event.stopPropagation()}>
          <IconButton onClick={handleOpenMenu} sx={{ color: 'rgb(99, 115, 129)' }}>
            <Icon icon="solar:menu-dots-circle-bold-duotone" />
          </IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0, textAlign: 'left' }} colSpan={7}>
          <Collapse in={openRow} timeout="auto" unmountOnExit>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: 1 }}>
                  <Typography variant="h6" gutterBottom component="div">
                    {t('channel_row.canModels')}
                  </Typography>
                  {item.models.map((model) => (
                    <Label
                      variant="outlined"
                      color="primary"
                      key={model}
                      onClick={() => {
                        copy(model, t('modelpricePage.model'));
                      }}
                    >
                      {model}
                    </Label>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Collapse>
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
            handleOpenModal(item);
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
        <DialogTitle>{t('pricing_edit.delGroup')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('pricing_edit.delGroupTip')}</DialogContentText>
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

PricesTableRow.propTypes = {
  item: PropTypes.object,
  managePrices: PropTypes.func,
  handleOpenModal: PropTypes.func,
  priceType: PropTypes.array,
  ownedby: PropTypes.array
};
