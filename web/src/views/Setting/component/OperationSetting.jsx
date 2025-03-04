import { useState, useEffect, useContext } from 'react';
import SubCard from 'ui-component/cards/SubCard';
import { Stack, FormControl, InputLabel, OutlinedInput, Checkbox, Button, FormControlLabel, TextField, Alert } from '@mui/material';
import { showSuccess, showError, verifyJSON } from 'utils/common';
import { API } from 'utils/api';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import ChatLinksDataGrid from './ChatLinksDataGrid';
import dayjs from 'dayjs';
import { LoadStatusContext } from 'contexts/StatusContext';
import { useTranslation } from 'react-i18next';
import 'dayjs/locale/zh-cn';

const OperationSetting = () => {
  const { t } = useTranslation();
  let now = new Date();
  let [inputs, setInputs] = useState({
    QuotaForNewUser: 0,
    QuotaForInviter: 0,
    QuotaForInvitee: 0,
    QuotaRemindThreshold: 0,
    PreConsumedQuota: 0,
    TopUpLink: '',
    ChatLink: '',
    ChatLinks: '',
    QuotaPerUnit: 0,
    AutomaticDisableChannelEnabled: '',
    AutomaticEnableChannelEnabled: '',
    ChannelDisableThreshold: 0,
    LogConsumeEnabled: '',
    DisplayInCurrencyEnabled: '',
    ApproximateTokenEnabled: '',
    RetryTimes: 0,
    RetryCooldownSeconds: 0,
    MjNotifyEnabled: '',
    ChatImageRequestProxy: '',
    PaymentUSDRate: 0,
    PaymentMinAmount: 1,
    RechargeDiscount: '',
    CFWorkerImageUrl: '',
    CFWorkerImageKey: '',
    AudioTokenJson: '',
    ClaudeAPIEnabled: '',
    GeminiAPIEnabled: '',
    DisableChannelKeywords: ''
  });
  const [originInputs, setOriginInputs] = useState({});
  let [loading, setLoading] = useState(false);
  let [historyTimestamp, setHistoryTimestamp] = useState(now.getTime() / 1000 - 30 * 24 * 3600); // a month ago new Date().getTime() / 1000 + 3600
  const loadStatus = useContext(LoadStatusContext);

  const getOptions = async () => {
    try {
      const res = await API.get('/api/option/');
      const { success, message, data } = res.data;
      if (success) {
        let newInputs = {};
        data.forEach((item) => {
          if (item.key === 'RechargeDiscount') {
            item.value = JSON.stringify(JSON.parse(item.value), null, 2);
          }
          newInputs[item.key] = item.value;
        });
        setInputs(newInputs);
        setOriginInputs(newInputs);
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  useEffect(() => {
    getOptions().then();
  }, []);

  const updateOption = async (key, value) => {
    setLoading(true);
    if (key.endsWith('Enabled')) {
      value = inputs[key] === 'true' ? 'false' : 'true';
    }

    try {
      const res = await API.put('/api/option/', {
        key,
        value
      });
      const { success, message } = res.data;
      if (success) {
        setInputs((inputs) => ({ ...inputs, [key]: value }));
        getOptions();
        await loadStatus();
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }

    setLoading(false);
  };

  const handleInputChange = async (event) => {
    let { name, value } = event.target;

    if (name.endsWith('Enabled')) {
      await updateOption(name, value);
      showSuccess('设置成功！');
    } else {
      setInputs((inputs) => ({ ...inputs, [name]: value }));
    }
  };

  const submitConfig = async (group) => {
    switch (group) {
      case 'monitor':
        if (originInputs['ChannelDisableThreshold'] !== inputs.ChannelDisableThreshold) {
          await updateOption('ChannelDisableThreshold', inputs.ChannelDisableThreshold);
        }
        if (originInputs['QuotaRemindThreshold'] !== inputs.QuotaRemindThreshold) {
          await updateOption('QuotaRemindThreshold', inputs.QuotaRemindThreshold);
        }
        break;
      case 'chatlinks':
        if (originInputs['ChatLinks'] !== inputs.ChatLinks) {
          if (!verifyJSON(inputs.ChatLinks)) {
            showError('links不是合法的 JSON 字符串');
            return;
          }
          await updateOption('ChatLinks', inputs.ChatLinks);
        }
        break;
      case 'quota':
        if (originInputs['QuotaForNewUser'] !== inputs.QuotaForNewUser) {
          await updateOption('QuotaForNewUser', inputs.QuotaForNewUser);
        }
        if (originInputs['QuotaForInvitee'] !== inputs.QuotaForInvitee) {
          await updateOption('QuotaForInvitee', inputs.QuotaForInvitee);
        }
        if (originInputs['QuotaForInviter'] !== inputs.QuotaForInviter) {
          await updateOption('QuotaForInviter', inputs.QuotaForInviter);
        }
        if (originInputs['PreConsumedQuota'] !== inputs.PreConsumedQuota) {
          await updateOption('PreConsumedQuota', inputs.PreConsumedQuota);
        }
        break;
      case 'general':
        if (inputs.QuotaPerUnit < 0 || inputs.RetryTimes < 0 || inputs.RetryCooldownSeconds < 0) {
          showError('单位额度、重试次数、冷却时间不能为负数');
          return;
        }

        if (originInputs['TopUpLink'] !== inputs.TopUpLink) {
          await updateOption('TopUpLink', inputs.TopUpLink);
        }
        if (originInputs['ChatLink'] !== inputs.ChatLink) {
          await updateOption('ChatLink', inputs.ChatLink);
        }
        if (originInputs['QuotaPerUnit'] !== inputs.QuotaPerUnit) {
          await updateOption('QuotaPerUnit', inputs.QuotaPerUnit);
        }
        if (originInputs['RetryTimes'] !== inputs.RetryTimes) {
          await updateOption('RetryTimes', inputs.RetryTimes);
        }
        if (originInputs['RetryCooldownSeconds'] !== inputs.RetryCooldownSeconds) {
          await updateOption('RetryCooldownSeconds', inputs.RetryCooldownSeconds);
        }
        break;
      case 'other':
        if (originInputs['ChatImageRequestProxy'] !== inputs.ChatImageRequestProxy) {
          await updateOption('ChatImageRequestProxy', inputs.ChatImageRequestProxy);
        }

        if (originInputs['CFWorkerImageUrl'] !== inputs.CFWorkerImageUrl) {
          await updateOption('CFWorkerImageUrl', inputs.CFWorkerImageUrl);
        }

        if (originInputs['CFWorkerImageKey'] !== inputs.CFWorkerImageKey) {
          await updateOption('CFWorkerImageKey', inputs.CFWorkerImageKey);
        }

        break;
      case 'payment':
        if (originInputs['PaymentUSDRate'] !== inputs.PaymentUSDRate) {
          await updateOption('PaymentUSDRate', inputs.PaymentUSDRate);
        }
        if (originInputs['PaymentMinAmount'] !== inputs.PaymentMinAmount) {
          await updateOption('PaymentMinAmount', inputs.PaymentMinAmount);
        }
        if (originInputs['RechargeDiscount'] !== inputs.RechargeDiscount) {
          if (!verifyJSON(inputs.RechargeDiscount)) {
            showError('固定金额充值折扣不是合法的 JSON 字符串');
            return;
          }
          await updateOption('RechargeDiscount', inputs.RechargeDiscount);
        }
        break;
      case 'AudioTokenJson':
        if (originInputs.AudioTokenJson !== inputs.AudioTokenJson) {
          if (!verifyJSON(inputs.AudioTokenJson)) {
            showError('音频令牌不是合法的 JSON 字符串');
            return;
          }
          await updateOption('AudioTokenJson', inputs.AudioTokenJson);
        }
        break;
      case 'DisableChannelKeywords':
        if (originInputs.DisableChannelKeywords !== inputs.DisableChannelKeywords) {
          await updateOption('DisableChannelKeywords', inputs.DisableChannelKeywords);
        }
        break;
    }

    showSuccess('保存成功！');
  };

  const deleteHistoryLogs = async () => {
    try {
      const res = await API.delete(`/api/log/?target_timestamp=${Math.floor(historyTimestamp)}`);
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(`${data} 条日志已清理！`);
        return;
      }
      showError('日志清理失败：' + message);
    } catch (error) {
      return;
    }
  };

  return (
    <Stack spacing={2}>
      <SubCard title={t('setting_index.operationSettings.generalSettings.title')}>
        <Stack justifyContent="flex-start" alignItems="flex-start" spacing={2}>
          <Stack direction={{ sm: 'column', md: 'row' }} spacing={{ xs: 3, sm: 2, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel htmlFor="TopUpLink">{t('setting_index.operationSettings.generalSettings.topUpLink.label')}</InputLabel>
              <OutlinedInput
                id="TopUpLink"
                name="TopUpLink"
                value={inputs.TopUpLink}
                onChange={handleInputChange}
                label={t('setting_index.operationSettings.generalSettings.topUpLink.label')}
                placeholder={t('setting_index.operationSettings.generalSettings.topUpLink.placeholder')}
                disabled={loading}
              />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel htmlFor="ChatLink">{t('setting_index.operationSettings.generalSettings.chatLink.label')}</InputLabel>
              <OutlinedInput
                id="ChatLink"
                name="ChatLink"
                value={inputs.ChatLink}
                onChange={handleInputChange}
                label={t('setting_index.operationSettings.generalSettings.chatLink.label')}
                placeholder={t('setting_index.operationSettings.generalSettings.chatLink.placeholder')}
                disabled={loading}
              />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel htmlFor="QuotaPerUnit">{t('setting_index.operationSettings.generalSettings.quotaPerUnit.label')}</InputLabel>
              <OutlinedInput
                id="QuotaPerUnit"
                name="QuotaPerUnit"
                value={inputs.QuotaPerUnit}
                onChange={handleInputChange}
                label={t('setting_index.operationSettings.generalSettings.quotaPerUnit.label')}
                placeholder={t('setting_index.operationSettings.generalSettings.quotaPerUnit.placeholder')}
                disabled={loading}
              />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel htmlFor="RetryTimes">{t('setting_index.operationSettings.generalSettings.retryTimes.label')}</InputLabel>
              <OutlinedInput
                id="RetryTimes"
                name="RetryTimes"
                value={inputs.RetryTimes}
                onChange={handleInputChange}
                label={t('setting_index.operationSettings.generalSettings.retryTimes.label')}
                placeholder={t('setting_index.operationSettings.generalSettings.retryTimes.placeholder')}
                disabled={loading}
              />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel htmlFor="RetryCooldownSeconds">
                {t('setting_index.operationSettings.generalSettings.retryCooldownSeconds.label')}
              </InputLabel>
              <OutlinedInput
                id="RetryCooldownSeconds"
                name="RetryCooldownSeconds"
                value={inputs.RetryCooldownSeconds}
                onChange={handleInputChange}
                label={t('setting_index.operationSettings.generalSettings.retryCooldownSeconds.label')}
                placeholder={t('setting_index.operationSettings.generalSettings.retryCooldownSeconds.placeholder')}
                disabled={loading}
              />
            </FormControl>
          </Stack>
          <Stack
            direction={{ sm: 'column', md: 'row' }}
            spacing={{ xs: 3, sm: 2, md: 4 }}
            justifyContent="flex-start"
            alignItems="flex-start"
          >
            <FormControlLabel
              sx={{ marginLeft: '0px' }}
              label={t('setting_index.operationSettings.generalSettings.displayInCurrency')}
              control={
                <Checkbox
                  checked={inputs.DisplayInCurrencyEnabled === 'true'}
                  onChange={handleInputChange}
                  name="DisplayInCurrencyEnabled"
                />
              }
            />

            <FormControlLabel
              label={t('setting_index.operationSettings.generalSettings.approximateToken')}
              control={
                <Checkbox checked={inputs.ApproximateTokenEnabled === 'true'} onChange={handleInputChange} name="ApproximateTokenEnabled" />
              }
            />
          </Stack>
          <Button
            variant="contained"
            onClick={() => {
              submitConfig('general').then();
            }}
          >
            {t('setting_index.operationSettings.generalSettings.saveButton')}
          </Button>
        </Stack>
      </SubCard>
      <SubCard title={t('setting_index.operationSettings.otherSettings.title')}>
        <Stack justifyContent="flex-start" alignItems="flex-start" spacing={2}>
          <Stack
            direction={{ sm: 'column', md: 'row' }}
            spacing={{ xs: 3, sm: 2, md: 4 }}
            justifyContent="flex-start"
            alignItems="flex-start"
          >
            <FormControlLabel
              sx={{ marginLeft: '0px' }}
              label={t('setting_index.operationSettings.otherSettings.mjNotify')}
              control={<Checkbox checked={inputs.MjNotifyEnabled === 'true'} onChange={handleInputChange} name="MjNotifyEnabled" />}
            />
            <FormControlLabel
              sx={{ marginLeft: '0px' }}
              label={t('setting_index.operationSettings.otherSettings.claudeAPIEnabled')}
              control={<Checkbox checked={inputs.ClaudeAPIEnabled === 'true'} onChange={handleInputChange} name="ClaudeAPIEnabled" />}
            />
            <FormControlLabel
              sx={{ marginLeft: '0px' }}
              label={t('setting_index.operationSettings.otherSettings.geminiAPIEnabled')}
              control={<Checkbox checked={inputs.GeminiAPIEnabled === 'true'} onChange={handleInputChange} name="GeminiAPIEnabled" />}
            />
          </Stack>
          <Stack spacing={2}>
            <Alert severity="info">{t('setting_index.operationSettings.otherSettings.alert')}</Alert>
            <FormControl>
              <InputLabel htmlFor="ChatImageRequestProxy">
                {t('setting_index.operationSettings.otherSettings.chatImageRequestProxy.label')}
              </InputLabel>
              <OutlinedInput
                id="ChatImageRequestProxy"
                name="ChatImageRequestProxy"
                value={inputs.ChatImageRequestProxy}
                onChange={handleInputChange}
                label={t('setting_index.operationSettings.otherSettings.chatImageRequestProxy.label')}
                placeholder={t('setting_index.operationSettings.otherSettings.chatImageRequestProxy.placeholder')}
                disabled={loading}
              />
            </FormControl>
          </Stack>

          <Stack spacing={2}>
            <Alert severity="info">{t('setting_index.operationSettings.otherSettings.CFWorkerImageUrl.alert')}</Alert>
            <FormControl>
              <InputLabel htmlFor="CFWorkerImageUrl">
                {t('setting_index.operationSettings.otherSettings.CFWorkerImageUrl.label')}
              </InputLabel>
              <OutlinedInput
                id="CFWorkerImageUrl"
                name="CFWorkerImageUrl"
                value={inputs.CFWorkerImageUrl}
                onChange={handleInputChange}
                label={t('setting_index.operationSettings.otherSettings.CFWorkerImageUrl.label')}
                placeholder={t('setting_index.operationSettings.otherSettings.CFWorkerImageUrl.label')}
                disabled={loading}
              />
            </FormControl>

            <FormControl>
              <InputLabel htmlFor="CFWorkerImageKey">{t('setting_index.operationSettings.otherSettings.CFWorkerImageUrl.key')}</InputLabel>
              <OutlinedInput
                id="CFWorkerImageKey"
                name="CFWorkerImageKey"
                value={inputs.CFWorkerImageKey}
                onChange={handleInputChange}
                label={t('setting_index.operationSettings.otherSettings.CFWorkerImageUrl.key')}
                placeholder={t('setting_index.operationSettings.otherSettings.CFWorkerImageUrl.key')}
                disabled={loading}
              />
            </FormControl>
          </Stack>
          <Button
            variant="contained"
            onClick={() => {
              submitConfig('other').then();
            }}
          >
            {t('setting_index.operationSettings.otherSettings.saveButton')}
          </Button>
        </Stack>
      </SubCard>
      <SubCard title={t('setting_index.operationSettings.logSettings.title')}>
        <Stack direction="column" justifyContent="flex-start" alignItems="flex-start" spacing={2}>
          <FormControlLabel
            label={t('setting_index.operationSettings.logSettings.logConsume')}
            control={<Checkbox checked={inputs.LogConsumeEnabled === 'true'} onChange={handleInputChange} name="LogConsumeEnabled" />}
          />
          <FormControl>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'zh-cn'}>
              <DateTimePicker
                label={t('setting_index.operationSettings.logSettings.logCleanupTime.label')}
                placeholder={t('setting_index.operationSettings.logSettings.logCleanupTime.placeholder')}
                ampm={false}
                name="historyTimestamp"
                value={historyTimestamp === null ? null : dayjs.unix(historyTimestamp)}
                disabled={loading}
                onChange={(newValue) => {
                  setHistoryTimestamp(newValue === null ? null : newValue.unix());
                }}
                slotProps={{
                  actionBar: {
                    actions: ['today', 'clear', 'accept']
                  }
                }}
              />
            </LocalizationProvider>
          </FormControl>
          <Button
            variant="contained"
            onClick={() => {
              deleteHistoryLogs().then();
            }}
          >
            {t('setting_index.operationSettings.logSettings.clearLogs')}
          </Button>
        </Stack>
      </SubCard>
      <SubCard title={t('setting_index.operationSettings.monitoringSettings.title')}>
        <Stack justifyContent="flex-start" alignItems="flex-start" spacing={2}>
          <Stack direction={{ sm: 'column', md: 'row' }} spacing={{ xs: 3, sm: 2, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel htmlFor="ChannelDisableThreshold">
                {t('setting_index.operationSettings.monitoringSettings.channelDisableThreshold.label')}
              </InputLabel>
              <OutlinedInput
                id="ChannelDisableThreshold"
                name="ChannelDisableThreshold"
                type="number"
                value={inputs.ChannelDisableThreshold}
                onChange={handleInputChange}
                label={t('setting_index.operationSettings.monitoringSettings.channelDisableThreshold.label')}
                placeholder={t('setting_index.operationSettings.monitoringSettings.channelDisableThreshold.placeholder')}
                disabled={loading}
              />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel htmlFor="QuotaRemindThreshold">
                {t('setting_index.operationSettings.monitoringSettings.quotaRemindThreshold.label')}
              </InputLabel>
              <OutlinedInput
                id="QuotaRemindThreshold"
                name="QuotaRemindThreshold"
                type="number"
                value={inputs.QuotaRemindThreshold}
                onChange={handleInputChange}
                label={t('setting_index.operationSettings.monitoringSettings.quotaRemindThreshold.label')}
                placeholder={t('setting_index.operationSettings.monitoringSettings.quotaRemindThreshold.placeholder')}
                disabled={loading}
              />
            </FormControl>
          </Stack>
          <FormControlLabel
            label={t('setting_index.operationSettings.monitoringSettings.automaticDisableChannel')}
            control={
              <Checkbox
                checked={inputs.AutomaticDisableChannelEnabled === 'true'}
                onChange={handleInputChange}
                name="AutomaticDisableChannelEnabled"
              />
            }
          />
          <FormControlLabel
            label={t('setting_index.operationSettings.monitoringSettings.automaticEnableChannel')}
            control={
              <Checkbox
                checked={inputs.AutomaticEnableChannelEnabled === 'true'}
                onChange={handleInputChange}
                name="AutomaticEnableChannelEnabled"
              />
            }
          />
          <Button
            variant="contained"
            onClick={() => {
              submitConfig('monitor').then();
            }}
          >
            {t('setting_index.operationSettings.monitoringSettings.saveMonitoringSettings')}
          </Button>
        </Stack>
      </SubCard>
      <SubCard title={t('setting_index.operationSettings.quotaSettings.title')}>
        <Stack justifyContent="flex-start" alignItems="flex-start" spacing={2}>
          <Stack direction={{ sm: 'column', md: 'row' }} spacing={{ xs: 3, sm: 2, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel htmlFor="QuotaForNewUser">{t('setting_index.operationSettings.quotaSettings.quotaForNewUser.label')}</InputLabel>
              <OutlinedInput
                id="QuotaForNewUser"
                name="QuotaForNewUser"
                type="number"
                value={inputs.QuotaForNewUser}
                onChange={handleInputChange}
                label={t('setting_index.operationSettings.quotaSettings.quotaForNewUser.label')}
                placeholder={t('setting_index.operationSettings.quotaSettings.quotaForNewUser.placeholder')}
                disabled={loading}
              />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel htmlFor="PreConsumedQuota">
                {t('setting_index.operationSettings.quotaSettings.preConsumedQuota.label')}
              </InputLabel>
              <OutlinedInput
                id="PreConsumedQuota"
                name="PreConsumedQuota"
                type="number"
                value={inputs.PreConsumedQuota}
                onChange={handleInputChange}
                label={t('setting_index.operationSettings.quotaSettings.preConsumedQuota.label')}
                placeholder={t('setting_index.operationSettings.quotaSettings.preConsumedQuota.placeholder')}
                disabled={loading}
              />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel htmlFor="QuotaForInviter">{t('setting_index.operationSettings.quotaSettings.quotaForInviter.label')}</InputLabel>
              <OutlinedInput
                id="QuotaForInviter"
                name="QuotaForInviter"
                type="number"
                label={t('setting_index.operationSettings.quotaSettings.quotaForInviter.label')}
                value={inputs.QuotaForInviter}
                onChange={handleInputChange}
                placeholder={t('setting_index.operationSettings.quotaSettings.quotaForInviter.placeholder')}
                disabled={loading}
              />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel htmlFor="QuotaForInvitee">{t('setting_index.operationSettings.quotaSettings.quotaForInvitee.label')}</InputLabel>
              <OutlinedInput
                id="QuotaForInvitee"
                name="QuotaForInvitee"
                type="number"
                label={t('setting_index.operationSettings.quotaSettings.quotaForInvitee.label')}
                value={inputs.QuotaForInvitee}
                onChange={handleInputChange}
                autoComplete="new-password"
                placeholder={t('setting_index.operationSettings.quotaSettings.quotaForInvitee.placeholder')}
                disabled={loading}
              />
            </FormControl>
          </Stack>
          <Button
            variant="contained"
            onClick={() => {
              submitConfig('quota').then();
            }}
          >
            {t('setting_index.operationSettings.quotaSettings.saveQuotaSettings')}
          </Button>
        </Stack>
      </SubCard>
      <SubCard title={t('setting_index.operationSettings.paymentSettings.title')}>
        <Stack justifyContent="flex-start" alignItems="flex-start" spacing={2}>
          <Stack justifyContent="flex-start" alignItems="flex-start" spacing={2}>
            <FormControl fullWidth>
              <Alert severity="info">
                <div dangerouslySetInnerHTML={{ __html: t('setting_index.operationSettings.paymentSettings.alert') }} />
              </Alert>
            </FormControl>
            <Stack direction={{ sm: 'column', md: 'row' }} spacing={{ xs: 3, sm: 2, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel htmlFor="PaymentUSDRate">{t('setting_index.operationSettings.paymentSettings.usdRate.label')}</InputLabel>
                <OutlinedInput
                  id="PaymentUSDRate"
                  name="PaymentUSDRate"
                  type="number"
                  value={inputs.PaymentUSDRate}
                  onChange={handleInputChange}
                  label={t('setting_index.operationSettings.paymentSettings.usdRate.label')}
                  placeholder={t('setting_index.operationSettings.paymentSettings.usdRate.placeholder')}
                  disabled={loading}
                />
              </FormControl>
              <FormControl fullWidth>
                <InputLabel htmlFor="PaymentMinAmount">{t('setting_index.operationSettings.paymentSettings.minAmount.label')}</InputLabel>
                <OutlinedInput
                  id="PaymentMinAmount"
                  name="PaymentMinAmount"
                  type="number"
                  value={inputs.PaymentMinAmount}
                  onChange={handleInputChange}
                  label={t('setting_index.operationSettings.paymentSettings.minAmount.label')}
                  placeholder={t('setting_index.operationSettings.paymentSettings.minAmount.placeholder')}
                  disabled={loading}
                />
              </FormControl>
            </Stack>
          </Stack>
          <Stack spacing={2}>
            <Alert severity="info">
              <div dangerouslySetInnerHTML={{ __html: t('setting_index.operationSettings.paymentSettings.discountInfo') }} />
            </Alert>
            <FormControl fullWidth>
              <TextField
                multiline
                maxRows={15}
                id="channel-RechargeDiscount-label"
                label={t('setting_index.operationSettings.paymentSettings.discount.label')}
                value={inputs.RechargeDiscount}
                name="RechargeDiscount"
                onChange={handleInputChange}
                aria-describedby="helper-text-channel-RechargeDiscount-label"
                minRows={5}
                placeholder={t('setting_index.operationSettings.paymentSettings.discount.placeholder')}
                disabled={loading}
              />
            </FormControl>
          </Stack>
          <Button
            variant="contained"
            onClick={() => {
              submitConfig('payment').then();
            }}
          >
            {t('setting_index.operationSettings.paymentSettings.save')}
          </Button>
        </Stack>
      </SubCard>

      <SubCard title={t('setting_index.operationSettings.chatLinkSettings.title')}>
        <Stack spacing={2}>
          <Alert severity="info">
            <div dangerouslySetInnerHTML={{ __html: t('setting_index.operationSettings.chatLinkSettings.info') }} />
          </Alert>
          <Stack justifyContent="flex-start" alignItems="flex-start" spacing={2}>
            <ChatLinksDataGrid links={inputs.ChatLinks || '[]'} onChange={handleInputChange} />

            <Button
              variant="contained"
              onClick={() => {
                submitConfig('chatlinks').then();
              }}
            >
              {t('setting_index.operationSettings.chatLinkSettings.save')}
            </Button>
          </Stack>
        </Stack>
      </SubCard>

      <SubCard title={t('setting_index.operationSettings.audioTokenSettings.title')}>
        <Stack spacing={2}>
          <Stack justifyContent="flex-start" alignItems="flex-start" spacing={2}>
            <FormControl fullWidth>
              <TextField
                multiline
                maxRows={15}
                id="audioTokenJson"
                label={t('setting_index.operationSettings.audioTokenSettings.info')}
                value={inputs.AudioTokenJson}
                name="AudioTokenJson"
                onChange={handleInputChange}
                minRows={5}
                placeholder={t('setting_index.operationSettings.audioTokenSettings.info')}
                disabled={loading}
              />
            </FormControl>
            <Button
              variant="contained"
              onClick={() => {
                submitConfig('AudioTokenJson').then();
              }}
            >
              {t('setting_index.operationSettings.audioTokenSettings.save')}
            </Button>
          </Stack>
        </Stack>
      </SubCard>

      <SubCard title={t('setting_index.operationSettings.disableChannelKeywordsSettings.title')}>
        <Stack spacing={2}>
          <Stack justifyContent="flex-start" alignItems="flex-start" spacing={2}>
            <FormControl fullWidth>
              <TextField
                multiline
                maxRows={15}
                id="disableChannelKeywords"
                label={t('setting_index.operationSettings.disableChannelKeywordsSettings.info')}
                value={inputs.DisableChannelKeywords}
                name="DisableChannelKeywords"
                onChange={handleInputChange}
                minRows={5}
                placeholder={t('setting_index.operationSettings.disableChannelKeywordsSettings.info')}
                disabled={loading}
              />
            </FormControl>
            <Button
              variant="contained"
              onClick={() => {
                submitConfig('DisableChannelKeywords').then();
              }}
            >
              {t('setting_index.operationSettings.disableChannelKeywordsSettings.save')}
            </Button>
          </Stack>
        </Stack>
      </SubCard>
    </Stack>
  );
};

export default OperationSetting;
