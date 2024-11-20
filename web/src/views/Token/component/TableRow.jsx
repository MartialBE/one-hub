import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

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
  ButtonGroup
} from '@mui/material';

import TableSwitch from 'ui-component/Switch';
import { renderQuota, timestamp2string, copy, getChatLinks, replaceChatPlaceholders } from 'utils/common';
import Label from 'ui-component/Label';

import { Icon } from '@iconify/react';
import { IconCaretDownFilled } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
function createMenu(menuItems) {
  return (
    <>
      {menuItems.map((menuItem, index) => (
        <MenuItem key={index} onClick={menuItem.onClick} sx={{ color: menuItem.color }}>
          {menuItem.icon}
          {menuItem.text}
        </MenuItem>
      ))}
    </>
  );
}

function statusInfo(t, status) {
  switch (status) {
    case 1:
      return t('common.enable');
    case 2:
      return t('common.disable');
    case 3:
      return t('common.expired');
    case 4:
      return t('common.exhaust');
    default:
      return t('common.unknown');
  }
}

export default function TokensTableRow({ item, manageToken, handleOpenModal, setModalTokenId, userGroup }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  const [menuItems, setMenuItems] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [statusSwitch, setStatusSwitch] = useState(item.status);
  const siteInfo = useSelector((state) => state.siteInfo);
  const chatLinks = getChatLinks();

  const handleDeleteOpen = () => {
    handleCloseMenu();
    setOpenDelete(true);
  };

  const handleDeleteClose = () => {
    setOpenDelete(false);
  };

  const handleOpenMenu = (event, type) => {
    switch (type) {
      case 'copy':
        setMenuItems(copyItems);
        break;
      case 'link':
        setMenuItems(linkItems);
        break;
      default:
        setMenuItems(actionItems);
    }
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const handleStatus = async () => {
    const switchVlue = statusSwitch === 1 ? 2 : 1;
    const { success } = await manageToken(item.id, 'status', switchVlue);
    if (success) {
      setStatusSwitch(switchVlue);
    }
  };

  const handleDelete = async () => {
    handleCloseMenu();
    await manageToken(item.id, 'delete', '');
  };

  const actionItems = createMenu([
    {
      text: t('common.edit'),
      icon: <Icon icon="solar:pen-bold-duotone" style={{ marginRight: '16px' }} />,
      onClick: () => {
        handleCloseMenu();
        handleOpenModal();
        setModalTokenId(item.id);
      },
      color: undefined
    },
    {
      text: t('common.delete'),
      icon: <Icon icon="solar:trash-bin-trash-bold-duotone" style={{ marginRight: '16px' }} />,
      onClick: handleDeleteOpen,
      color: 'error.main'
    }
  ]);

  const handleCopy = (option, type) => {
    let server = '';
    if (siteInfo?.server_address) {
      server = siteInfo.server_address;
    } else {
      server = window.location.host;
    }

    server = encodeURIComponent(server);

    let url = option.url;

    const key = 'sk-' + item.key;
    const text = replaceChatPlaceholders(url, key, server);
    if (type === 'link') {
      window.open(text);
    } else {
      copy(text, t('common.link'));
    }
    handleCloseMenu();
  };

  const copyItems = createMenu(
    chatLinks.map((option) => ({
      text: option.name,
      icon: undefined,
      onClick: () => handleCopy(option, 'copy'),
      color: undefined
    }))
  );

  const linkItems = createMenu(
    chatLinks.map((option) => ({
      text: option.name,
      icon: undefined,
      onClick: () => handleCopy(option, 'link'),
      color: undefined
    }))
  );

  useEffect(() => {
    setStatusSwitch(item.status);
  }, [item.status]);

  return (
    <>
      <TableRow tabIndex={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>
          <Label color={userGroup[item.group]?.color}>{userGroup[item.group]?.name || '跟随用户'}</Label>
        </TableCell>

        <TableCell>
          <Tooltip
            title={(() => {
              return statusInfo(t, statusSwitch);
            })()}
            placement="top"
          >
            <TableSwitch
              id={`switch-${item.id}`}
              checked={statusSwitch === 1}
              onChange={handleStatus}
              // disabled={statusSwitch !== 1 && statusSwitch !== 2}
            />
          </Tooltip>
        </TableCell>

        <TableCell>{renderQuota(item.used_quota)}</TableCell>

        <TableCell>{item.unlimited_quota ? t('token_index.unlimited') : renderQuota(item.remain_quota, 2)}</TableCell>

        <TableCell>{timestamp2string(item.created_time)}</TableCell>

        <TableCell>{item.expired_time === -1 ? t('token_index.neverExpires') : timestamp2string(item.expired_time)}</TableCell>

        <TableCell>
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
            <ButtonGroup size="small" aria-label="split button">
              <Button
                color="primary"
                onClick={() => {
                  copy(`sk-${item.key}`, t('token_index.token'));
                }}
              >
                {t('token_index.copy')}
              </Button>
              <Button size="small" onClick={(e) => handleOpenMenu(e, 'copy')}>
                <IconCaretDownFilled size={'16px'} />
              </Button>
            </ButtonGroup>
            <ButtonGroup size="small" onClick={(e) => handleOpenMenu(e, 'link')} aria-label="split button">
              <Button color="primary">{t('token_index.chat')}</Button>
              <Button size="small">
                <IconCaretDownFilled size={'16px'} />
              </Button>
            </ButtonGroup>
            <IconButton onClick={(e) => handleOpenMenu(e, 'action')} sx={{ color: 'rgb(99, 115, 129)' }}>
              <Icon icon="solar:menu-dots-circle-bold-duotone" width={20} />
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
        {menuItems}
      </Popover>

      <Dialog open={openDelete} onClose={handleDeleteClose}>
        <DialogTitle>{t('token_index.deleteToken')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('token_index.confirmDeleteToken')} {item.name}？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>{t('token_index.close')}</Button>
          <Button onClick={handleDelete} sx={{ color: 'error.main' }} autoFocus>
            {t('token_index.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

TokensTableRow.propTypes = {
  item: PropTypes.object,
  manageToken: PropTypes.func,
  handleOpenModal: PropTypes.func,
  setModalTokenId: PropTypes.func,
  userGroup: PropTypes.object
};
