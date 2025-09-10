import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useTheme } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Switch,
  FormControlLabel,
  FormHelperText,
  Select,
  MenuItem,
  Typography,
  Grid,
  Checkbox,
  ListItemText,
  Chip
} from '@mui/material';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { renderQuotaWithPrompt, showSuccess, showError } from 'utils/common';
import { API } from 'utils/api';
import { useTranslation } from 'react-i18next';
import 'dayjs/locale/zh-cn';

const validationSchema = Yup.object().shape({
  is_edit: Yup.boolean(),
  name: Yup.string().required('名称 不能为空'),
  remain_quota: Yup.number().min(0, '必须大于等于0'),
  expired_time: Yup.number(),
  unlimited_quota: Yup.boolean(),
  setting: Yup.object().shape({
    heartbeat: Yup.object().shape({
      enabled: Yup.boolean(),
      timeout_seconds: Yup.number().when('enabled', {
        is: true,
        then: () => Yup.number().min(30, '时间 必须大于等于30秒').max(90, '时间 必须小于等于90秒').required('时间 不能为空'),
        otherwise: () => Yup.number()
      })
    })
  })
});

const originInputs = {
  is_edit: false,
  name: '',
  remain_quota: 0,
  expired_time: -1,
  unlimited_quota: false,
  group: '',
  backup_group: '',
  setting: {
    heartbeat: {
      enabled: false,
      timeout_seconds: 30
    },
    limits: {
      enabled: false,
      models: undefined
    }
  }
};

const EditModal = ({ open, tokenId, onCancel, onOk, userGroupOptions }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [inputs, setInputs] = useState(originInputs);
  const [modelOptions, setModelOptions] = useState([]);
  const [ownedByIcons, setOwnedByIcons] = useState({}); // 新增状态存储提供商图标

  // 获取模型提供商图标
  const fetchOwnedByIcons = async () => {
    try {
      const res = await API.get('/api/model_ownedby/');
      const { success, data } = res.data;
      if (success) {
        // 将提供商数据转换为以名称为键的对象
        const iconMap = {};
        data.forEach((provider) => {
          iconMap[provider.name] = provider.icon || '/src/assets/images/icons/unknown_type.svg';
        });
        setOwnedByIcons(iconMap);
      }
    } catch (error) {
      console.error('获取模型提供商图标失败:', error);
    }
  };

  // 获取模型列表
  const fetchModelOptions = async () => {
    try {
      const res = await API.get('/api/available_model');
      const { success, data } = res.data;
      if (success) {
        // 将新的数据结构转换为模型选项数组
        const models = Object.keys(data).map((modelId) => ({
          id: modelId,
          name: modelId,
          owned_by: data[modelId].owned_by,
          groups: data[modelId].groups,
          price: data[modelId].price
        }));
        setModelOptions(models);
      }
    } catch (error) {
      console.error('获取模型列表失败:', error);
    }
  };

  // 获取模型图标的辅助函数
  const getModelIcon = (ownedBy) => {
    return ownedByIcons[ownedBy] || '/src/assets/images/icons/unknown_type.svg';
  };

  const submit = async (values, { setErrors, setStatus, setSubmitting }) => {
    setSubmitting(true);

    values.remain_quota = parseInt(values.remain_quota);
    values.setting.heartbeat.timeout_seconds = parseInt(values.setting.heartbeat.timeout_seconds);
    let res;

    try {
      if (values.is_edit) {
        res = await API.put(`/api/token/`, { ...values, id: parseInt(tokenId) });
      } else {
        res = await API.post(`/api/token/`, values);
      }
      const { success, message } = res.data;
      if (success) {
        if (values.is_edit) {
          showSuccess('令牌更新成功！');
        } else {
          showSuccess('令牌创建成功，请在列表页面点击复制获取令牌！');
        }
        setSubmitting(false);
        setStatus({ success: true });
        onOk(true);
      } else {
        showError(message);
        setErrors({ submit: message });
      }
    } catch (error) {
      return;
    }
  };

  const loadToken = async () => {
    try {
      let res = await API.get(`/api/token/${tokenId}`);
      const { success, message, data } = res.data;
      if (success) {
        data.is_edit = true;
        setInputs(data);
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  useEffect(() => {
    if (open) {
      fetchOwnedByIcons(); // 先获取图标数据
      fetchModelOptions();
    }
  }, [open]);

  useEffect(() => {
    if (tokenId) {
      loadToken().then();
    } else {
      setInputs(originInputs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId]);

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth={'md'}>
      <DialogTitle sx={{ margin: '0px', fontWeight: 700, lineHeight: '1.55556', padding: '24px', fontSize: '1.125rem' }}>
        {tokenId ? t('token_index.editToken') : t('token_index.createToken')}
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Alert severity="info">{t('token_index.quotaNote')}</Alert>
        <Formik initialValues={inputs} enableReinitialize validationSchema={validationSchema} onSubmit={submit}>
          {({ errors, handleBlur, handleChange, handleSubmit, touched, values, setFieldError, setFieldValue, isSubmitting }) => (
            <form noValidate onSubmit={handleSubmit}>
              <FormControl fullWidth error={Boolean(touched.name && errors.name)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-name-label">{t('token_index.name')}</InputLabel>
                <OutlinedInput
                  id="channel-name-label"
                  label={t('token_index.name')}
                  type="text"
                  value={values.name}
                  name="name"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  inputProps={{ autoComplete: 'name' }}
                  aria-describedby="helper-text-channel-name-label"
                />
                {touched.name && errors.name && (
                  <FormHelperText error id="helper-tex-channel-name-label">
                    {errors.name}
                  </FormHelperText>
                )}
              </FormControl>
              {values.expired_time !== -1 && (
                <FormControl fullWidth error={Boolean(touched.expired_time && errors.expired_time)} sx={{ ...theme.typography.otherInput }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'zh-cn'}>
                    <DateTimePicker
                      label={t('token_index.expiryTime')}
                      ampm={false}
                      value={dayjs.unix(values.expired_time)}
                      onError={(newError) => {
                        if (newError === null) {
                          setFieldError('expired_time', null);
                        } else {
                          setFieldError('expired_time', t('token_index.invalidDate'));
                        }
                      }}
                      onChange={(newValue) => {
                        setFieldValue('expired_time', newValue.unix());
                      }}
                      slotProps={{
                        actionBar: {
                          actions: ['today', 'accept']
                        }
                      }}
                    />
                  </LocalizationProvider>
                  {errors.expired_time && (
                    <FormHelperText error id="helper-tex-channel-expired_time-label">
                      {errors.expired_time}
                    </FormHelperText>
                  )}
                </FormControl>
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={values.expired_time === -1}
                    onClick={() => {
                      if (values.expired_time === -1) {
                        setFieldValue('expired_time', Math.floor(Date.now() / 1000));
                      } else {
                        setFieldValue('expired_time', -1);
                      }
                    }}
                  />
                }
                label={t('token_index.neverExpires')}
              />

              <FormControl fullWidth error={Boolean(touched.remain_quota && errors.remain_quota)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-remain_quota-label">{t('token_index.quota')}</InputLabel>
                <OutlinedInput
                  id="channel-remain_quota-label"
                  label={t('token_index.quota')}
                  type="number"
                  value={values.remain_quota}
                  name="remain_quota"
                  endAdornment={<InputAdornment position="end">{renderQuotaWithPrompt(values.remain_quota)}</InputAdornment>}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  aria-describedby="helper-text-channel-remain_quota-label"
                  disabled={values.unlimited_quota}
                />

                {touched.remain_quota && errors.remain_quota && (
                  <FormHelperText error id="helper-tex-channel-remain_quota-label">
                    {errors.remain_quota}
                  </FormHelperText>
                )}
              </FormControl>
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Switch
                      checked={values.unlimited_quota === true}
                      onClick={() => {
                        setFieldValue('unlimited_quota', !values.unlimited_quota);
                      }}
                    />
                  }
                  label={t('token_index.unlimitedQuota')}
                />
              </FormControl>

              <Divider sx={{ margin: '16px 0px' }} />
              <Typography variant="h4">{t('token_index.heartbeat')}</Typography>
              <Typography variant="caption">{t('token_index.heartbeatTip')}</Typography>

              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Switch
                      checked={values?.setting?.heartbeat?.enabled === true}
                      onClick={() => {
                        setFieldValue('setting.heartbeat.enabled', !values.setting?.heartbeat?.enabled);
                      }}
                    />
                  }
                  label={t('token_index.heartbeat')}
                />
              </FormControl>

              {values?.setting?.heartbeat?.enabled && (
                <FormControl fullWidth>
                  <InputLabel>{t('token_index.heartbeatTimeout')}</InputLabel>
                  <OutlinedInput
                    id="channel-heartbeat-timeout-label"
                    label={t('token_index.heartbeatTimeout')}
                    type="number"
                    value={values?.setting?.heartbeat?.timeout_seconds}
                    onChange={(e) => {
                      setFieldValue('setting.heartbeat.timeout_seconds', e.target.value);
                    }}
                  />

                  {touched.setting?.heartbeat?.timeout_seconds && errors.setting?.heartbeat?.timeout_seconds ? (
                    <FormHelperText error id="helper-tex-channel-heartbeat-timeout-label">
                      {errors.setting?.heartbeat?.timeout_seconds}
                    </FormHelperText>
                  ) : (
                    <FormHelperText id="helper-tex-channel-heartbeat-timeout-label">
                      {t('token_index.heartbeatTimeoutHelperText')}
                    </FormHelperText>
                  )}
                </FormControl>
              )}

              <Divider sx={{ margin: '16px 0px' }} />
              <Typography variant="h4">{t('token_index.selectGroup')}</Typography>
              <Typography variant="caption">{t('token_index.selectGroupInfo')}</Typography>
              <Grid container spacing={2} mt={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('token_index.userGroup')}</InputLabel>
                    <Select
                      label={t('token_index.userGroup')}
                      name="group"
                      value={values.group || '-1'}
                      onChange={(e) => {
                        const value = e.target.value === '-1' ? '' : e.target.value;
                        setFieldValue('group', value);
                        // 如果备份分组选择了和主分组相同的值，则重置备份分组
                        if (values.backup_group === value && value !== '') {
                          setFieldValue('backup_group', '');
                        }
                      }}
                      variant={'outlined'}
                    >
                      <MenuItem value="-1">跟随用户分组</MenuItem>
                      {userGroupOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('token_index.userBackupGroup')}</InputLabel>
                    <Select
                      label={t('token_index.userBackupGroup')}
                      name="backup_group"
                      value={values.backup_group || '-1'}
                      onChange={(e) => {
                        const value = e.target.value === '-1' ? '' : e.target.value;
                        setFieldValue('backup_group', value);
                      }}
                      variant={'outlined'}
                    >
                      <MenuItem value="-1">无备用分组</MenuItem>
                      {userGroupOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value} disabled={values.group === option.value && values.group !== ''}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/*令牌限制设置*/}
              <Divider sx={{ margin: '16px 0px' }} />
              <Typography variant="h4">令牌限制</Typography>
              <Typography variant="caption">设置后，可以对令牌进行限制</Typography>

              {/*是否开启限制*/}
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Switch
                      checked={values?.setting?.limits?.enabled === true}
                      onClick={() => {
                        setFieldValue('setting.limits.enabled', !values.setting?.limits?.enabled);
                        // 如果关闭限制，清空已选择的模型
                        if (values.setting?.limits?.enabled) {
                          setFieldValue('setting.limits.models', []);
                        }
                      }}
                    />
                  }
                  label="启用限制"
                />
              </FormControl>

              {/*下拉框多选模型*/}
              {values?.setting?.limits?.enabled && (
                <FormControl fullWidth sx={{ ...theme.typography.otherInput }}>
                  <InputLabel>模型限制</InputLabel>
                  <Select
                    variant="outlined"
                    multiple
                    value={values?.setting?.limits?.models || []}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFieldValue('setting.limits.models', typeof value === 'string' ? value.split(',') : value);
                    }}
                    label="允许的模型列表"
                    MenuProps={{
                      anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'left'
                      },
                      transformOrigin: {
                        vertical: 'bottom',
                        horizontal: 'left'
                      },
                      PaperProps: {
                        style: {
                          maxHeight: 300, // 限制下拉菜单最大高度
                          overflow: 'auto', // 添加滚动条
                          marginBottom: 8, // 添加一点间距
                          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', // 美化阴影
                          borderRadius: '8px' // 圆角
                        }
                      }
                    }}
                    renderValue={(selected) => (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {selected.map((value) => {
                          const model = modelOptions.find((m) => m.id === value);
                          return (
                            <Chip
                              key={value}
                              label={model ? model.name : value}
                              size="small"
                              variant="outlined"
                              color="primary"
                              style={{
                                margin: 1,
                                color: theme.palette.primary.main
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  >
                    {modelOptions.map((model) => (
                      <MenuItem key={model.id} value={model.id}>
                        <ListItemText
                          primary={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <img
                                src={getModelIcon(model.owned_by)}
                                alt={model.owned_by}
                                style={{ width: 20, height: 20, borderRadius: '4px' }}
                                onError={(e) => {
                                  e.target.src = '/src/assets/images/icons/unknown_type.svg';
                                }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: 500 }}>{model.name}</span>
                                <span style={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                                  {model.owned_by} | {model.groups.join(', ')}
                                </span>
                              </div>
                            </div>
                          }
                        />
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>选择允许此令牌使用的模型，未选择则表示允许所有模型</FormHelperText>
                </FormControl>
              )}

              <DialogActions>
                <Button onClick={onCancel}>{t('token_index.cancel')}</Button>
                <Button disableElevation disabled={isSubmitting} type="submit" variant="contained" color="primary">
                  {t('token_index.submit')}
                </Button>
              </DialogActions>
            </form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default EditModal;

EditModal.propTypes = {
  open: PropTypes.bool,
  tokenId: PropTypes.number,
  onCancel: PropTypes.func,
  onOk: PropTypes.func,
  userGroupOptions: PropTypes.array
};
