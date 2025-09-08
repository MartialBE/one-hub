import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import UserCard from 'ui-component/cards/UserCard';
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
  SvgIcon,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import SubCard from 'ui-component/cards/SubCard';
import { IconBrandWechat, IconBrandGithub, IconMail, IconBrandTelegram, IconBrandOauth } from '@tabler/icons-react';
import Label from 'ui-component/Label';
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
import Turnstile from 'react-turnstile';
import LarkIcon from 'assets/images/icons/lark.svg';
import { useTheme } from '@mui/material/styles';

const validationSchema = Yup.object().shape({
  username: Yup.string().required('用户名 不能为空').min(3, '用户名 不能小于 3 个字符'),
  display_name: Yup.string(),
  password: Yup.string().test('password', '密码不能小于 8 个字符', (val) => {
    return !val || val.length >= 8;
  })
});

export default function Profile() {
  const { t } = useTranslation();
  const [inputs, setInputs] = useState([]);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [openWechat, setOpenWechat] = useState(false);
  const [openEmail, setOpenEmail] = useState(false);
  const [webAuthnCredentials, setWebAuthnCredentials] = useState([]);
  const [loadingWebAuthn, setLoadingWebAuthn] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState(null);
  const status = useSelector((state) => state.siteInfo);
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));

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
    loadWebAuthnCredentials().then();
  }, [status]);

  return (
    <>
      <UserCard>
        <Card sx={{ paddingTop: '20px' }}>
          <Stack spacing={2}>
            <Stack
              direction={matchDownSM ? 'column' : 'row'}
              alignItems="center"
              justifyContent="center"
              spacing={2}
              sx={{ paddingBottom: '20px' }}
            >
              {status.wechat_login && (
                <Label variant="ghost" color={inputs.wechat_id ? 'primary' : 'default'}>
                  <IconBrandWechat /> {inputs.wechat_id || t('profilePage.notBound')}
                </Label>
              )}
              {status.github_oauth && (
                <Label variant="ghost" color={inputs.github_id ? 'primary' : 'default'}>
                  <IconBrandGithub /> {inputs.github_id || t('profilePage.notBound')}
                </Label>
              )}
              <Label variant="ghost" color={inputs.email ? 'primary' : 'default'}>
                <IconMail /> {inputs.email || t('profilePage.notBound')}
              </Label>
              {status.telegram_bot && (
                <Label variant="ghost" color={inputs.telegram_id ? 'primary' : 'default'}>
                  <IconBrandTelegram /> {inputs.telegram_id || t('profilePage.notBound')}
                </Label>
              )}
              {status.lark_login && (
                <Label variant="ghost" color={inputs.lark_id ? 'primary' : 'default'}>
                  <SvgIcon component={LarkIcon} inheritViewBox="0 0 24 24" /> {inputs.lark_id || t('profilePage.notBound')}
                </Label>
              )}
              {status.oidc_auth && (
                <Label variant="ghost" color={inputs.oidc_id ? 'primary' : 'default'}>
                  <IconBrandOauth /> {inputs.oidc_id || t('profilePage.notBound')}
                </Label>
              )}
            </Stack>
            <SubCard title={t('profilePage.personalInfo')}>
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel htmlFor="username">{t('profilePage.username')}</InputLabel>
                    <OutlinedInput
                      id="username"
                      label={t('profilePage.username')}
                      type="text"
                      value={inputs.username || ''}
                      // onChange={handleInputChange}
                      disabled
                      name="username"
                      placeholder={t('profilePage.inputUsernamePlaceholder')}
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
                  <Button variant="contained" color="primary" onClick={submit}>
                    {t('profilePage.submit')}
                  </Button>
                </Grid>
              </Grid>
            </SubCard>
            <SubCard title={t('profilePage.accountBinding')}>
              <Grid container spacing={2}>
                {status.wechat_login && !inputs.wechat_id && (
                  <Grid xs={12} md={4}>
                    <Button variant="contained" onClick={handleWechatOpen}>
                      {t('profilePage.bindWechatAccount')}
                    </Button>
                  </Grid>
                )}
                {status.github_oauth && !inputs.github_id && (
                  <Grid xs={12} md={4}>
                    <Button variant="contained" onClick={() => onGitHubOAuthClicked(status.github_client_id, true)}>
                      {t('profilePage.bindGitHubAccount')}
                    </Button>
                  </Grid>
                )}

                {status.lark_client_id && !inputs.lark_id && (
                  <Grid xs={12} md={4}>
                    <Button variant="contained" onClick={() => onLarkOAuthClicked(status.lark_client_id)}>
                      {t('profilePage.bindLarkAccount')}
                    </Button>
                  </Grid>
                )}

                <Grid xs={12} md={4}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setOpenEmail(true);
                    }}
                  >
                    {inputs.email ? t('profilePage.changeEmail') : t('profilePage.bindEmail')}
                  </Button>
                  {turnstileEnabled ? (
                    <Turnstile
                      sitekey={turnstileSiteKey}
                      onVerify={(token) => {
                        setTurnstileToken(token);
                      }}
                    />
                  ) : (
                    <></>
                  )}
                </Grid>

                {status.telegram_bot && ( //&& !inputs.telegram_id
                  <Grid xs={12} md={12}>
                    <Stack spacing={2}>
                      <Divider />

                      <Alert severity="info">
                        <Typography variant="h3">{t('profilePage.telegramBot')}</Typography>
                        <br />
                        <Typography variant="body1">
                          {t('profilePage.telegramStep1')}
                          <br />
                          <Chip
                            icon={<IconBrandTelegram />}
                            label={'@' + status.telegram_bot}
                            color="primary"
                            variant="outlined"
                            size="small"
                            onClick={() => window.open('https://t.me/' + status.telegram_bot, '_blank')}
                          />
                          <br />
                          <br />
                          {t('profilePage.telegramStep2')}
                        </Typography>
                      </Alert>
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </SubCard>
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
                            {t('profilePage.alias')}:{' '}
                            {credential.alias && credential.alias.trim() !== ''
                              ? credential.alias
                              : new Date(credential.created_time * 1000).toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t('profilePage.credentialId')}:{' '}
                            <span title={credential.credential_id}>
                              {credential.credential_id.length > 20
                                ? credential.credential_id.substring(0, 20) + '...'
                                : credential.credential_id}
                            </span>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t('profilePage.registerTime')}: {new Date(credential.created_time * 1000).toLocaleString()}
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
            <SubCard title={t('profilePage.other')}>
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
          </Stack>
        </Card>
      </UserCard>
      <WechatModal open={openWechat} handleClose={handleWechatClose} wechatLogin={bindWeChat} qrCode={status.wechat_qrcode} />
      <EmailModal
        open={openEmail}
        turnstileToken={turnstileToken}
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
    </>
  );
}
