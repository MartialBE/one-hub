import { useState, useEffect, useContext } from 'react';
import SubCard from 'ui-component/cards/SubCard';
import {
  Stack,
  FormControl,
  InputLabel,
  OutlinedInput,
  Checkbox,
  Button,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Autocomplete,
  TextField
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { showError, showSuccess, removeTrailingSlash } from 'utils/common'; //,
import { API } from 'utils/api';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { LoadStatusContext } from 'contexts/StatusContext';
import { useTranslation } from 'react-i18next';

const filter = createFilterOptions();
const SystemSetting = () => {
  const { t } = useTranslation();
  let [inputs, setInputs] = useState({
    PasswordLoginEnabled: '',
    PasswordRegisterEnabled: '',
    EmailVerificationEnabled: '',
    GitHubOAuthEnabled: '',
    GitHubClientId: '',
    GitHubClientSecret: '',
    GitHubOldIdCloseEnabled: '',
    LarkAuthEnabled: '',
    LarkClientId: '',
    LarkClientSecret: '',
    OIDCAuthEnabled: '',
    OIDCClientId: '',
    OIDCClientSecret: '',
    OIDCIssuer: '',
    OIDCScopes: '',
    OIDCUsernameClaims: '',
    Notice: '',
    SMTPServer: '',
    SMTPPort: '',
    SMTPAccount: '',
    SMTPFrom: '',
    SMTPToken: '',
    ServerAddress: '',
    Footer: '',
    WeChatAuthEnabled: '',
    WeChatServerAddress: '',
    WeChatServerToken: '',
    WeChatAccountQRCodeImageURL: '',
    TurnstileCheckEnabled: '',
    TurnstileSiteKey: '',
    TurnstileSecretKey: '',
    RegisterEnabled: '',
    EmailDomainRestrictionEnabled: '',
    EmailDomainWhitelist: []
  });
  const [originInputs, setOriginInputs] = useState({});
  let [loading, setLoading] = useState(false);
  const [EmailDomainWhitelist, setEmailDomainWhitelist] = useState([]);
  const [showPasswordWarningModal, setShowPasswordWarningModal] = useState(false);
  const loadStatus = useContext(LoadStatusContext);

  const getOptions = async () => {
    try {
      const res = await API.get('/api/option/');
      const { success, message, data } = res.data;
      if (success) {
        let newInputs = {};
        data.forEach((item) => {
          newInputs[item.key] = item.value;
        });
        setInputs({
          ...newInputs,
          EmailDomainWhitelist: newInputs.EmailDomainWhitelist.split(',')
        });
        setOriginInputs(newInputs);

        setEmailDomainWhitelist(newInputs.EmailDomainWhitelist.split(','));
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
    switch (key) {
      case 'PasswordLoginEnabled':
      case 'PasswordRegisterEnabled':
      case 'EmailVerificationEnabled':
      case 'GitHubOAuthEnabled':
      case 'GitHubOldIdCloseEnabled':
      case 'WeChatAuthEnabled':
      case 'LarkAuthEnabled':
      case 'OIDCAuthEnabled':
      case 'TurnstileCheckEnabled':
      case 'EmailDomainRestrictionEnabled':
      case 'RegisterEnabled':
        value = inputs[key] === 'true' ? 'false' : 'true';
        break;
      default:
        break;
    }

    try {
      const res = await API.put('/api/option/', {
        key,
        value
      });
      const { success, message } = res.data;
      if (success) {
        if (key === 'EmailDomainWhitelist') {
          value = value.split(',');
        }
        setInputs((inputs) => ({
          ...inputs,
          [key]: value
        }));
        getOptions();
        await loadStatus();
        showSuccess('设置成功！');
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

    if (name === 'PasswordLoginEnabled' && inputs[name] === 'true') {
      // block disabling password login
      setShowPasswordWarningModal(true);
      return;
    }
    if (
      name === 'Notice' ||
      name.startsWith('SMTP') ||
      name === 'ServerAddress' ||
      name === 'GitHubClientId' ||
      name === 'GitHubClientSecret' ||
      name === 'OIDCClientId' ||
      name === 'OIDCClientSecret' ||
      name === 'OIDCIssuer' ||
      name === 'OIDCScopes' ||
      name === 'OIDCUsernameClaims' ||
      name === 'WeChatServerAddress' ||
      name === 'WeChatServerToken' ||
      name === 'WeChatAccountQRCodeImageURL' ||
      name === 'TurnstileSiteKey' ||
      name === 'TurnstileSecretKey' ||
      name === 'EmailDomainWhitelist' ||
      name === 'LarkClientId' ||
      name === 'LarkClientSecret'
    ) {
      setInputs((inputs) => ({ ...inputs, [name]: value }));
    } else {
      await updateOption(name, value);
    }
  };

  const submitServerAddress = async () => {
    let ServerAddress = removeTrailingSlash(inputs.ServerAddress);
    await updateOption('ServerAddress', ServerAddress);
  };

  const submitSMTP = async () => {
    if (originInputs['SMTPServer'] !== inputs.SMTPServer) {
      await updateOption('SMTPServer', inputs.SMTPServer);
    }
    if (originInputs['SMTPAccount'] !== inputs.SMTPAccount) {
      await updateOption('SMTPAccount', inputs.SMTPAccount);
    }
    if (originInputs['SMTPFrom'] !== inputs.SMTPFrom) {
      await updateOption('SMTPFrom', inputs.SMTPFrom);
    }
    if (originInputs['SMTPPort'] !== inputs.SMTPPort && inputs.SMTPPort !== '') {
      await updateOption('SMTPPort', inputs.SMTPPort);
    }
    if (originInputs['SMTPToken'] !== inputs.SMTPToken && inputs.SMTPToken !== '') {
      await updateOption('SMTPToken', inputs.SMTPToken);
    }
  };

  const submitEmailDomainWhitelist = async () => {
    await updateOption('EmailDomainWhitelist', inputs.EmailDomainWhitelist.join(','));
  };

  const submitWeChat = async () => {
    if (originInputs['WeChatServerAddress'] !== inputs.WeChatServerAddress) {
      await updateOption('WeChatServerAddress', removeTrailingSlash(inputs.WeChatServerAddress));
    }
    if (originInputs['WeChatAccountQRCodeImageURL'] !== inputs.WeChatAccountQRCodeImageURL) {
      await updateOption('WeChatAccountQRCodeImageURL', inputs.WeChatAccountQRCodeImageURL);
    }
    if (originInputs['WeChatServerToken'] !== inputs.WeChatServerToken && inputs.WeChatServerToken !== '') {
      await updateOption('WeChatServerToken', inputs.WeChatServerToken);
    }
  };

  const submitGitHubOAuth = async () => {
    if (originInputs['GitHubClientId'] !== inputs.GitHubClientId) {
      await updateOption('GitHubClientId', inputs.GitHubClientId);
    }
    if (originInputs['GitHubClientSecret'] !== inputs.GitHubClientSecret && inputs.GitHubClientSecret !== '') {
      await updateOption('GitHubClientSecret', inputs.GitHubClientSecret);
    }
  };

  const submitOIDCOAuth = async () => {
    // 检查并更新 OIDCClientId
    if (originInputs['OIDCClientId'] !== inputs.OIDCClientId) {
      await updateOption('OIDCClientId', inputs.OIDCClientId);
    }
    // 检查并更新 OIDCClientSecret
    if (originInputs['OIDCClientSecret'] !== inputs.OIDCClientSecret && inputs.OIDCClientSecret !== '') {
      await updateOption('OIDCClientSecret', inputs.OIDCClientSecret);
    }
    // 检查并更新 OIDCIssuer
    if (originInputs['OIDCIssuer'] !== inputs.OIDCIssuer) {
      await updateOption('OIDCIssuer', inputs.OIDCIssuer);
    }
    // 检查并更新 OIDCScopes
    if (originInputs['OIDCScopes'] !== inputs.OIDCScopes) {
      await updateOption('OIDCScopes', inputs.OIDCScopes);
    }
    // 检查并更新 OIDCUsernameClaims
    if (originInputs['OIDCUsernameClaims'] !== inputs.OIDCUsernameClaims) {
      await updateOption('OIDCUsernameClaims', inputs.OIDCUsernameClaims);
    }
  };

  const submitTurnstile = async () => {
    if (originInputs['TurnstileSiteKey'] !== inputs.TurnstileSiteKey) {
      await updateOption('TurnstileSiteKey', inputs.TurnstileSiteKey);
    }
    if (originInputs['TurnstileSecretKey'] !== inputs.TurnstileSecretKey && inputs.TurnstileSecretKey !== '') {
      await updateOption('TurnstileSecretKey', inputs.TurnstileSecretKey);
    }
  };

  const submitLarkOAuth = async () => {
    if (originInputs['LarkClientId'] !== inputs.LarkClientId) {
      await updateOption('LarkClientId', inputs.LarkClientId);
    }
    if (originInputs['LarkClientSecret'] !== inputs.LarkClientSecret && inputs.LarkClientSecret !== '') {
      await updateOption('LarkClientSecret', inputs.LarkClientSecret);
    }
  };

  return (
    <>
      <Stack spacing={2}>
        <SubCard title={t('setting_index.systemSettings.generalSettings.title')}>
          <Grid container spacing={{ xs: 3, sm: 2, md: 4 }}>
            <Grid xs={12}>
              <FormControl fullWidth>
                <InputLabel htmlFor="ServerAddress">{t('setting_index.systemSettings.generalSettings.serverAddress')}</InputLabel>
                <OutlinedInput
                  id="ServerAddress"
                  name="ServerAddress"
                  value={inputs.ServerAddress || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.generalSettings.serverAddress')}
                  placeholder={t('setting_index.systemSettings.generalSettings.serverAddressPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitServerAddress}>
                {t('setting_index.systemSettings.generalSettings.updateServerAddress')}
              </Button>
            </Grid>
          </Grid>
        </SubCard>

        <SubCard title={t('setting_index.systemSettings.configureLoginRegister.title')}>
          <Grid container spacing={{ xs: 3, sm: 2, md: 4 }}>
            <Grid xs={12} md={3}>
              <FormControlLabel
                label={t('setting_index.systemSettings.configureLoginRegister.passwordLogin')}
                control={
                  <Checkbox checked={inputs.PasswordLoginEnabled === 'true'} onChange={handleInputChange} name="PasswordLoginEnabled" />
                }
              />
            </Grid>
            <Grid xs={12} md={3}>
              <FormControlLabel
                label={t('setting_index.systemSettings.configureLoginRegister.passwordRegister')}
                control={
                  <Checkbox
                    checked={inputs.PasswordRegisterEnabled === 'true'}
                    onChange={handleInputChange}
                    name="PasswordRegisterEnabled"
                  />
                }
              />
            </Grid>
            <Grid xs={12} md={3}>
              <FormControlLabel
                label={t('setting_index.systemSettings.configureLoginRegister.emailVerification')}
                control={
                  <Checkbox
                    checked={inputs.EmailVerificationEnabled === 'true'}
                    onChange={handleInputChange}
                    name="EmailVerificationEnabled"
                  />
                }
              />
            </Grid>
            <Grid xs={12} md={3}>
              <FormControlLabel
                label={t('setting_index.systemSettings.configureLoginRegister.gitHubOAuth')}
                control={<Checkbox checked={inputs.GitHubOAuthEnabled === 'true'} onChange={handleInputChange} name="GitHubOAuthEnabled" />}
              />
            </Grid>
            <Grid xs={12} md={3}>
              <FormControlLabel
                label={t('setting_index.systemSettings.configureLoginRegister.weChatAuth')}
                control={<Checkbox checked={inputs.WeChatAuthEnabled === 'true'} onChange={handleInputChange} name="WeChatAuthEnabled" />}
              />
            </Grid>
            <Grid xs={12} md={3}>
              <FormControlLabel
                label={t('setting_index.systemSettings.configureLoginRegister.larkAuth')}
                control={<Checkbox checked={inputs.LarkAuthEnabled === 'true'} onChange={handleInputChange} name="LarkAuthEnabled" />}
              />
            </Grid>
            <Grid xs={12} md={3}>
              <FormControlLabel
                label={t('setting_index.systemSettings.configureLoginRegister.oidcAuth')}
                control={<Checkbox checked={inputs.OIDCAuthEnabled === 'true'} onChange={handleInputChange} name="OIDCAuthEnabled" />}
              />
            </Grid>
            <Grid xs={12} md={3}>
              <FormControlLabel
                label={t('setting_index.systemSettings.configureLoginRegister.registerEnabled')}
                control={<Checkbox checked={inputs.RegisterEnabled === 'true'} onChange={handleInputChange} name="RegisterEnabled" />}
              />
            </Grid>
            <Grid xs={12} md={3}>
              <FormControlLabel
                label={t('setting_index.systemSettings.configureLoginRegister.turnstileCheck')}
                control={
                  <Checkbox checked={inputs.TurnstileCheckEnabled === 'true'} onChange={handleInputChange} name="TurnstileCheckEnabled" />
                }
              />
            </Grid>

            <Grid xs={12} md={3}>
              <FormControlLabel
                label={t('setting_index.systemSettings.configureLoginRegister.gitHubOldIdClose')}
                control={
                  <Checkbox
                    checked={inputs.GitHubOldIdCloseEnabled === 'true'}
                    onChange={handleInputChange}
                    name="GitHubOldIdCloseEnabled"
                  />
                }
              />
            </Grid>
          </Grid>
        </SubCard>

        <SubCard
          title={t('setting_index.systemSettings.configureEmailDomainWhitelist.title')}
          subTitle={t('setting_index.systemSettings.configureEmailDomainWhitelist.subTitle')}
        >
          <Grid container spacing={{ xs: 3, sm: 2, md: 4 }}>
            <Grid xs={12}>
              <FormControlLabel
                label={t('setting_index.systemSettings.configureEmailDomainWhitelist.emailDomainRestriction')}
                control={
                  <Checkbox
                    checked={inputs.EmailDomainRestrictionEnabled === 'true'}
                    onChange={handleInputChange}
                    name="EmailDomainRestrictionEnabled"
                  />
                }
              />
            </Grid>
            <Grid xs={12}>
              <FormControl fullWidth>
                <Autocomplete
                  multiple
                  freeSolo
                  id="EmailDomainWhitelist"
                  options={EmailDomainWhitelist}
                  value={inputs.EmailDomainWhitelist}
                  onChange={(e, value) => {
                    const event = {
                      target: {
                        name: 'EmailDomainWhitelist',
                        value: value
                      }
                    };
                    handleInputChange(event);
                  }}
                  filterSelectedOptions
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name="EmailDomainWhitelist"
                      label={t('setting_index.systemSettings.configureEmailDomainWhitelist.allowedEmailDomains')}
                    />
                  )}
                  filterOptions={(options, params) => {
                    const filtered = filter(options, params);
                    const { inputValue } = params;
                    const isExisting = options.some((option) => inputValue === option);
                    if (inputValue !== '' && !isExisting) {
                      filtered.push(inputValue);
                    }
                    return filtered;
                  }}
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitEmailDomainWhitelist}>
                {t('setting_index.systemSettings.configureEmailDomainWhitelist.save')}
              </Button>
            </Grid>
          </Grid>
        </SubCard>

        <SubCard
          title={t('setting_index.systemSettings.configureSMTP.title')}
          subTitle={t('setting_index.systemSettings.configureSMTP.subTitle')}
        >
          <Grid container spacing={{ xs: 3, sm: 2, md: 4 }}>
            <Grid xs={12}>
              <Alert severity="info">{t('setting_index.systemSettings.configureSMTP.alert')}</Alert>
            </Grid>
            <Grid xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel htmlFor="SMTPServer">{t('setting_index.systemSettings.configureSMTP.smtpServer')}</InputLabel>
                <OutlinedInput
                  id="SMTPServer"
                  name="SMTPServer"
                  value={inputs.SMTPServer || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureSMTP.smtpServer')}
                  placeholder={t('setting_index.systemSettings.configureSMTP.smtpServerPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel htmlFor="SMTPPort">{t('setting_index.systemSettings.configureSMTP.smtpPort')}</InputLabel>
                <OutlinedInput
                  id="SMTPPort"
                  name="SMTPPort"
                  value={inputs.SMTPPort || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureSMTP.smtpPort')}
                  placeholder={t('setting_index.systemSettings.configureSMTP.smtpPortPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel htmlFor="SMTPAccount">{t('setting_index.systemSettings.configureSMTP.smtpAccount')}</InputLabel>
                <OutlinedInput
                  id="SMTPAccount"
                  name="SMTPAccount"
                  value={inputs.SMTPAccount || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureSMTP.smtpAccount')}
                  placeholder={t('setting_index.systemSettings.configureSMTP.smtpAccountPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel htmlFor="SMTPFrom">{t('setting_index.systemSettings.configureSMTP.smtpFrom')}</InputLabel>
                <OutlinedInput
                  id="SMTPFrom"
                  name="SMTPFrom"
                  value={inputs.SMTPFrom || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureSMTP.smtpFrom')}
                  placeholder={t('setting_index.systemSettings.configureSMTP.smtpFromPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel htmlFor="SMTPToken">{t('setting_index.systemSettings.configureSMTP.smtpToken')}</InputLabel>
                <OutlinedInput
                  id="SMTPToken"
                  name="SMTPToken"
                  value={inputs.SMTPToken || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureSMTP.smtpToken')}
                  placeholder={t('setting_index.systemSettings.configureSMTP.smtpTokenPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitSMTP}>
                {t('setting_index.systemSettings.configureSMTP.save')}
              </Button>
            </Grid>
          </Grid>
        </SubCard>

        <SubCard
          title={t('setting_index.systemSettings.configureGitHubOAuthApp.title')}
          subTitle={
            <span>
              {' '}
              {t('setting_index.systemSettings.configureGitHubOAuthApp.subTitle')}
              <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer">
                {t('setting_index.systemSettings.configureGitHubOAuthApp.manageLink')}
              </a>
              {t('setting_index.systemSettings.configureGitHubOAuthApp.manage')}
            </span>
          }
        >
          <Grid container spacing={{ xs: 3, sm: 2, md: 4 }}>
            <Grid xs={12}>
              <Alert severity="info" sx={{ wordWrap: 'break-word' }}>
                {t('setting_index.systemSettings.configureGitHubOAuthApp.alert1')} <b>{inputs.ServerAddress}</b>
                {t('setting_index.systemSettings.configureGitHubOAuthApp.alert2')} <b>{`${inputs.ServerAddress}/oauth/github`}</b>
              </Alert>
            </Grid>
            <Grid xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel htmlFor="GitHubClientId">{t('setting_index.systemSettings.configureGitHubOAuthApp.clientId')}</InputLabel>
                <OutlinedInput
                  id="GitHubClientId"
                  name="GitHubClientId"
                  value={inputs.GitHubClientId || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureGitHubOAuthApp.clientId')}
                  placeholder={t('setting_index.systemSettings.configureGitHubOAuthApp.clientIdPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel htmlFor="GitHubClientSecret">
                  {t('setting_index.systemSettings.configureGitHubOAuthApp.clientSecret')}
                </InputLabel>
                <OutlinedInput
                  id="GitHubClientSecret"
                  name="GitHubClientSecret"
                  value={inputs.GitHubClientSecret || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureGitHubOAuthApp.clientSecret')}
                  placeholder={t('setting_index.systemSettings.configureGitHubOAuthApp.clientSecretPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitGitHubOAuth}>
                {t('setting_index.systemSettings.configureGitHubOAuthApp.saveButton')}
              </Button>
            </Grid>
          </Grid>
        </SubCard>

        <SubCard
          title={t('setting_index.systemSettings.configureWeChatServer.title')}
          subTitle={
            <span>
              {t('setting_index.systemSettings.configureWeChatServer.subTitle')}
              <a href="https://github.com/songquanpeng/wechat-server" target="_blank" rel="noopener noreferrer">
                {t('setting_index.systemSettings.configureWeChatServer.learnLink')}
              </a>
              {t('setting_index.systemSettings.configureWeChatServer.learn')}
            </span>
          }
        >
          <Grid container spacing={{ xs: 3, sm: 2, md: 4 }}>
            <Grid xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel htmlFor="WeChatServerAddress">
                  {t('setting_index.systemSettings.configureWeChatServer.serverAddress')}
                </InputLabel>
                <OutlinedInput
                  id="WeChatServerAddress"
                  name="WeChatServerAddress"
                  value={inputs.WeChatServerAddress || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureWeChatServer.serverAddress')}
                  placeholder={t('setting_index.systemSettings.configureWeChatServer.serverAddressPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel htmlFor="WeChatServerToken">{t('setting_index.systemSettings.configureWeChatServer.accessToken')}</InputLabel>
                <OutlinedInput
                  id="WeChatServerToken"
                  name="WeChatServerToken"
                  value={inputs.WeChatServerToken || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureWeChatServer.accessToken')}
                  placeholder={t('setting_index.systemSettings.configureWeChatServer.accessTokenPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel htmlFor="WeChatAccountQRCodeImageURL">
                  {t('setting_index.systemSettings.configureWeChatServer.qrCodeImage')}
                </InputLabel>
                <OutlinedInput
                  id="WeChatAccountQRCodeImageURL"
                  name="WeChatAccountQRCodeImageURL"
                  value={inputs.WeChatAccountQRCodeImageURL || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureWeChatServer.qrCodeImage')}
                  placeholder={t('setting_index.systemSettings.configureWeChatServer.qrCodeImagePlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitWeChat}>
                {t('setting_index.systemSettings.configureWeChatServer.saveButton')}
              </Button>
            </Grid>
          </Grid>
        </SubCard>

        <SubCard
          title={t('setting_index.systemSettings.configureFeishuAuthorization.title')}
          subTitle={
            <span>
              {' '}
              {t('setting_index.systemSettings.configureFeishuAuthorization.subTitle')}
              <a href="https://open.feishu.cn/app" target="_blank" rel="noreferrer">
                {t('setting_index.systemSettings.configureFeishuAuthorization.manageLink')}
              </a>
              {t('setting_index.systemSettings.configureFeishuAuthorization.manage')}
            </span>
          }
        >
          <Grid container spacing={{ xs: 3, sm: 2, md: 4 }}>
            <Grid xs={12}>
              <Alert severity="info" sx={{ wordWrap: 'break-word' }}>
                {t('setting_index.systemSettings.configureFeishuAuthorization.alert1')} <code>{inputs.ServerAddress}</code>
                {t('setting_index.systemSettings.configureFeishuAuthorization.alert2')} <code>{`${inputs.ServerAddress}/oauth/lark`}</code>
              </Alert>
            </Grid>
            <Grid xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel htmlFor="LarkClientId">{t('setting_index.systemSettings.configureFeishuAuthorization.appId')}</InputLabel>
                <OutlinedInput
                  id="LarkClientId"
                  name="LarkClientId"
                  value={inputs.LarkClientId || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureFeishuAuthorization.appId')}
                  placeholder={t('setting_index.systemSettings.configureFeishuAuthorization.appIdPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel htmlFor="LarkClientSecret">
                  {t('setting_index.systemSettings.configureFeishuAuthorization.appSecret')}
                </InputLabel>
                <OutlinedInput
                  id="LarkClientSecret"
                  name="LarkClientSecret"
                  value={inputs.LarkClientSecret || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureFeishuAuthorization.appSecret')}
                  placeholder={t('setting_index.systemSettings.configureFeishuAuthorization.appSecretPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitLarkOAuth}>
                {t('setting_index.systemSettings.configureFeishuAuthorization.saveButton')}
              </Button>
            </Grid>
          </Grid>
        </SubCard>

        <SubCard
          title={t('setting_index.systemSettings.configureTurnstile.title')}
          subTitle={
            <span>
              {t('setting_index.systemSettings.configureTurnstile.subTitle')}
              <a href="https://dash.cloudflare.com/" target="_blank" rel="noopener noreferrer">
                {t('setting_index.systemSettings.configureTurnstile.manageLink')}
              </a>
              {t('setting_index.systemSettings.configureTurnstile.manage')}
            </span>
          }
        >
          <Grid container spacing={{ xs: 3, sm: 2, md: 4 }}>
            <Grid xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel htmlFor="TurnstileSiteKey">{t('setting_index.systemSettings.configureTurnstile.siteKey')}</InputLabel>
                <OutlinedInput
                  id="TurnstileSiteKey"
                  name="TurnstileSiteKey"
                  value={inputs.TurnstileSiteKey || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureTurnstile.siteKey')}
                  placeholder={t('setting_index.systemSettings.configureTurnstile.siteKeyPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel htmlFor="TurnstileSecretKey">{t('setting_index.systemSettings.configureTurnstile.secretKey')}</InputLabel>
                <OutlinedInput
                  id="TurnstileSecretKey"
                  name="TurnstileSecretKey"
                  type="password"
                  value={inputs.TurnstileSecretKey || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureTurnstile.secretKey')}
                  placeholder={t('setting_index.systemSettings.configureTurnstile.secretKeyPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitTurnstile}>
                {t('setting_index.systemSettings.configureTurnstile.saveButton')}
              </Button>
            </Grid>
          </Grid>
        </SubCard>

        <SubCard
          title={t('setting_index.systemSettings.configureOIDCAuthorization.title')}
          subTitle={<span>{t('setting_index.systemSettings.configureOIDCAuthorization.subTitle')}</span>}
        >
          <Grid container spacing={{ xs: 3, sm: 2, md: 4 }}>
            <Grid xs={12}>
              <Alert severity="info" sx={{ wordWrap: 'break-word' }}>
                {t('setting_index.systemSettings.configureOIDCAuthorization.alert1')} <b>{inputs.ServerAddress}</b>
                {t('setting_index.systemSettings.configureOIDCAuthorization.alert2')} <b>{`${inputs.ServerAddress}/oauth/oidc`}</b>
              </Alert>
            </Grid>

            <Grid xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel htmlFor="OIDCClientId">{t('setting_index.systemSettings.configureOIDCAuthorization.clientId')}</InputLabel>
                <OutlinedInput
                  id="OIDCClientId"
                  name="OIDCClientId"
                  value={inputs.OIDCClientId || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureOIDCAuthorization.clientId')}
                  placeholder={t('setting_index.systemSettings.configureOIDCAuthorization.clientIdPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>

            <Grid xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel htmlFor="OIDCClientSecret">
                  {t('setting_index.systemSettings.configureOIDCAuthorization.clientSecret')}
                </InputLabel>
                <OutlinedInput
                  id="OIDCClientSecret"
                  name="OIDCClientSecret"
                  value={inputs.OIDCClientSecret || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureOIDCAuthorization.clientSecret')}
                  placeholder={t('setting_index.systemSettings.configureOIDCAuthorization.clientSecretPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>

            <Grid xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel htmlFor="OIDCIssuer">{t('setting_index.systemSettings.configureOIDCAuthorization.issuer')}</InputLabel>
                <OutlinedInput
                  id="OIDCIssuer"
                  name="OIDCIssuer"
                  value={inputs.OIDCIssuer || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureOIDCAuthorization.issuer')}
                  placeholder={t('setting_index.systemSettings.configureOIDCAuthorization.issuerPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>

            <Grid xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel htmlFor="OIDCScopes">{t('setting_index.systemSettings.configureOIDCAuthorization.scopes')}</InputLabel>
                <OutlinedInput
                  id="OIDCScopes"
                  name="OIDCScopes"
                  value={inputs.OIDCScopes || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureOIDCAuthorization.scopes')}
                  placeholder={t('setting_index.systemSettings.configureOIDCAuthorization.scopesPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>

            <Grid xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel htmlFor="OIDCUsernameClaims">
                  {t('setting_index.systemSettings.configureOIDCAuthorization.usernameClaims')}
                </InputLabel>
                <OutlinedInput
                  id="OIDCUsernameClaims"
                  name="OIDCUsernameClaims"
                  value={inputs.OIDCUsernameClaims || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.systemSettings.configureOIDCAuthorization.usernameClaims')}
                  placeholder={t('setting_index.systemSettings.configureOIDCAuthorization.usernameClaimsPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>

            <Grid xs={12}>
              <Button variant="contained" onClick={submitOIDCOAuth}>
                {t('setting_index.systemSettings.configureOIDCAuthorization.saveButton')}
              </Button>
            </Grid>
          </Grid>
        </SubCard>
      </Stack>
      <Dialog open={showPasswordWarningModal} onClose={() => setShowPasswordWarningModal(false)} maxWidth={'md'}>
        <DialogTitle sx={{ margin: '0px', fontWeight: 700, lineHeight: '1.55556', padding: '24px', fontSize: '1.125rem' }}>
          警告
        </DialogTitle>
        <Divider />
        <DialogContent>取消密码登录将导致所有未绑定其他登录方式的用户（包括管理员）无法通过密码登录，确认取消？</DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordWarningModal(false)}>取消</Button>
          <Button
            sx={{ color: 'error.main' }}
            onClick={async () => {
              setShowPasswordWarningModal(false);
              await updateOption('PasswordLoginEnabled', 'false');
            }}
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SystemSetting;
