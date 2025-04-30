import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Stack,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { API } from 'utils/api';
import { showError, showSuccess } from 'utils/common';
import LoadingButton from '@mui/lab/LoadingButton';
import { Icon } from '@iconify/react';
import { extraRatiosConfig } from './config';

export const CheckUpdates = ({ open, onCancel, onOk, row }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [newPricing, setNewPricing] = useState([]);
  const [addModel, setAddModel] = useState([]);
  const [diffModel, setDiffModel] = useState([]);

  // 从localStorage获取保存的URL
  useEffect(() => {
    const savedUrl = localStorage.getItem('oneapi_price_update_url');
    if (savedUrl) {
      setUrl(savedUrl);
    } else {
      fetchDefaultUrl();
    }
  }, []);

  const fetchDefaultUrl = async () => {
    try {
      const res = await API.get('/api/prices/updateService');
      if (res.data?.data) {
        const serviceUrl = res.data.data;
        setUrl(serviceUrl);
        localStorage.setItem('oneapi_price_update_url', serviceUrl);
      }
    } catch (err) {
      console.error(err);
      const defaultUrl = 'https://raw.githubusercontent.com/MartialBE/one-api/prices/prices.json';
      setUrl(defaultUrl);
      localStorage.setItem('oneapi_price_update_url', defaultUrl);
    }
  };

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    localStorage.setItem('oneapi_price_update_url', newUrl);
  };

  const handleCheckUpdates = async () => {
    setLoading(true);
    try {
      const res = await API.get(url);
      let responseData = Array.isArray(res?.data) ? res.data : res?.data?.data ?? [];
      // 检测是否是一个列表
      if (!Array.isArray(responseData)) {
        showError(t('CheckUpdatesTable.dataFormatIncorrect'));
      } else {
        setNewPricing(responseData);
      }
    } catch (err) {
      showError(err.message);
      console.error(err);
    }
    setLoading(false);
  };

  const syncPricing = async (updateMode) => {
    setUpdateLoading(true);
    if (!newPricing.length) {
      showError(t('CheckUpdatesTable.pleaseFetchData'));
      setUpdateLoading(false);
      return;
    }

    if (updateMode === 'add' && !addModel.length) {
      showError(t('CheckUpdatesTable.noNewModels'));
      setUpdateLoading(false);
      return;
    }
    try {
      const res = await API.post('/api/prices/sync?updateMode=' + updateMode, newPricing);
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('CheckUpdatesTable.operationCompleted'));
        onOk(true);
      } else {
        showError(message);
      }
    } catch (err) {
      console.error(err);
    }
    setUpdateLoading(false);
  };

  // 检查两个 extra_ratios 对象是否有差异
  const hasExtraRatiosDiff = useCallback((oldRatios, newRatios) => {
    if (!oldRatios && !newRatios) return false;
    if (!oldRatios && newRatios) return true;
    if (oldRatios && !newRatios) return true;

    const allKeys = [...new Set([...Object.keys(oldRatios), ...Object.keys(newRatios)])];
    return allKeys.some((key) => oldRatios[key] !== newRatios[key]);
  }, []);

  // 获取扩展价格的显示名称
  const getExtraRatioDisplayName = useCallback((key) => {
    const config = extraRatiosConfig.find((item) => item.key === key);
    return config ? config.name : key;
  }, []);

  // 获取 extra_ratios 的变化信息
  const getExtraRatiosChanges = useCallback(
    (oldRatios, newRatios) => {
      if (!oldRatios && newRatios) {
        // 全新增加的扩展价格
        const added = Object.entries(newRatios).map(([key, value]) => {
          const displayName = getExtraRatioDisplayName(key);
          return `${t('CheckUpdatesTable.added')} ${displayName} ${value}`;
        });
        return added;
      }

      if (oldRatios && !newRatios) {
        // 全部删除的扩展价格
        const removed = Object.keys(oldRatios).map((key) => {
          const displayName = getExtraRatioDisplayName(key);
          return `${t('CheckUpdatesTable.removed')} ${displayName}`;
        });
        return removed;
      }

      const changes = [];
      const allKeys = [...new Set([...Object.keys(oldRatios), ...Object.keys(newRatios)])];

      allKeys.forEach((key) => {
        const oldValue = oldRatios[key];
        const newValue = newRatios[key];
        const displayName = getExtraRatioDisplayName(key);

        if (oldValue === undefined && newValue !== undefined) {
          changes.push(`${t('CheckUpdatesTable.added')} ${displayName} ${newValue}`);
        } else if (oldValue !== undefined && newValue === undefined) {
          changes.push(`${t('CheckUpdatesTable.removed')} ${displayName}`);
        } else if (oldValue !== newValue) {
          changes.push(`${t('CheckUpdatesTable.modified')} ${displayName} ${oldValue}->${newValue}`);
        }
      });

      return changes;
    },
    [t, getExtraRatioDisplayName]
  );

  useEffect(() => {
    const newModels = newPricing.filter((np) => !row.some((r) => r.model === np.model));

    const changeModel = row.filter((r) =>
      newPricing.some(
        (np) =>
          np.model === r.model && (np.input !== r.input || np.output !== r.output || hasExtraRatiosDiff(r.extra_ratios, np.extra_ratios))
      )
    );

    if (newModels.length > 0) {
      const newModelsList = newModels.map((model) => model.model);
      setAddModel(newModelsList);
    } else {
      setAddModel([]);
    }

    if (changeModel.length > 0) {
      const changeModelList = changeModel.map((model) => {
        const newModel = newPricing.find((np) => np.model === model.model);
        let changes = '';
        let extraRatiosChanges = '';

        if (model.input !== newModel.input) {
          changes += `${t('CheckUpdatesTable.inputMultiplierChanged')} ${model.input} ${t('CheckUpdatesTable.to')} ${newModel.input}, `;
        }
        if (model.output !== newModel.output) {
          changes += `${t('CheckUpdatesTable.outputMultiplierChanged')} ${model.output} ${t('CheckUpdatesTable.to')} ${newModel.output}, `;
        }

        // 单独处理扩展价格变动
        if (hasExtraRatiosDiff(model.extra_ratios, newModel.extra_ratios)) {
          extraRatiosChanges = getExtraRatiosChanges(model.extra_ratios, newModel.extra_ratios);
        }

        // 去除末尾可能多余的逗号和空格
        changes = changes.replace(/,\s*$/, '');

        return {
          model: model.model,
          basicChanges: changes,
          extraRatiosChanges: extraRatiosChanges
        };
      });
      setDiffModel(changeModelList);
    } else {
      setDiffModel([]);
    }
  }, [row, newPricing, t, hasExtraRatiosDiff, getExtraRatiosChanges]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullWidth
      maxWidth={'md'}
      PaperProps={{
        sx: {
          borderRadius: 1,
          overflow: 'hidden',
          backgroundImage: 'none'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 2 }}>
        <Icon icon="solar:restart-bold" width={20} height={20} style={{ marginRight: 8 }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {t('CheckUpdatesTable.checkUpdates')}
        </Typography>
        <IconButton edge="end" color="inherit" onClick={onCancel} aria-label="close" size="small">
          <Icon icon="solar:close-circle-bold" />
        </IconButton>
      </Box>

      <Divider />

      <DialogContent sx={{ p: 2 }}>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder={t('CheckUpdatesTable.url')}
            value={url}
            onChange={handleUrlChange}
            InputProps={{
              endAdornment: (
                <Tooltip title={t('CheckUpdatesTable.fetchData')}>
                  <IconButton edge="end" onClick={handleCheckUpdates} disabled={loading} color="primary" size="small">
                    <Icon icon={loading ? 'svg-spinners:180-ring' : 'solar:refresh-bold'} fontSize="1.2rem" />
                  </IconButton>
                </Tooltip>
              ),
              sx: { borderRadius: 1 }
            }}
          />
        </Box>

        {newPricing.length > 0 && (
          <>
            <Card variant="outlined" sx={{ mb: 2, borderRadius: 1 }}>
              <CardContent sx={{ p: '12px !important' }}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    size="small"
                    label={`${t('CheckUpdatesTable.priceServerTotal')}: ${newPricing.length}`}
                    color="primary"
                    sx={{ borderRadius: '16px' }}
                  />
                  <Chip
                    size="small"
                    label={`${t('CheckUpdatesTable.newModels')}: ${addModel.length}`}
                    color="success"
                    sx={{ borderRadius: '16px' }}
                  />
                  <Chip
                    size="small"
                    label={`${t('CheckUpdatesTable.priceChangeModels')}: ${diffModel.length}`}
                    color="warning"
                    sx={{ borderRadius: '16px' }}
                  />
                </Stack>
              </CardContent>
            </Card>

            {!addModel.length && !diffModel.length && (
              <Alert severity="success" variant="outlined" sx={{ mb: 2, borderRadius: 1 }}>
                {t('CheckUpdatesTable.noUpdates')}
              </Alert>
            )}

            <Stack spacing={2}>
              {addModel.length > 0 && (
                <Card variant="outlined" sx={{ borderRadius: 1 }}>
                  <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Icon icon="solar:add-circle-bold" style={{ marginRight: 8 }} />
                      {t('CheckUpdatesTable.newModels')}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, maxHeight: '150px', overflow: 'auto' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                      {addModel.map((model) => (
                        <Chip
                          key={model}
                          label={model}
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: '14px', fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Card>
              )}

              {diffModel.length > 0 && (
                <Card variant="outlined" sx={{ borderRadius: 1 }}>
                  <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Icon icon="solar:pen-bold" style={{ marginRight: 8 }} />
                      {t('CheckUpdatesTable.priceChangeModels')}
                    </Typography>
                  </Box>
                  <List disablePadding sx={{ maxHeight: '200px', overflow: 'auto' }}>
                    {diffModel.map((item, idx) => (
                      <React.Fragment key={item.model}>
                        {idx > 0 && <Divider component="li" />}
                        <ListItem sx={{ px: 2, py: 1 }}>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {item.model}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                {item.basicChanges && (
                                  <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                                    {item.basicChanges}
                                  </Typography>
                                )}

                                {item.extraRatiosChanges && item.extraRatiosChanges.length > 0 && (
                                  <Box sx={{ ml: 1, borderLeft: 1, borderColor: 'warning.main', pl: 1.5 }}>
                                    {item.extraRatiosChanges.map((change, index) => (
                                      <Typography key={index} variant="caption" display="block" sx={{ fontSize: '0.7rem' }}>
                                        • {change}
                                      </Typography>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </Card>
              )}

              <Alert
                severity="info"
                variant="outlined"
                icon={<Icon icon="solar:info-circle-bold" />}
                sx={{ borderRadius: 1, fontSize: '0.75rem' }}
              >
                {t('CheckUpdatesTable.note')}: {t('CheckUpdatesTable.overwriteOrAddOnly')}
              </Alert>
            </Stack>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, justifyContent: 'space-between' }}>
        <Button onClick={onCancel} variant="outlined" size="small" color="inherit" sx={{ borderRadius: '18px' }}>
          {t('CheckUpdatesTable.cancel')}
        </Button>

        {newPricing.length > 0 && (
          <Stack direction="row" spacing={1}>
            <LoadingButton
              variant="contained"
              size="small"
              color="success"
              onClick={() => syncPricing('add')}
              loading={updateLoading}
              disabled={addModel.length === 0}
              sx={{ borderRadius: '18px' }}
            >
              {t('CheckUpdatesTable.updateModeAdd')}
            </LoadingButton>
            <LoadingButton
              variant="contained"
              size="small"
              color="warning"
              onClick={() => syncPricing('update')}
              loading={updateLoading}
              sx={{ borderRadius: '18px' }}
            >
              {t('CheckUpdatesTable.updateModeUpdate')}
            </LoadingButton>
            <LoadingButton
              variant="contained"
              size="small"
              color="primary"
              onClick={() => syncPricing('overwrite')}
              loading={updateLoading}
              sx={{ borderRadius: '18px' }}
            >
              {t('CheckUpdatesTable.updateModeOverwrite')}
            </LoadingButton>
          </Stack>
        )}
      </DialogActions>
    </Dialog>
  );
};

CheckUpdates.propTypes = {
  open: PropTypes.bool,
  row: PropTypes.array,
  onCancel: PropTypes.func,
  onOk: PropTypes.func
};
