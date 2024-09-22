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
  useMediaQuery
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import SubCard from 'ui-component/cards/SubCard';
import { IconBrandWechat, IconBrandGithub, IconMail, IconBrandTelegram } from '@tabler/icons-react';
import Label from 'ui-component/Label';
import { API } from 'utils/api';
import { showError, showSuccess, onGitHubOAuthClicked, copy, trims, onLarkOAuthClicked } from 'utils/common';
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
    </>
  );
}
