import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import { showInfo, showError, showSuccess } from 'utils/common';
import { API } from 'utils/api';
import { CHANNEL_OPTIONS } from 'constants/ChannelConstants';
import { useTranslation } from 'react-i18next';
import { useBoolean } from 'src/hooks/use-boolean';
import ConfirmDialog from 'ui-component/confirm-dialog';
import EditeModal from './EditModal';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { usePopover } from 'hooks/use-popover';

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
  Box,
  Switch,
  InputAdornment,
  CircularProgress,
  Table,
  TableBody,
  TableHead,
  Checkbox,
  TablePagination,
  MenuList
} from '@mui/material';

import Label from 'ui-component/Label';
// import TableSwitch from 'ui-component/Switch';

import ResponseTimeLabel from './ResponseTimeLabel';
import GroupLabel from './GroupLabel';

import { styled, alpha } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { copy, renderQuota } from 'utils/common';
import { ChannelCheck } from './ChannelCheck';
import { PAGE_SIZE_OPTIONS, getPageSize, savePageSize } from 'constants';

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

export default function ChannelTableRow({ item, manageChannel, onRefresh, groupOptions, modelOptions }) {
  const { t } = useTranslation();
  const popover = usePopover();
  const confirmDelete = useBoolean();
  const check = useBoolean();
  const updateBalanceOption = useBoolean();

  const [openTest, setOpenTest] = useState(false);
  // const [openDelete, setOpenDelete] = useState(false);
  const [openCheck, setOpenCheck] = useState(false);
  const [statusSwitch, setStatusSwitch] = useState(item.status);

  const [priority, setPriority] = useState(item.priority);
  const [weight, setWeight] = useState(item.weight);
  const tagDeleteConfirm = useBoolean();
  const quickEdit = useBoolean();
  const simpleChannelEdit = useBoolean();
  const [totalTagChannels, setTotalTagChannels] = useState(0);
  const [isTagChannelsLoading, setIsTagChannelsLoading] = useState(false);
  const [tagChannels, setTagChannels] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [currentTestingChannel, setCurrentTestingChannel] = useState(null);
  const [tagPage, setTagPage] = useState(0);
  const [tagRowsPerPage, setTagRowsPerPage] = useState(() => getPageSize('channelTag'));
  const tagModelPopover = usePopover();

  const batchConfirm = useBoolean();

  const tagStatusConfirm = useBoolean();
  const [statusChangeAction, setStatusChangeAction] = useState('');

  const [responseTimeData, setResponseTimeData] = useState({ test_time: item.test_time, response_time: item.response_time });
  const [itemBalance, setItemBalance] = useState(item.balance);

  const [openRow, setOpenRow] = useState(false);
  let modelMap = [];
  modelMap = item.models.split(',');
  modelMap.sort();

  const [editedChannel, setEditedChannel] = useState({});
  const fetchTagChannels = useCallback(async () => {
    if (!item.tag) return;

    try {
      setIsTagChannelsLoading(true);
      const response = await API.get(`/api/channel_tag/${item.tag}/list`);
      if (response.data.success) {
        const data = response.data.data || [];
        setTagChannels(data);
        setTotalTagChannels(data.length);
      } else {
        showError(t('channel_row.getTagChannelsError', { message: response.data.message }));
      }
    } catch (error) {
      showError(t('channel_row.getTagChannelsErrorTip', { message: error.message }));
    } finally {
      setIsTagChannelsLoading(false);
    }
  }, [item.tag, t]);

  const handleChangeTagPage = (event, newPage) => {
    setTagPage(newPage);
  };

  const handleChangeTagRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setTagRowsPerPage(newRowsPerPage);
    setTagPage(0);
    savePageSize('channelTag', newRowsPerPage);
  };

  const handleToggleChannel = (channelId) => {
    setSelectedChannels((prev) => (prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]));
  };

  const handleToggleAll = () => {
    if (selectedChannels.length === tagChannels.length) {
      setSelectedChannels([]);
    } else {
      setSelectedChannels(tagChannels.map((channel) => channel.id));
    }
  };

  const handleTagChannelStatus = async (channelId, currentStatus) => {
    const newStatus = currentStatus === 1 ? 2 : 1;
    const { success } = await manageChannel(channelId, 'status', newStatus);
    if (success) {
      // 更新本地状态
      setTagChannels((prev) => prev.map((channel) => (channel.id === channelId ? { ...channel, status: newStatus } : channel)));
    }
  };

  // 处理子渠道的优先级变更
  const handleTagChannelPriorityChange = (channelId, value) => {
    // 更新本地UI状态
    setTagChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, priority: value } : c)));
  };

  const handleTagChannelTest = async (channel) => {
    const models = channel.models.split(',');
    if (models.length === 1) {
      // 如果只有一个模型，直接测速
      const testModel = models[0];
      const { success, time } = await manageChannel(channel.id, 'test', testModel);
      if (success) {
        showInfo(t('channel_row.modelTestSuccess', { channel: channel.name, model: testModel, time: time.toFixed(2) }));
        // 更新本地状态
        setTagChannels((prev) =>
          prev.map((c) =>
            c.id === channel.id
              ? {
                  ...c,
                  test_time: Date.now() / 1000,
                  response_time: time * 1000
                }
              : c
          )
        );
      }
    } else {
      // 多个模型，显示模型列表
      setCurrentTestingChannel(channel);
      tagModelPopover.onOpen();
    }
  };

  const handleBatchDelete = async () => {
    if (!selectedChannels.length) {
      showError(t('channel_row.batchAddIDRequired'));
      return;
    }

    batchConfirm.onTrue();
  };

  const executeBatchDelete = async () => {
    try {
      // 这里需要实现批量删除的API调用
      const { success, message } = await manageChannel(0, 'batch_delete', selectedChannels, false);
      if (success) {
        showInfo(t('channel_row.batchDeleteSuccess'));
        setSelectedChannels([]);
        fetchTagChannels(); // 重新获取数据
        onRefresh(false); // 刷新父组件数据
      } else {
        showError(t('channel_row.batchDeleteError', { message }));
      }
    } catch (error) {
      showError(t('channel_row.batchDeleteErrorTip', { message: error.message }));
    }
  };

  useEffect(() => {
    if (openRow && item.tag) {
      fetchTagChannels();
    }
  }, [openRow, item.tag, fetchTagChannels]);

  const handleTestModel = (event) => {
    setOpenTest(event.currentTarget);
  };

  const handleDeleteRow = useCallback(async () => {
    await manageChannel(item.id, 'delete', '');
  }, [manageChannel, item.id]);

  const handleStatus = async () => {
    const switchVlue = statusSwitch === 1 ? 2 : 1;
    const { success } = await manageChannel(item.id, 'status', switchVlue);
    if (success) {
      setStatusSwitch(switchVlue);
    }
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
        <TableCell sx={{ minWidth: 50, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <IconButton aria-label="expand row" size="small" onClick={() => setOpenRow(!openRow)}>
              {openRow ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
            {item.tag ? (
              <Label color="primary" variant="soft" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                {t('channel_row.tag')}
              </Label>
            ) : (
              item.id
            )}
          </Box>
        </TableCell>
        <TableCell sx={{ minWidth: 100, maxWidth: 220, overflow: 'hidden' }}>
          {item.tag ? (
            <Typography
              variant="subtitle1"
              sx={{
                color: 'primary.main',
                maxWidth: 100,
                display: 'block'
              }}
            >
              {item.tag}
            </Typography>
          ) : (
            <Typography
              variant="subtitle1"
              sx={{
                maxWidth: 100,
                lineHeight: 1.4
              }}
            >
              {item.name}
            </Typography>
          )}
        </TableCell>

        <TableCell>
          <GroupLabel group={item.group} />
        </TableCell>

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

        <TableCell align="center" sx={{ minWidth: 90 }}>
          {!item.tag && (
            <Stack direction="column" alignItems="center" spacing={0.5}>
              <Switch checked={statusSwitch === 1} onChange={handleStatus} size="small" />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: statusSwitch === 1 ? 600 : 400,
                  color: statusSwitch === 1 ? 'success.main' : 'text.secondary'
                }}
              >
                {statusInfo(t, statusSwitch)}
              </Typography>
            </Stack>
          )}
          {item.tag && (
            <Stack direction="row" spacing={1} justifyContent="center">
              <Tooltip title={t('channel_row.enableAllChannels')} placement="top">
                <IconButton
                  size="small"
                  onClick={() => {
                    setStatusChangeAction('enable');
                    tagStatusConfirm.onTrue();
                  }}
                  sx={{ color: 'success.main' }}
                >
                  <Icon icon="mdi:power" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('channel_row.disableAllChannels')} placement="top">
                <IconButton
                  size="small"
                  onClick={() => {
                    setStatusChangeAction('disable');
                    tagStatusConfirm.onTrue();
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <Icon icon="mdi:power-off" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </TableCell>

        <TableCell sx={{ minWidth: 90, textAlign: 'center' }}>
          {!item.tag && (
            <ResponseTimeLabel
              test_time={responseTimeData.test_time}
              response_time={responseTimeData.response_time}
              handle_action={handleResponseTime}
            />
          )}
        </TableCell>
        {/* <TableCell>
          
        </TableCell> */}
        <TableCell>
          {!item.tag && (
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="body1">{renderQuota(item.used_quota)}</Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'success.main',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
                onClick={updateChannelBalance}
              >
                {renderBalance(item.type, itemBalance)}
              </Typography>
            </Stack>
          )}
        </TableCell>

        <TableCell colSpan={item.tag ? 2 : 1}>
          <Box sx={{ display: 'flex' }}>
            <TextField
              id={`priority-${item.id}`}
              type="number"
              label={t('channel_index.priority')}
              variant="outlined"
              size="small"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              inputProps={{
                min: '0'
              }}
              sx={{ width: '90px' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        // 确保在提交时检查是否有变化
                        if (priority !== item.priority) {
                          const isTag = !!item.tag;
                          const channelId = isTag ? item.tag : item.id;
                          manageChannel(channelId, 'priority', priority, isTag)
                            .then(({ success }) => {
                              if (success) {
                                item.priority = priority;
                                showInfo(t('channel_row.priorityUpdateSuccess'));
                              }
                            })
                            .catch((error) => {
                              showError(t('channel_row.priorityUpdateError', { message: error.message }));
                            });
                        }
                      }}
                    >
                      <Icon icon="mdi:check" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </TableCell>

        {!item.tag && (
          <TableCell>
            <Box sx={{ display: 'flex' }}>
              <TextField
                id={`weight-${item.id}`}
                type="number"
                label={t('channel_index.weight')}
                variant="outlined"
                size="small"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                inputProps={{
                  min: '1'
                }}
                sx={{ width: '90px' }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          // 确保在提交时检查是否有变化
                          if (weight !== item.weight) {
                            manageChannel(item.id, 'weight', weight)
                              .then(({ success }) => {
                                if (success) {
                                  item.weight = weight;
                                  showInfo(t('channel_row.weightUpdateSuccess'));
                                }
                              })
                              .catch((error) => {
                                showError(t('channel_row.weightUpdateError', { message: error.message }));
                              });
                          }
                        }}
                      >
                        <Icon icon="mdi:check" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
          </TableCell>
        )}

        <TableCell>
          <Stack direction="row" justifyContent="right" alignItems="right" spacing={1}>
            {!item.tag && (
              <IconButton
                size="small"
                onClick={handleTestModel}
                aria-controls={openTest ? 'test-model-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={openTest ? 'true' : undefined}
                sx={{ color: 'info.main' }}
              >
                <Icon icon="mdi:speedometer" />
              </IconButton>
            )}

            <Tooltip title={t('common.edit')} placement="top" arrow>
              <IconButton onClick={quickEdit.onTrue} size="small">
                <Icon icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
            {!item.tag && (
              <IconButton onClick={popover.onOpen} size="small">
                <Icon icon="eva:more-vertical-fill" />
              </IconButton>
            )}

            {item.tag && (
              <Tooltip title={t('channel_row.deleteTagAndChannels')} placement="top">
                <IconButton sx={{ color: 'error.main' }} onClick={tagDeleteConfirm.onTrue} size="small">
                  <Icon icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </TableCell>
      </TableRow>

      <Popover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={() => {
          popover.onClose();
          // 如果在关闭后没有进一步操作，重置当前渠道
          if (!check.value && !confirmDelete.value && !updateBalanceOption.value) {
            setCurrentTestingChannel(null);
          }
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { minWidth: 140 }
        }}
      >
        <MenuItem
          onClick={() => {
            popover.onClose();
            manageChannel(currentTestingChannel ? currentTestingChannel.id : item.id, 'copy');
          }}
        >
          <Icon icon="solar:copy-bold-duotone" style={{ marginRight: '16px' }} />
          {t('token_index.copy')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setOpenCheck(true);
            popover.onClose();
          }}
        >
          <Icon icon="solar:checklist-minimalistic-bold" style={{ marginRight: '16px' }} />
          {t('channel_row.check')}
        </MenuItem>

        {CHANNEL_OPTIONS[currentTestingChannel ? currentTestingChannel?.type : item.type]?.url && (
          <MenuItem
            onClick={() => {
              popover.onClose();
              window.open(CHANNEL_OPTIONS[currentTestingChannel ? currentTestingChannel?.type : item.type].url);
            }}
          >
            <Icon icon="solar:global-line-duotone" style={{ marginRight: '16px' }} />
            {t('channel_row.channelWeb')}
          </MenuItem>
        )}

        {currentTestingChannel && (
          <MenuItem
            onClick={() => {
              popover.onClose();
              manageChannel(currentTestingChannel.id, 'delete_tag', '');
            }}
            sx={{ color: 'error.main' }}
          >
            <Icon icon="solar:trash-bin-trash-bold-duotone" style={{ marginRight: '16px' }} />
            {t('channel_row.delTag')}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            popover.onClose();
            confirmDelete.onTrue();
          }}
          sx={{ color: 'error.main' }}
        >
          <Icon icon="solar:trash-bin-trash-bold-duotone" style={{ marginRight: '16px' }} />
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
      <TableRow
        sx={{
          '&:hover': {
            backgroundColor: 'transparent !important'
          },
          '&.MuiTableRow-hover:hover': {
            backgroundColor: 'transparent !important'
          }
        }}
      >
        <TableCell style={{ paddingBottom: 0, paddingTop: 0, textAlign: 'left' }} colSpan={20}>
          <Collapse in={openRow} timeout="auto" unmountOnExit>
            <Grid container spacing={1} sx={{ py: 2 }}>
              <Grid item xs={12}>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    m: 1,
                    p: 0,
                    bgcolor: 'background.neutral',
                    borderRadius: 1,
                    alignItems: 'center'
                  }}
                >
                  <Typography
                    variant="body1"
                    component="div"
                    sx={{
                      fontWeight: 600,
                      color: 'text.secondary',
                      // mr: 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Icon icon="mdi:cube-outline" sx={{ mr: 0.5 }} /> {t('channel_row.canModels')}
                  </Typography>
                  {modelMap.map((model) => (
                    <Label
                      variant="soft"
                      color="primary"
                      key={model}
                      sx={{
                        // py: 0.75,
                        // px: 1.5,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        // '&:hover': { opacity: 0.8 }
                      }}
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
                <Grid xs={12}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '10px',
                      m: 1,
                      px: 1,
                      py: 0.5,
                      bgcolor: 'background.neutral',
                      borderRadius: 1,
                      alignItems: 'center'
                    }}
                  >
                    <Typography
                      variant="body1"
                      component="div"
                      sx={{
                        fontWeight: 600,
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Icon icon="mdi:speedometer" sx={{ mr: 0.5 }} /> {t('channel_row.testModels') + ':'}
                    </Typography>
                    <Label
                      variant="soft"
                      color="info"
                      key={item.test_model}
                      sx={{ fontSize: '0.75rem', cursor: 'pointer' }}
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
                <Grid xs={12}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '10px',
                      m: 1,
                      px: 1,
                      py: 0.5,
                      bgcolor: 'background.neutral',
                      borderRadius: 1,
                      alignItems: 'center'
                    }}
                  >
                    <Typography
                      variant="body1"
                      component="div"
                      sx={{
                        fontWeight: 600,
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Icon icon="mdi:web" sx={{ mr: 0.5 }} /> {t('channel_row.proxy')}
                    </Typography>
                    <Typography variant="body2">{item.proxy}</Typography>
                  </Box>
                </Grid>
              )}

              {item.other && (
                <Grid xs={12}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '10px',
                      m: 1,
                      px: 1,
                      py: 0.5,
                      bgcolor: 'background.neutral',
                      borderRadius: 1,
                      alignItems: 'center'
                    }}
                  >
                    <Typography
                      variant="body1"
                      component="div"
                      sx={{
                        fontWeight: 600,
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Icon icon="mdi:cog-outline" sx={{ mr: 0.5 }} /> {t('channel_row.otherArg')}
                    </Typography>
                    <Label
                      variant="soft"
                      color="default"
                      key={item.other}
                      sx={{ fontSize: '0.75rem', cursor: 'pointer' }}
                      onClick={() => {
                        copy(item.other, t('channel_row.otherArg'));
                      }}
                    >
                      {item.other}
                    </Label>
                  </Box>
                </Grid>
              )}
              {item.tag && (
                <Grid xs={12}>
                  <Box sx={{ m: 1, mt: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          sx={{
                            borderLeft: '3px solid',
                            borderColor: 'primary.main',
                            pl: 1.5,
                            py: 0.5
                          }}
                        >
                          {t('channel_row.tagChannelList')} ({totalTagChannels})
                        </Typography>
                        <Tooltip title={t('channel_row.refreshList')} placement="top">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setIsTagChannelsLoading(true);
                              fetchTagChannels().finally(() => {
                                setIsTagChannelsLoading(false);
                              });
                            }}
                          >
                            <Icon icon="mdi:refresh" width={18} height={18} />
                          </IconButton>
                        </Tooltip>
                      </Stack>

                      {selectedChannels.length > 0 && (
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<Icon icon="solar:trash-bin-trash-bold" />}
                          onClick={handleBatchDelete}
                          size="small"
                        >
                          {t('channel_row.batchDelete')} ({selectedChannels.length})
                        </Button>
                      )}
                    </Stack>

                    {isTagChannelsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : tagChannels.length === 0 ? (
                      <Typography variant="body2" sx={{ py: 2, textAlign: 'center', color: 'text.secondary' }}>
                        {t('channel_row.noTagChannels')}
                      </Typography>
                    ) : (
                      <Box>
                        <Box
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            overflow: 'hidden',
                            boxShadow: '0 0 8px rgba(0,0,0,0.05)'
                          }}
                        >
                          <PerfectScrollbar sx={{ maxHeight: 400 }}>
                            <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1, px: 1.5 } }}>
                              <TableHead sx={{ bgcolor: 'background.neutral' }}>
                                <TableRow>
                                  <TableCell padding="checkbox" sx={{ pl: 1, width: '40px', textAlign: 'center' }}>
                                    <Checkbox
                                      indeterminate={selectedChannels.length > 0 && selectedChannels.length < tagChannels.length}
                                      checked={tagChannels.length > 0 && selectedChannels.length === tagChannels.length}
                                      onChange={handleToggleAll}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell sx={{ width: '20%', textAlign: 'center', fontWeight: 600 }}>
                                    {t('channel_index.name')}
                                  </TableCell>
                                  <TableCell sx={{ width: '15%', textAlign: 'center', fontWeight: 600 }}>
                                    {t('channel_index.status')}
                                  </TableCell>
                                  <TableCell sx={{ width: '15%', textAlign: 'center', fontWeight: 600 }}>
                                    {t('channel_index.usedBalance')}
                                  </TableCell>
                                  <TableCell sx={{ width: '15%', textAlign: 'center', fontWeight: 600 }}>
                                    {t('channel_index.responseTime')}
                                  </TableCell>
                                  <TableCell sx={{ width: '25%', textAlign: 'center', fontWeight: 600 }}>
                                    {t('channel_index.priority')}
                                  </TableCell>
                                  <TableCell sx={{ width: '10%', textAlign: 'center', fontWeight: 600 }}>
                                    {t('channel_index.actions')}
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {tagChannels.slice(tagPage * tagRowsPerPage, tagPage * tagRowsPerPage + tagRowsPerPage).map((channel) => (
                                  <TableRow key={channel.id} hover>
                                    <TableCell padding="checkbox" sx={{ pl: 1, textAlign: 'center' }}>
                                      <Checkbox
                                        checked={selectedChannels.includes(channel.id)}
                                        onChange={() => handleToggleChannel(channel.id)}
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                      <Typography variant="body2" noWrap title={channel.name} sx={{ fontWeight: 500 }}>
                                        {channel.id} - {channel.name}
                                      </Typography>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                      <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
                                        <Switch
                                          checked={channel.status === 1}
                                          onChange={() => handleTagChannelStatus(channel.id, channel.status)}
                                          size="small"
                                        />
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            fontWeight: channel.status === 1 ? 600 : 400,
                                            color: channel.status === 1 ? 'success.main' : 'text.secondary'
                                          }}
                                        >
                                          {statusInfo(t, channel.status)}
                                          {/* {CHANNEL_STATUS_MAP[channel.status]?.label || '未知'} */}
                                        </Typography>
                                      </Stack>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                      <Tooltip title={t('channel_row.clickUpdateQuota')} placement="top">
                                        <Box sx={{ cursor: 'pointer' }} onClick={() => manageChannel(channel.id, 'update_balance')}>
                                          <Stack direction="column" spacing={0.5} alignItems="center" justifyContent="center">
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                fontSize: '0.8rem',
                                                fontWeight: 500,
                                                '&:hover': { textDecoration: 'underline' }
                                              }}
                                            >
                                              {renderQuota(channel.used_quota)}
                                            </Typography>
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                color: 'success.main',
                                                fontWeight: 600
                                              }}
                                            >
                                              ${channel.balance}
                                            </Typography>
                                          </Stack>
                                        </Box>
                                      </Tooltip>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                      <ResponseTimeLabel test_time={channel.test_time} response_time={channel.response_time} />
                                    </TableCell>

                                    <TableCell sx={{ textAlign: 'center' }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                        <TextField
                                          id={`priority-${channel.id}`}
                                          type="number"
                                          label="优先级"
                                          variant="standard"
                                          value={channel.priority}
                                          onChange={(e) => handleTagChannelPriorityChange(channel.id, Number(e.target.value))}
                                          inputProps={{
                                            min: '0',
                                            style: { padding: '4px', fontSize: '0.85rem' }
                                          }}
                                          sx={{
                                            width: '90px',
                                            '.MuiInputBase-root': {
                                              minHeight: '30px'
                                            },
                                            '.MuiInputLabel-root': {
                                              fontSize: '0.75rem',
                                              fontWeight: 500
                                            }
                                          }}
                                          InputProps={{
                                            endAdornment: (
                                              <InputAdornment position="end">
                                                <IconButton
                                                  size="small"
                                                  sx={{ p: 0.5 }}
                                                  color="primary"
                                                  edge="end"
                                                  onClick={() => {
                                                    try {
                                                      // 直接使用当前渠道对象和UI状态中的优先级值
                                                      const channelId = channel.id;
                                                      const newPriority = channel.priority;

                                                      // 直接发送请求更新优先级，不再进行二次检查
                                                      manageChannel(channelId, 'priority', newPriority)
                                                        .then(({ success }) => {
                                                          if (success) {
                                                            // 成功后更新本地状态（虽然没必要，因为UI状态已经是新值了）
                                                            showSuccess(t('channel_row.priorityUpdateSuccess'));
                                                          }
                                                        })
                                                        .catch((error) => {
                                                          showError(t('channel_row.priorityUpdateError', { message: error.message }));
                                                        });
                                                    } catch (error) {
                                                      showError(t('channel_row.priorityUpdateError', { message: error.message }));
                                                    }
                                                  }}
                                                >
                                                  <Icon icon="mdi:check" width={16} height={16} />
                                                </IconButton>
                                              </InputAdornment>
                                            )
                                          }}
                                        />
                                      </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                      <Stack direction="row" spacing={1} justifyContent="center">
                                        <Tooltip title={t('channel_row.testModels')} placement="top">
                                          <IconButton
                                            size="small"
                                            sx={{ p: 0.5, color: 'info.main' }}
                                            onClick={(event) => {
                                              handleTagChannelTest(channel);
                                              // 记录点击位置用于弹出模型列表
                                              if (channel.models.split(',').length > 1) {
                                                tagModelPopover.onOpen(event);
                                              }
                                            }}
                                          >
                                            <Icon icon="mdi:speedometer" width={18} height={18} />
                                          </IconButton>
                                        </Tooltip>

                                        <Tooltip title={t('common.edit')} placement="top">
                                          <IconButton
                                            size="small"
                                            sx={{ p: 0.5, color: 'primary.main' }}
                                            onClick={() => {
                                              setCurrentTestingChannel(channel);
                                              setEditedChannel({name: channel.name, key: channel.key})
                                              simpleChannelEdit.onTrue();
                                            }}
                                          >
                                            <Icon icon="solar:pen-bold" width={18} height={18} />
                                          </IconButton>
                                        </Tooltip>

                                        <Tooltip title={t('channel_index.actions')} placement="top">
                                          <IconButton
                                            size="small"
                                            sx={{ p: 0.5 }}
                                            onClick={(event) => {
                                              // 设置当前操作的渠道
                                              setCurrentTestingChannel(channel);
                                              // 打开更多操作菜单
                                              popover.onOpen(event);
                                            }}
                                          >
                                            <Icon icon="eva:more-vertical-fill" width={18} height={18} />
                                          </IconButton>
                                        </Tooltip>
                                      </Stack>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </PerfectScrollbar>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                          <TablePagination
                            component="div"
                            count={tagChannels.length}
                            page={tagPage}
                            onPageChange={handleChangeTagPage}
                            rowsPerPage={tagRowsPerPage}
                            onRowsPerPageChange={handleChangeTagRowsPerPage}
                            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
                            labelRowsPerPage="每页行数:"
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
                            sx={{
                              '.MuiTablePagination-toolbar': {
                                minHeight: '40px',
                                pl: 1
                              },
                              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                                fontSize: '0.75rem'
                              },
                              '.MuiTablePagination-select': {
                                padding: '0 8px'
                              }
                            }}
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Collapse>
        </TableCell>
      </TableRow>
      <Dialog open={confirmDelete.value} onClose={confirmDelete.onFalse}>
        <DialogTitle>{t('channel_row.delChannel')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('common.deleteConfirm', { title: currentTestingChannel ? currentTestingChannel.name : item.name })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={confirmDelete.onFalse}>{t('token_index.close')}</Button>
          <Button
            onClick={() => {
              if (currentTestingChannel) {
                // 处理子渠道删除
                manageChannel(currentTestingChannel.id, 'delete', '')
                  .then(({ success }) => {
                    if (success) {
                      // 从本地列表中移除
                      setTagChannels((prev) => prev.filter((c) => c.id !== currentTestingChannel.id));
                      // 减少总数
                      setTotalTagChannels((prev) => prev - 1);
                      // 重置当前选中的渠道
                      setCurrentTestingChannel(null);
                      showSuccess(t('common.deleteSuccess'));
                    }
                  })
                  .catch((error) => {
                    showError(t('common.deleteError', { message: error.message }));
                  });
              } else {
                // 处理主渠道删除
                handleDeleteRow();
              }
              confirmDelete.onFalse();
            }}
            sx={{ color: 'error.main' }}
            autoFocus
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
      <ChannelCheck item={currentTestingChannel || item} open={openCheck} onClose={() => setOpenCheck(false)} />

      <ConfirmDialog
        open={tagDeleteConfirm.value}
        onClose={tagDeleteConfirm.onFalse}
        title={t('channel_row.deleteTag')}
        content={t('channel_row.deleteTagConfirm', { tag: item.tag })}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              manageChannel(item.tag, 'delete', '', true)
                .then(({ success }) => {
                  if (success) {
                    showInfo(t('channel_row.deleteTagSuccess', { tag: item.tag }));
                    onRefresh(false); // 刷新父组件数据
                  }
                })
                .catch((error) => {
                  showError(t('channel_row.deleteTagError', { message: error.message }));
                });
              tagDeleteConfirm.onFalse();
            }}
          >
            {t('common.delete')}
          </Button>
        }
      />

      <ConfirmDialog
        open={tagStatusConfirm.value}
        onClose={tagStatusConfirm.onFalse}
        title={statusChangeAction === 'enable' ? t('channel_row.enableTagChannels') : t('channel_row.disableTagChannels')}
        content={t('channel_row.tagChannelsConfirm', {
          action: statusChangeAction === 'enable' ? t('channel_row.enable') : t('channel_row.disable'),
          tag: item.tag
        })}
        action={
          <Button
            variant="contained"
            color={statusChangeAction === 'enable' ? 'success' : 'error'}
            onClick={() => {
              manageChannel(item.tag, 'tag_change_status', statusChangeAction, false)
                .then(({ success }) => {
                  if (success) {
                    showInfo(
                      t('channel_row.tagChannelsSuccess', {
                        action: statusChangeAction === 'enable' ? t('channel_row.enable') : t('channel_row.disable')
                      })
                    );
                    onRefresh(false); // 刷新父组件数据
                  }
                })
                .catch((error) => {
                  showError(
                    t('channel_row.tagChannelsError', {
                      action: statusChangeAction === 'enable' ? t('channel_row.enable') : t('channel_row.disable'),
                      message: error.message
                    })
                  );
                });
              tagStatusConfirm.onFalse();
            }}
          >
            {t('common.submit')}
          </Button>
        }
      />

      <EditeModal
        open={quickEdit.value}
        onCancel={quickEdit.onFalse}
        onOk={() => {
          onRefresh(false);
          quickEdit.onFalse();
        }}
        channelId={item.tag ? item.tag : item.id}
        groupOptions={groupOptions}
        isTag={item.tag}
        modelOptions={modelOptions}
      />

      <Popover
        open={tagModelPopover.open}
        anchorEl={tagModelPopover.anchorEl}
        onClose={tagModelPopover.onClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { minWidth: 140 }
        }}
      >
        <MenuList>
          {currentTestingChannel &&
            currentTestingChannel.models.split(',').map((model) => (
              <MenuItem
                key={`tag-test-model-${model}`}
                onClick={() => {
                  manageChannel(currentTestingChannel.id, 'test', model).then(({ success, time }) => {
                    if (success) {
                      showSuccess(t('channel_row.modelTestSuccess', { channel: currentTestingChannel.name, model, time: time.toFixed(2) }));
                      // 更新本地状态
                      setTagChannels((prev) =>
                        prev.map((c) =>
                          c.id === currentTestingChannel.id
                            ? {
                                ...c,
                                test_time: Date.now() / 1000,
                                response_time: time * 1000
                              }
                            : c
                        )
                      );
                    }
                  });
                  tagModelPopover.onClose();
                }}
              >
                {model}
              </MenuItem>
            ))}
        </MenuList>
      </Popover>

      <ConfirmDialog
        open={batchConfirm.value}
        onClose={batchConfirm.onFalse}
        title={t('channel_row.batchDelete')}
        content={t('channel_row.batchDeleteConfirm', { count: selectedChannels.length })}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              executeBatchDelete();
              batchConfirm.onFalse();
            }}
          >
            {t('common.delete')}
          </Button>
        }
      />

      {/* 添加子渠道的简化编辑对话框 */}
      <Dialog open={simpleChannelEdit.value} onClose={simpleChannelEdit.onFalse} fullWidth maxWidth="md" >
        <DialogTitle>{t('common.edit')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="sub-channel-name"
            label={t('channel_index.channelName')}
            type="text"
            fullWidth
            variant="outlined"
            value={editedChannel.name}
            onChange={(e) => setEditedChannel({...editedChannel, name: e.target.value})}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            id="sub-channel-key"
            label={t('channel_row.key')}
            type="text"
            fullWidth
            multiline
            minRows={3}
            variant="outlined"
            value={editedChannel.key}
            onChange={(e) => setEditedChannel({...editedChannel, key: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={simpleChannelEdit.onFalse}>{t('common.cancel')}</Button>
          <Button variant="contained" color="primary"
            onClick={() => {
              if (!editedChannel?.name?.trim()) {
                showError(t('channel_edit.requiredName'));
                return;
              }
              if (!editedChannel?.key?.trim()) {
                showError(t('channel_row.keyRequired'));
                return;
              }
              
              // 确保这里使用currentTestingChannel的ID，因为这是子渠道
              const channelId = currentTestingChannel.id;
              
              // 创建一个包含名称和密钥的对象来更新
              const updateData = {
                id: channelId,
                name: editedChannel.name,
                key: editedChannel.key
              };
              
              // 使用PUT请求更新渠道
              API.put('/api/channel/', updateData)
                .then((res) => {
                  if (res && res.data) {
                    const { success, message } = res.data;
                    if (success) {
                      showSuccess(t('channel_edit.editSuccess'));
                      
                      // 更新本地状态
                      setTagChannels((prev) =>
                        prev.map((c) =>
                          c.id === channelId ? { ...c, name: editedChannel.name, key: editedChannel.key } : c
                        )
                      );
                      
                      onRefresh(false); // 刷新父组件数据
                    } else {
                      showError(message || t('channel_edit.editError'));
                    }
                  } else {
                    showError(t('channel_edit.editError'));
                  }
                })
                .catch((error) => {
                  const errorMessage = error.response?.data?.message || error.message || '未知错误';
                  showError(t('channel_edit.editError', { message: errorMessage }));
                })
                .finally(() => {
                  simpleChannelEdit.onFalse();
                  setCurrentTestingChannel(null);
                });
            }}
          >
            {t('common.submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

ChannelTableRow.propTypes = {
  item: PropTypes.object,
  manageChannel: PropTypes.func,
  onRefresh: PropTypes.func,
  groupOptions: PropTypes.array,
  modelOptions: PropTypes.array
};

function renderBalance(type, balance) {
  switch (type) {
    case 28: // Deepseek
      return <>¥{balance}</>;
    case 45: // Deepseek
      return <>¥{balance}</>;
    default:
      return <>${balance.toFixed(2)}</>;
  }
}
