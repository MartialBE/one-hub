import { useState, useEffect } from 'react';
import UserCard from 'ui-component/cards/UserCard';
import {
  Card,
  Button,
  InputLabel,
  FormControl,
  OutlinedInput,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import SubCard from 'ui-component/cards/SubCard';
import { IconBrandWechat, IconBrandGithub, IconMail } from '@tabler/icons-react';
import Label from 'ui-component/Label';
import { API } from 'utils/api';
import { showError, showSuccess } from 'utils/common';
import { onGitHubOAuthClicked } from 'utils/common';
import * as Yup from 'yup';
import WechatModal from 'views/Authentication/AuthForms/WechatModal';
import { useSelector } from 'react-redux';
import EmailModal from './component/EmailModal';
import Turnstile from 'react-turnstile';

import { Box, Typography, ClickAwayListener, Tooltip } from '@mui/material';
import Chip from '@mui/material/Chip';
import axios from 'axios';

const validationSchema = Yup.object().shape({
  username: Yup.string().required('用户名 不能为空').min(3, '用户名 不能小于 3 个字符'),
  display_name: Yup.string(),
  password: Yup.string().test('password', '密码不能小于 8 个字符', (val) => {
    return !val || val.length >= 8;
  })
});

export default function Profile() {
  const [inputs, setInputs] = useState([]);
  const [showAccountDeleteModal, setShowAccountDeleteModal] = useState(false);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [openWechat, setOpenWechat] = useState(false);
  const [openEmail, setOpenEmail] = useState(false);
  const status = useSelector((state) => state.siteInfo);

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
    let res = await API.get(`/api/user/self`);
    const { success, message, data } = res.data;
    if (success) {
      setInputs(data);
    } else {
      showError(message);
    }
  };

  const bindWeChat = async (code) => {
    if (code === '') return;
    try {
      const res = await API.get(`/api/oauth/wechat/bind?code=${code}`);
      const { success, message } = res.data;
      if (success) {
        showSuccess('微信账户绑定成功！');
      }
      return { success, message };
    } catch (err) {
      // 请求失败，设置错误信息
      return { success: false, message: '' };
    }
  };

  const generateAccessToken = async () => {
    const res = await API.get('/api/user/token');
    const { success, message, data } = res.data;
    if (success) {
      setInputs((inputs) => ({ ...inputs, access_token: data }));
      navigator.clipboard.writeText(data);
      showSuccess(`令牌已重置并已复制到剪贴板`);
    } else {
      showError(message);
    }

    console.log(turnstileEnabled, turnstileSiteKey, status);
  };

  const submit = async () => {
    try {
      await validationSchema.validate(inputs);
      const res = await API.put(`/api/user/self`, inputs);
      const { success, message } = res.data;
      if (success) {
        showSuccess('用户信息更新成功！');
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
const [modelsByOwner, setModelsByOwner] = useState({});
  const fetchModels = () => {
    axios.get('/api/token/?p=0')
      .then(response => {
        const keys = response.data.data;
        const validKey = keys.find(item => item.status === 1);

        if (!validKey) {
          throw new Error('请启用一个Key,用来查询可用模型');
        }

        const key = 'sk-' + validKey.key;
        return axios.get('/v1/models', { headers: { Authorization: `Bearer ${key}` } });
      })
      .then(response => {
        const models = response.data.data;
        const modelsByOwner = models.reduce((result, model) => {
          const owner = model.owned_by || '未分类';

          if (!result[owner]) {
            result[owner] = [];
          }

          result[owner].push(model.id);
          return result;
        }, {});

        setModelsByOwner(modelsByOwner);
      })
      .catch(error => {
        // 如果出现错误，就显示提示
        setModelsByOwner({ 错误: [error.message] });
      });
  };



  useEffect(() => {
    fetchModels();
  }, []);  // 添加空数组作为依赖，以确保这段代码只在组件载入时执行一次

  // 模型复制操作
  const ModelChip = ({ model }) => {
    const [open, setOpen] = useState(false);

    const handleClick = () => {
      navigator.clipboard.writeText(model);
      setOpen(true);
    };

    const handleClose = (event) => {
      if (event) {
        event.stopPropagation();
      }
      setOpen(false);
    };

    return (
      <ClickAwayListener onClickAway={handleClose}>
        <Tooltip open={open} onClose={handleClose} title="已复制" placement="top">
          <Chip label={`${model}`} onClick={handleClick} sx={{ '&:hover': { transform: 'scale(1.1)', transition: 'transform 0.3s' } }} />
        </Tooltip>
      </ClickAwayListener>
    );
  }
  return (
    <>
      <UserCard>
        <Card sx={{ paddingTop: '20px' }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ paddingBottom: '20px' }}>
              <Label variant="ghost" color={inputs.wechat_id ? 'primary' : 'default'}>
                <IconBrandWechat /> {inputs.wechat_id || '未绑定'}
              </Label>
              <Label variant="ghost" color={inputs.github_id ? 'primary' : 'default'}>
                <IconBrandGithub /> {inputs.github_id || '未绑定'}
              </Label>
              <Label variant="ghost" color={inputs.email ? 'primary' : 'default'}>
                <IconMail /> {inputs.email || '未绑定'}
              </Label>
            </Stack>
            <SubCard title="个人信息">
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel htmlFor="username">用户名</InputLabel>
                    <OutlinedInput
                      id="username"
                      label="用户名"
                      type="text"
                      value={inputs.username || ''}
                      onChange={handleInputChange}
                      name="username"
                      placeholder="请输入用户名"
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel htmlFor="password">密码</InputLabel>
                    <OutlinedInput
                      id="password"
                      label="密码"
                      type="password"
                      value={inputs.password || ''}
                      onChange={handleInputChange}
                      name="password"
                      placeholder="请输入密码"
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel htmlFor="display_name">显示名称</InputLabel>
                    <OutlinedInput
                      id="display_name"
                      label="显示名称"
                      type="text"
                      value={inputs.display_name || ''}
                      onChange={handleInputChange}
                      name="display_name"
                      placeholder="请输入显示名称"
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12}>
                  <Button variant="contained" color="primary" onClick={submit}>
                    提交
                  </Button>
                </Grid>
              </Grid>
            </SubCard>
            <SubCard title="可用模型">
              {Object.entries(modelsByOwner).map(([owner, models]) => (
                <Box key={owner}>
                  <Typography variant="h6" sx={{ marginBottom: '10px' }}>分类：{owner}</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {models.map(model => (
                      <ModelChip key={model} model={model} />
                    ))}
                  </Box>
                </Box>
              ))}
            </SubCard>
            <SubCard title="账号绑定">
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
              <Grid container spacing={2} marginTop={'10px'}>
                {status.wechat_login && !inputs.wechat_id && (
                  <Grid xs={12} md={4}>
                    <Button variant="contained" onClick={handleWechatOpen}>
                      绑定微信账号
                    </Button>
                  </Grid>
                )}
                {status.github_oauth && !inputs.github_id && (
                  <Grid xs={12} md={4}>
                    <Button variant="contained" onClick={() => onGitHubOAuthClicked(status.github_client_id, true)}>
                      绑定GitHub账号
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
                    {inputs.email ? '更换邮箱' : '绑定邮箱'}
                  </Button>
                </Grid>
              </Grid>
            </SubCard>
            <SubCard title="其他">
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <Alert severity="info">注意，此处生成的令牌用于系统管理，而非用于请求 OpenAI 相关的服务，请知悉。</Alert>
                </Grid>
                {inputs.access_token && (
                  <Grid xs={12}>
                    <Alert severity="error">
                      你的访问令牌是: <b>{inputs.access_token}</b> <br />
                      请妥善保管。如有泄漏，请立即重置。
                    </Alert>
                  </Grid>
                )}
                <Grid xs={12}>
                  <Button variant="contained" onClick={generateAccessToken}>
                    {inputs.access_token ? '重置访问令牌' : '生成访问令牌'}
                  </Button>
                </Grid>

                <Grid xs={12}>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => {
                      setShowAccountDeleteModal(true);
                    }}
                  >
                    删除帐号
                  </Button>
                </Grid>
              </Grid>
            </SubCard>
          </Stack>
        </Card>
      </UserCard>
      <Dialog open={showAccountDeleteModal} onClose={() => setShowAccountDeleteModal(false)} maxWidth={'md'}>
        <DialogTitle sx={{ margin: '0px', fontWeight: 500, lineHeight: '1.55556', padding: '24px', fontSize: '1.125rem' }}>
          危险操作
        </DialogTitle>
        <Divider />
        <DialogContent>您正在删除自己的帐户，将清空所有数据且不可恢复</DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAccountDeleteModal(false)}>取消</Button>
          <Button
            sx={{ color: 'error.main' }}
            onClick={async () => {
              setShowAccountDeleteModal(false);
            }}
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>
      <WechatModal open={openWechat} handleClose={handleWechatClose} wechatLogin={bindWeChat} qrCode={status.wechat_qrcode} />
      <EmailModal
        open={openEmail}
        turnstileToken={turnstileToken}
        handleClose={() => {
          setOpenEmail(false);
        }}
      />
    </>
  );
}
