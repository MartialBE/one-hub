import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import { showInfo, showError, renderNumber } from 'utils/common';
import { API } from 'utils/api';
import { CHANNEL_OPTIONS } from 'constants/ChannelConstants';
import { useTranslation } from 'react-i18next';

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
  Tooltip,
  Button,
  Grid,
  Collapse,
  Typography,
  TextField,
  Stack,
  Menu,
  Box
} from '@mui/material';

import Label from 'ui-component/Label';
import TableSwitch from 'ui-component/Switch';

import ResponseTimeLabel from './ResponseTimeLabel';
import GroupLabel from './GroupLabel';

import { IconDotsVertical, IconEdit, IconTrash, IconCopy, IconWorldWww } from '@tabler/icons-react';
import { styled, alpha } from '@mui/material/styles';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { copy, renderQuota } from 'utils/common';

const StyledMenu = styled((props) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right'
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right'
    }}
    {...props}
  />
))(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color: theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenu-list': {
      padding: '4px 0'
    },
    '& .MuiMenuItem-root': {
      '& .MuiSvgIcon-root': {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5)
      },
      '&:active': {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity)
      }
    }
  }
}));

function statusInfo(t, status) {
  switch (status) {
    case 1:
      return t('channel_index.enabled');
    case 2:
      return t('channel_row.manual');
    case 3:
      return t('channel_row.auto');
    default:
      return t('common.unknown');
  }
}

export default function ChannelTableRow({ item, manageChannel, handleOpenModal, setModalChannelId, hideEdit }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  const [openTest, setOpenTest] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [statusSwitch, setStatusSwitch] = useState(item.status);
  const [priorityValve, setPriority] = useState(item.priority);
  const [weightValve, setWeight] = useState(item.weight);
  const [responseTimeData, setResponseTimeData] = useState({ test_time: item.test_time, response_time: item.response_time });
  const [itemBalance, setItemBalance] = useState(item.balance);

  const [openRow, setOpenRow] = useState(false);
  let modelMap = [];
  modelMap = item.models.split(',');
  modelMap.sort();

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

  const handleTestModel = (event) => {
    setOpenTest(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const handleStatus = async () => {
    const switchVlue = statusSwitch === 1 ? 2 : 1;
    const { success } = await manageChannel(item.id, 'status', switchVlue);
    if (success) {
      setStatusSwitch(switchVlue);
    }
  };

  const handlePriority = async (event) => {
    const currentValue = parseInt(event.target.value);
    if (isNaN(currentValue) || currentValue === priorityValve) {
      return;
    }

    if (currentValue < 0) {
      showError(t('channel_row.priorityTip'));
      return;
    }

    await manageChannel(item.id, 'priority', currentValue);
    setPriority(currentValue);
  };

  const handleWeight = async (event) => {
    const currentValue = parseInt(event.target.value);
    if (isNaN(currentValue) || currentValue === weightValve) {
      return;
    }

    if (currentValue < 1) {
      showError(t('channel_row.weightTip'));
      return;
    }

    await manageChannel(item.id, 'weight', currentValue);
    setWeight(currentValue);
  };

  const handleResponseTime = async (modelName) => {
    setOpenTest(null);

    if (typeof modelName !== 'string') {
      modelName = item.test_model;
    }

    if (modelName == '') {
      showError(t('channel_row.modelTestTip'));
      return;
    }
    const { success, time } = await manageChannel(item.id, 'test', modelName);
    if (success) {
      setResponseTimeData({ test_time: Date.now() / 1000, response_time: time * 1000 });
      showInfo(t('channel_row.modelTestSuccess', { channel: item.name, model: modelName, time: time.toFixed(2) }));
    }
  };

  const handleDeleteTag = async () => {
    handleCloseMenu();
    await manageChannel(item.id, 'delete_tag', '');
  };

  const updateChannelBalance = async () => {
    try {
      const res = await API.get(`/api/channel/update_balance/${item.id}`);
      const { success, message, balance } = res.data;
      if (success) {
        setItemBalance(balance);

        showInfo(t('channel_row.updateOk'));
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  const handleDelete = async () => {
    handleCloseMenu();
    await manageChannel(item.id, 'delete', '');
  };

  useEffect(() => {
    setStatusSwitch(item.status);
    setPriority(item.priority);
    setWeight(item.weight);
    setItemBalance(item.balance);
    setResponseTimeData({ test_time: item.test_time, response_time: item.response_time });
  }, [item]);

  return (
    <>
      <TableRow tabIndex={item.id}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpenRow(!openRow)}>
            {openRow ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        <TableCell>{item.id}</TableCell>
        <TableCell>{item.name}</TableCell>

        <TableCell>
          <GroupLabel group={item.group} />
        </TableCell>

        <TableCell>{item.tag && <Label key={item.tag}>{item.tag}</Label>}</TableCell>

        <TableCell>
          {!CHANNEL_OPTIONS[item.type] ? (
            <Label color="error" variant="outlined">
              {t('common.unknown')}
            </Label>
          ) : (
            <Label color={CHANNEL_OPTIONS[item.type].color} variant="outlined">
              {CHANNEL_OPTIONS[item.type].text}
            </Label>
          )}
        </TableCell>
        <TableCell>
          <TableSwitch id={`switch-${item.id}`} checked={statusSwitch === 1} onChange={handleStatus} />
          {statusInfo(t, statusSwitch)}
        </TableCell>

        <TableCell>
          <ResponseTimeLabel
            test_time={responseTimeData.test_time}
            response_time={responseTimeData.response_time}
            handle_action={handleResponseTime}
          />
        </TableCell>
        {/* <TableCell>
          
        </TableCell> */}
        <TableCell>
          {renderQuota(item.used_quota)}
          <Tooltip title={t('channel_row.clickUpdateQuota')} placement="top" onClick={updateChannelBalance}>
            {renderBalance(item.type, itemBalance)}
          </Tooltip>
        </TableCell>
        <TableCell>
          <TextField
            id={`priority-${item.id}`}
            onBlur={handlePriority}
            type="number"
            label={t('channel_index.priority')}
            variant="standard"
            defaultValue={item.priority}
            inputProps={{ min: '0' }}
          />
        </TableCell>
        <TableCell>
          <TextField
            id={`weight-${item.id}`}
            onBlur={handleWeight}
            type="number"
            label={t('channel_index.weight')}
            variant="standard"
            defaultValue={item.weight}
            inputProps={{ min: '1' }}
          />
        </TableCell>

        <TableCell>
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
            <Tooltip title={t('channel_row.onlyChat')} placement="top">
              <Button
                id="test-model-button"
                aria-controls={openTest ? 'test-model-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={openTest ? 'true' : undefined}
                variant="outlined"
                disableElevation
                onClick={handleTestModel}
                endIcon={<KeyboardArrowDownIcon />}
                size="small"
              >
                {t('channel_row.test')}
              </Button>
            </Tooltip>
            <IconButton onClick={handleOpenMenu} sx={{ color: 'rgb(99, 115, 129)' }}>
              <IconDotsVertical />
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
        {!hideEdit && (
          <MenuItem
            onClick={() => {
              handleCloseMenu();
              handleOpenModal();
              setModalChannelId(item.id);
            }}
          >
            <IconEdit style={{ marginRight: '16px' }} />
            {t('common.edit')}
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            handleCloseMenu();
            manageChannel(item.id, 'copy');
          }}
        >
          <IconCopy style={{ marginRight: '16px' }} /> {t('token_index.copy')}{' '}
        </MenuItem>
        {CHANNEL_OPTIONS[item.type]?.url && (
          <MenuItem
            onClick={() => {
              handleCloseMenu();
              // 新页面打开
              window.open(CHANNEL_OPTIONS[item.type].url);
            }}
          >
            <IconWorldWww style={{ marginRight: '16px' }} />
            {t('channel_row.channelWeb')}
          </MenuItem>
        )}

        {item.tag && (
          <MenuItem onClick={handleDeleteTag} sx={{ color: 'error.main' }}>
            <IconTrash style={{ marginRight: '16px' }} />
            {t('channel_row.delTag')}
          </MenuItem>
        )}
        <MenuItem onClick={handleDeleteOpen} sx={{ color: 'error.main' }}>
          <IconTrash style={{ marginRight: '16px' }} />
          {t('common.delete')}
        </MenuItem>
      </Popover>

      <StyledMenu
        id="test-model-menu"
        MenuListProps={{
          'aria-labelledby': 'test-model-button'
        }}
        anchorEl={openTest}
        open={!!openTest}
        onClose={() => {
          setOpenTest(null);
        }}
      >
        {modelMap.map((model) => (
          <MenuItem
            key={'test_model-' + model}
            onClick={() => {
              handleResponseTime(model);
            }}
          >
            {model}
          </MenuItem>
        ))}
      </StyledMenu>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0, textAlign: 'left' }} colSpan={20}>
          <Collapse in={openRow} timeout="auto" unmountOnExit>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: 1 }}>
                  <Typography variant="h6" gutterBottom component="div">
                    {t('channel_row.canModels')}
                  </Typography>
                  {modelMap.map((model) => (
                    <Label
                      variant="outlined"
                      color="primary"
                      key={model}
                      onClick={() => {
                        copy(model, t('channel_index.modelName'));
                      }}
                    >
                      {model}
                    </Label>
                  ))}
                </Box>
              </Grid>
              {item.test_model && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: 1 }}>
                    <Typography variant="h6" gutterBottom component="div">
                      {t('channel_row.testModels') + ':'}
                    </Typography>
                    <Label
                      variant="outlined"
                      color="default"
                      key={item.test_model}
                      onClick={() => {
                        copy(item.test_model, t('channel_row.testModels'));
                      }}
                    >
                      {item.test_model}
                    </Label>
                  </Box>
                </Grid>
              )}
              {item.proxy && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: 1 }}>
                    <Typography variant="h6" gutterBottom component="div">
                      {t('channel_row.proxy')}
                    </Typography>
                    {item.proxy}
                  </Box>
                </Grid>
              )}
              {item.other && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: 1 }}>
                    <Typography variant="h6" gutterBottom component="div">
                      {t('channel_row.otherArg') + ':'}
                    </Typography>
                    <Label
                      variant="outlined"
                      color="default"
                      key={item.other}
                      onClick={() => {
                        copy(item.other, t('channel_row.otherArg'));
                      }}
                    >
                      {item.other}
                    </Label>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Collapse>
        </TableCell>
      </TableRow>
      <Dialog open={openDelete} onClose={handleDeleteClose}>
        <DialogTitle>{t('channel_row.delChannel')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('channel_row.delChannelInfo')} {item.name}？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>{t('token_index.close')}</Button>
          <Button onClick={handleDelete} sx={{ color: 'error.main' }} autoFocus>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

ChannelTableRow.propTypes = {
  item: PropTypes.object,
  manageChannel: PropTypes.func,
  handleOpenModal: PropTypes.func,
  setModalChannelId: PropTypes.func,
  hideEdit: PropTypes.bool
};

function renderBalance(type, balance) {
  switch (type) {
    case 1: // OpenAI
      return (
        <span>
          <br />${balance.toFixed(2)}
        </span>
      );
    case 4: // CloseAI
      return (
        <span>
          <br />¥{balance.toFixed(2)}
        </span>
      );
    case 8: // 自定义
      return (
        <span>
          <br />${balance.toFixed(2)}
        </span>
      );
    case 5: // OpenAI-SB
      return (
        <span>
          <br />¥{(balance / 10000).toFixed(2)}
        </span>
      );
    case 10: // AI Proxy
      return (
        <span>
          <br />
          {renderNumber(balance)}
        </span>
      );
    case 12: // API2GPT
      return (
        <span>
          <br />¥{balance.toFixed(2)}
        </span>
      );
    case 13: // AIGC2D
      return (
        <span>
          <br />
          {renderNumber(balance)}
        </span>
      );
    default:
      return <span></span>;
  }
}
