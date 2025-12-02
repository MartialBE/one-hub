import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Button,
  InputLabel,
  FormControl,
  OutlinedInput,
  Stack,
  Alert,
  Divider,
  Chip,
  Typography,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import { keyframes } from '@emotion/react';
import Grid from '@mui/material/Unstable_Grid2';
import SubCard from 'ui-component/cards/SubCard';
import MainCard from 'ui-component/cards/MainCard';
import { IconBrandWechat, IconBrandGithub, IconMail, IconBrandTelegram, IconBrandOauth, IconSettings, IconLink, IconShieldLock, IconKey } from '@tabler/icons-react';
import { API } from 'utils/api';
import {
  showError,
  showSuccess,
  onGitHubOAuthClicked,
  copy,
  trims,
  onLarkOAuthClicked,
  onWebAuthnRegister,
  getWebAuthnCredentials,
  deleteWebAuthnCredential
} from 'utils/common';
import * as Yup from 'yup';
import WechatModal from 'views/Authentication/AuthForms/WechatModal';
import { useSelector } from 'react-redux';
import EmailModal from './component/EmailModal';
import LarkIcon from 'assets/images/icons/lark.svg';
import { useTheme } from '@mui/material/styles';

const validationSchema = Yup.object().shape({
  username: Yup.string().required('用户名 不能为空').min(3, '用户名 不能小于 3 个字符'),
  display_name: Yup.string(),
  password: Yup.string().test('password', '密码不能小于 8 个字符', (val) => {
    return !val || val.length >= 8;
  }),
  confirm_password: Yup.string().oneOf([Yup.ref('password'), null], '两次输入的密码不一致')
});

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function Profile() {
  const { t } = useTranslation();
  const [inputs, setInputs] = useState([]);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [openWechat, setOpenWechat] = useState(false);
  const [openEmail, setOpenEmail] = useState(false);
  const [webAuthnCredentials, setWebAuthnCredentials] = useState([]);
  const [loadingWebAuthn, setLoadingWebAuthn] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState(null);
  const [openUnbindDialog, setOpenUnbindDialog] = useState(false);
  const [unbindType, setUnbindType] = useState('');
  const [userGroupMap, setUserGroupMap] = useState({});
  const status = useSelector((state) => state.siteInfo);
  const account = useSelector((state) => state.account);
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));
  const [value, setValue] = useState(0);

  // Define the gradient animation
  const gradientAnimation = keyframes`
    0% {
      background-position: 0 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0 50%;
    }
  `;

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleWechatOpen = () => {
    setOpenWechat(true);
  };

  const handleWechatClose = () => {
    setOpenWechat(false);
  };

  const handleInputChange = (event) => {
    let { name, value } = event.target;
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const loadUser = async () => {
    try {
      let res = await API.get(`/api/user/self`);
      const { success, message, data } = res.data;
      if (success) {
        setInputs(data);
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  const loadUserGroup = async () => {
    try {
      let res = await API.get(`/api/user_group_map`);
      const { success, message, data } = res.data;
      if (success) {
        setUserGroupMap(data);
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  const loadWebAuthnCredentials = async () => {
    setLoadingWebAuthn(true);
    try {
      const credentials = await getWebAuthnCredentials();
      setWebAuthnCredentials(credentials);
    } catch (error) {
      console.error('加载WebAuthn凭据失败:', error);
    } finally {
      setLoadingWebAuthn(false);
    }
  };

  // WebAuthn 注册 - 别名对话框逻辑
  const [openAliasDialog, setOpenAliasDialog] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [aliasSubmitting, setAliasSubmitting] = useState(false);

  const handleWebAuthnRegister = async () => {
    setAliasInput('');
    setOpenAliasDialog(true);
  };

  const closeAliasDialog = () => {
    if (!aliasSubmitting) setOpenAliasDialog(false);
  };

  const confirmAliasAndRegister = async () => {
    try {
      setAliasSubmitting(true);
      await onWebAuthnRegister(
        showError,
        showSuccess,
        () => {
          loadWebAuthnCredentials();
        },
        aliasInput.trim()
      );
      setOpenAliasDialog(false);
    } catch (e) {
      // 错误已在 onWebAuthnRegister 内部处理
    } finally {
      setAliasSubmitting(false);
    }
  };

  const handleDeleteWebAuthnCredential = (credentialId) => {
    setCredentialToDelete(credentialId);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (credentialToDelete) {
      await deleteWebAuthnCredential(credentialToDelete, showError, showSuccess, () => {
        loadWebAuthnCredentials();
      });
    }
    setConfirmDeleteOpen(false);
    setCredentialToDelete(null);
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
    setCredentialToDelete(null);
  };

  const bindWeChat = async (code) => {
    if (code === '') return;
    try {
      const res = await API.get(`/api/oauth/wechat/bind?code=${code}`);
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('profilePage.wechatBindSuccess'));
      }
      return { success, message };
    } catch (err) {
      // 请求失败，设置错误信息
      return { success: false, message: '' };
    }
  };

  const handleUnbind = (type) => {
    setUnbindType(type);
    setOpenUnbindDialog(true);
  };

  const confirmUnbind = async () => {
    try {
      const res = await API.post(`/api/user/unbind`, { type: unbindType });
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('profilePage.unbindSuccess'));
        await loadUser();
      } else {
        showError(message);
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setOpenUnbindDialog(false);
    }
  };

  const generateAccessToken = async () => {
    try {
      const res = await API.get('/api/user/token');
      const { success, message, data } = res.data;
      if (success) {
        setInputs((inputs) => ({ ...inputs, access_token: data }));
        copy(data, t('profilePage.token'));
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  const submit = async () => {
    try {
      let inputValue = inputs;
      // inputValue.username = trims(inputValue.username);
      inputValue.display_name = trims(inputValue.display_name);
      await validationSchema.validate(inputValue);
      const res = await API.put(`/api/user/self`, inputValue);
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('profilePage.updateSuccess'));
      } else {
        showError(message);
      }
    } catch (err) {
      showError(err.message);
    }
  };

  useEffect(() => {
    if (status) {
      if (status.turnstile_check) {
        setTurnstileEnabled(true);
        setTurnstileSiteKey(status.turnstile_site_key);
      }
    }
    loadUser().then();
    loadUserGroup().then();
    loadWebAuthnCredentials().then();
  }, [status]);

  const getGroupInfo = () => {
    if (!inputs.group || !userGroupMap[inputs.group]) {
      return inputs.group || 'default';
    }
    const group = userGroupMap[inputs.group];
    return `${t('profilePage.group')}: ${group.name} (${t('profilePage.rate')}: ${group.ratio} / ${t('profilePage.speed')}: ${group.api_rate})`;
  };

  return (
    <>
      <MainCard>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="profile tabs" variant="scrollable" scrollButtons="auto">
            <Tab icon={<IconSettings />} iconPosition="start" label={t('profilePage.general')} {...a11yProps(0)} />
            <Tab icon={<IconLink />} iconPosition="start" label={t('profilePage.binding')} {...a11yProps(1)} />
            <Tab icon={<IconShieldLock />} iconPosition="start" label={t('profilePage.webauthn')} {...a11yProps(2)} />
            <Tab icon={<IconKey />} iconPosition="start" label={t('profilePage.token')} {...a11yProps(3)} />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
          <Grid container spacing={3}>
            <Grid xs={12} md={4}>
              <SubCard>
                <Stack alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      position: 'relative',
                      width: '105px',
                      height: '105px',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      background: `linear-gradient(90deg, 
                        ${theme.palette.primary.main}, 
                        ${theme.palette.secondary.main}, 
                        ${theme.palette.primary.light}, 
                        ${theme.palette.primary.main})`,
                      backgroundSize: '300% 300%',
                      animation: `${gradientAnimation} 5s ease infinite`,
                      '&:hover': {
                        animation: `${gradientAnimation} 5s ease infinite`
                      }
                    }}
                  >
                    <Avatar
                      src={account.user?.avatar_url}
                      sx={{
                        width: 100,
                        height: 100,
                        border: '2px solid',
                        borderColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff'),
                        bgcolor: '#FFFFFF',
                        transition: 'transform 0.2s ease-in-out, background-color 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.03)'
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="h3">{inputs.username}</Typography>
                  <Typography variant="body2" color="textSecondary">{inputs.email}</Typography>
                  <Chip label={getGroupInfo()} color="primary" variant="outlined" />
                </Stack>
              </SubCard>
            </Grid>
            <Grid xs={12} md={8}>
              <SubCard title={t('profilePage.personalInfo')}>
                <Grid container spacing={2}>
                  <Grid xs={12}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel htmlFor="display_name">{t('profilePage.displayName')}</InputLabel>
                      <OutlinedInput
                        id="display_name"
                        label={t('profilePage.displayName')}
                        type="text"
                        value={inputs.display_name || ''}
                        onChange={handleInputChange}
                        name="display_name"
                        placeholder={t('profilePage.inputDisplayNamePlaceholder')}
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel htmlFor="password">{t('profilePage.password')}</InputLabel>
                      <OutlinedInput
                        id="password"
                        label={t('profilePage.password')}
                        type="password"
                        value={inputs.password || ''}
                        onChange={handleInputChange}
                        name="password"
                        placeholder={t('profilePage.inputPasswordPlaceholder')}
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel htmlFor="confirm_password">{t('profilePage.confirmPassword')}</InputLabel>
                      <OutlinedInput
                        id="confirm_password"
                        label={t('profilePage.confirmPassword')}
                        type="password"
                        value={inputs.confirm_password || ''}
                        onChange={handleInputChange}
                        name="confirm_password"
                        placeholder={t('profilePage.inputConfirmPasswordPlaceholder')}
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" color="primary" onClick={submit}>
                      {t('profilePage.submit')}
                    </Button>
                  </Grid>
                </Grid>
              </SubCard>
            </Grid>
          </Grid>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          <SubCard title={t('profilePage.accountBinding')}>
            <List>
              <ListItem divider>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.main }}>
                    <IconMail />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    matchDownSM ? (
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body1">Email</Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setOpenEmail(true);
                          }}
                        >
                          {inputs.email ? t('profilePage.change') : t('profilePage.bind')}
                        </Button>
                      </Box>
                    ) : (
                      'Email'
                    )
                  }
                  secondary={inputs.email ? `${t('profilePage.bound')}: ${inputs.email}` : t('profilePage.unbound')}
                  secondaryTypographyProps={matchDownSM ? {} : { noWrap: true }}
                  sx={matchDownSM ? {} : { minWidth: 0, mr: 2 }}
                />
                {!matchDownSM && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setOpenEmail(true);
                    }}
                    sx={{ ml: 2 }}
                  >
                    {inputs.email ? t('profilePage.change') : t('profilePage.bind')}
                  </Button>
                )}
              </ListItem>
              {status.wechat_login && (
                <ListItem divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#07C160', color: '#fff' }}>
                      <IconBrandWechat />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      matchDownSM ? (
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1">WeChat</Typography>
                          {inputs.wechat_id ? (
                            <Button size="small" variant="outlined" color="error" onClick={() => handleUnbind('wechat')}>
                              {t('profilePage.unbind')}
                            </Button>
                          ) : (
                            <Button size="small" variant="outlined" onClick={handleWechatOpen}>
                              {t('profilePage.bind')}
                            </Button>
                          )}
                        </Box>
                      ) : (
                        'WeChat'
                      )
                    }
                    secondary={inputs.wechat_id ? `${t('profilePage.bound')}: ${inputs.wechat_id}` : t('profilePage.unbound')}
                    secondaryTypographyProps={matchDownSM ? {} : { noWrap: true }}
                    sx={matchDownSM ? {} : { minWidth: 0, mr: 2 }}
                  />
                  {!matchDownSM &&
                    (inputs.wechat_id ? (
                      <Button variant="outlined" color="error" onClick={() => handleUnbind('wechat')} sx={{ ml: 2 }}>
                        {t('profilePage.unbind')}
                      </Button>
                    ) : (
                      <Button variant="outlined" onClick={handleWechatOpen} sx={{ ml: 2 }}>
                        {t('profilePage.bind')}
                      </Button>
                    ))}
                </ListItem>
              )}
              {status.github_oauth && (
                <ListItem divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#24292e', color: '#fff' }}>
                      <IconBrandGithub />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      matchDownSM ? (
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1">GitHub</Typography>
                          {inputs.github_id ? (
                            <Button size="small" variant="outlined" color="error" onClick={() => handleUnbind('github')}>
                              {t('profilePage.unbind')}
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => onGitHubOAuthClicked(status.github_client_id, true)}
                            >
                              {t('profilePage.bind')}
                            </Button>
                          )}
                        </Box>
                      ) : (
                        'GitHub'
                      )
                    }
                    secondary={inputs.github_id ? `${t('profilePage.bound')}: ${inputs.github_id}` : t('profilePage.unbound')}
                    secondaryTypographyProps={matchDownSM ? {} : { noWrap: true }}
                    sx={matchDownSM ? {} : { minWidth: 0, mr: 2 }}
                  />
                  {!matchDownSM &&
                    (inputs.github_id ? (
                      <Button variant="outlined" color="error" onClick={() => handleUnbind('github')} sx={{ ml: 2 }}>
                        {t('profilePage.unbind')}
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        onClick={() => onGitHubOAuthClicked(status.github_client_id, true)}
                        sx={{ ml: 2 }}
                      >
                        {t('profilePage.bind')}
                      </Button>
                    ))}
                </ListItem>
              )}
              {status.lark_client_id && (
                <ListItem divider>
                  <ListItemAvatar>
                    <Avatar src={LarkIcon} sx={{ bgcolor: 'transparent' }} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      matchDownSM ? (
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1">Lark</Typography>
                          {inputs.lark_id ? (
                            <Button size="small" variant="outlined" color="error" onClick={() => handleUnbind('lark')}>
                              {t('profilePage.unbind')}
                            </Button>
                          ) : (
                            <Button size="small" variant="outlined" onClick={() => onLarkOAuthClicked(status.lark_client_id)}>
                              {t('profilePage.bind')}
                            </Button>
                          )}
                        </Box>
                      ) : (
                        'Lark'
                      )
                    }
                    secondary={inputs.lark_id ? `${t('profilePage.bound')}: ${inputs.lark_id}` : t('profilePage.unbound')}
                    secondaryTypographyProps={matchDownSM ? {} : { noWrap: true }}
                    sx={matchDownSM ? {} : { minWidth: 0, mr: 2 }}
                  />
                  {!matchDownSM &&
                    (inputs.lark_id ? (
                      <Button variant="outlined" color="error" onClick={() => handleUnbind('lark')} sx={{ ml: 2 }}>
                        {t('profilePage.unbind')}
                      </Button>
                    ) : (
                      <Button variant="outlined" onClick={() => onLarkOAuthClicked(status.lark_client_id)} sx={{ ml: 2 }}>
                        {t('profilePage.bind')}
                      </Button>
                    ))}
                </ListItem>
              )}
              {status.oidc_auth && (
                <ListItem divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.secondary.main, color: '#fff' }}>
                      <IconBrandOauth />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      matchDownSM ? (
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1">OIDC</Typography>
                          {inputs.oidc_id && (
                            <Button size="small" variant="outlined" color="error" onClick={() => handleUnbind('oidc')}>
                              {t('profilePage.unbind')}
                            </Button>
                          )}
                        </Box>
                      ) : (
                        'OIDC'
                      )
                    }
                    secondary={inputs.oidc_id ? `${t('profilePage.bound')}: ${inputs.oidc_id}` : t('profilePage.unbound')}
                    secondaryTypographyProps={matchDownSM ? {} : { noWrap: true }}
                    sx={matchDownSM ? {} : { minWidth: 0, mr: 2 }}
                  />
                  {!matchDownSM && inputs.oidc_id && (
                    <Button variant="outlined" color="error" onClick={() => handleUnbind('oidc')} sx={{ ml: 2 }}>
                      {t('profilePage.unbind')}
                    </Button>
                  )}
                </ListItem>
              )}
            </List>
            {status.telegram_bot && (
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Alert severity="info">
                  <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconBrandTelegram /> {t('profilePage.telegramBot')}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      {t('profilePage.telegramStep1')}
                    </Typography>
                    <Chip
                      icon={<IconBrandTelegram />}
                      label={'@' + status.telegram_bot}
                      color="primary"
                      variant="outlined"
                      size="small"
                      onClick={() => window.open('https://t.me/' + status.telegram_bot, '_blank')}
                      sx={{ my: 1 }}
                    />
                    <Typography variant="body2">
                      {t('profilePage.telegramStep2')}
                    </Typography>
                  </Box>
                </Alert>
              </Stack>
            )}
          </SubCard>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
          <SubCard title={t('profilePage.webauthnManagement')}>
            <Grid container spacing={2}>
              <Grid xs={12}>
                <Alert severity="info">{t('profilePage.webauthnDescription')}</Alert>
              </Grid>
              <Grid xs={12}>
                <Button variant="contained" onClick={handleWebAuthnRegister} disabled={loadingWebAuthn}>
                  {t('profilePage.registerWebauthn')}
                </Button>
              </Grid>
              {webAuthnCredentials.length > 0 && (
                <Grid xs={12}>
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    {t('profilePage.registeredCredentials')}
                  </Typography>
                  {webAuthnCredentials.map((credential) => (
                    <Card
                      key={credential.id}
                      sx={{
                        mb: 2,
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Stack>
                        <Typography variant="body1">
                          {t('profilePage.alias')}{' '}
                          {credential.alias && credential.alias.trim() !== ''
                            ? credential.alias
                            : new Date(credential.created_time * 1000).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('profilePage.credentialId')}{' '}
                          <span title={credential.credential_id}>
                            {credential.credential_id.length > 20
                              ? credential.credential_id.substring(0, 20) + '...'
                              : credential.credential_id}
                          </span>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('profilePage.registerTime')} {new Date(credential.created_time * 1000).toLocaleString()}
                        </Typography>
                      </Stack>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteWebAuthnCredential(credential.id)}
                        disabled={loadingWebAuthn}
                      >
                        {t('profilePage.delete')}
                      </Button>
                    </Card>
                  ))}
                </Grid>
              )}
              {webAuthnCredentials.length === 0 && !loadingWebAuthn && (
                <Grid xs={12}>
                  <Alert severity="info">{t('profilePage.noWebauthnCredentials')}</Alert>
                </Grid>
              )}
            </Grid>
          </SubCard>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={3}>
          <SubCard title={t('profilePage.token')}>
            <Grid container spacing={2}>
              <Grid xs={12}>
                <Alert severity="info">{t('profilePage.tokenNotice')}</Alert>
              </Grid>
              {inputs.access_token && (
                <Grid xs={12}>
                  <Alert severity="error">
                    {t('profilePage.yourTokenIs')} <b>{inputs.access_token}</b> <br />
                    {t('profilePage.keepSafe')}
                  </Alert>
                </Grid>
              )}
              <Grid xs={12}>
                <Button variant="contained" onClick={generateAccessToken}>
                  {inputs.access_token ? t('profilePage.resetToken') : t('profilePage.generateToken')}
                </Button>
              </Grid>
            </Grid>
          </SubCard>
        </CustomTabPanel>
      </MainCard>
      <WechatModal open={openWechat} handleClose={handleWechatClose} wechatLogin={bindWeChat} qrCode={status.wechat_qrcode} />
      <EmailModal
        open={openEmail}
        turnstileSiteKey={turnstileSiteKey}
        turnstileEnabled={turnstileEnabled}
        handleClose={() => {
          setOpenEmail(false);
        }}
      />
      {/* 别名输入对话框 */}
      <Dialog
        open={openAliasDialog}
        onClose={closeAliasDialog}
        aria-labelledby="alias-dialog-title"
        aria-describedby="alias-dialog-description"
      >
        <DialogTitle id="alias-dialog-title">设置凭据别名</DialogTitle>
        <DialogContent>
          <DialogContentText id="alias-dialog-description">
            为新的 WebAuthn 凭据设置一个易于识别的别名（可选）。不设置将使用当前时间作为默认别名。
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="alias"
            label="别名（可选）"
            type="text"
            fullWidth
            variant="outlined"
            value={aliasInput}
            onChange={(e) => setAliasInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                confirmAliasAndRegister();
              }
            }}
            disabled={aliasSubmitting || loadingWebAuthn}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAliasDialog} color="primary" disabled={aliasSubmitting}>
            取消
          </Button>
          <Button onClick={confirmAliasAndRegister} color="primary" variant="contained" disabled={aliasSubmitting || loadingWebAuthn}>
            确认
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={confirmDeleteOpen}
        onClose={cancelDelete}
        aria-labelledby="confirm-delete-dialog-title"
        aria-describedby="confirm-delete-dialog-description"
      >
        <DialogTitle id="confirm-delete-dialog-title">确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-delete-dialog-description">您确定要删除这个 WebAuthn 凭据吗？此操作无法撤销。</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="primary">
            取消
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            删除
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openUnbindDialog}
        onClose={() => setOpenUnbindDialog(false)}
        aria-labelledby="unbind-dialog-title"
        aria-describedby="unbind-dialog-description"
      >
        <DialogTitle id="unbind-dialog-title">{t('profilePage.unbindConfirm')}</DialogTitle>
        <DialogContent>
          <DialogContentText id="unbind-dialog-description">
            {t('profilePage.unbindWarning')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUnbindDialog(false)} color="primary">
            {t('profilePage.cancel')}
          </Button>
          <Button onClick={confirmUnbind} color="error" variant="contained">
            {t('profilePage.unbind')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
