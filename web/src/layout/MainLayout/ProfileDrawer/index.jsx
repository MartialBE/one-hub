import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Avatar,
  Box,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  SwipeableDrawer,
  IconButton,
  Divider,
  Stack
} from '@mui/material';

// project imports
import User1 from 'assets/images/users/user-round.svg';
import useLogin from 'hooks/useLogin';
import { useTranslation } from 'react-i18next';
import { calculateQuota } from 'utils/common';

// assets
import { Icon } from '@iconify/react';
import { keyframes } from '@emotion/react';

// ==============================|| PROFILE DRAWER ||============================== //

const ProfileDrawer = ({ open, onClose }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, userGroup } = useSelector((state) => state.account);

  const { logout } = useLogin();

  const handleLogout = async () => {
    logout();
    if (onClose) onClose();
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

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

  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      PaperProps={{
        sx: {
          width: { xs: '85%', sm: 350 },
          maxWidth: '350px',
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[8],
          borderRadius: '0px 0px 0px 0px'
        }
      }}
      ModalProps={{
        keepMounted: true
      }}
      sx={{ zIndex: 1280 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* 顶部关闭按钮 */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={onClose} edge="end">
            <Icon icon="material-symbols:close" />
          </IconButton>
        </Box>

        {/* 用户信息头部 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', px: 2, pb: 2 }}>

          <Box
            component="div"
            sx={{
              cursor: 'pointer',
              position: 'relative',
              width: '64px',
              height: '64px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '50%',
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
              src={user?.avatar_url || User1}
              sx={{
                border: '1px solid',
                borderColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff'),
                bgcolor: '#FFFFFF',
                width: 62,
                height: 62
              }}
            />
          </Box>


          <Typography variant="h5" sx={{ fontWeight: 500, mb: 0.5 }}>
            {user?.display_name || user?.username || 'Unknown'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {user?.email || 'Unknown'}
          </Typography>
          <Box
            sx={{
              border: `1px solid ${theme.palette.primary.main}`,
              borderRadius: '15px',
              px: 2,
              py: 0.5,
              display: 'inline-block'
            }}
          >
            <Typography variant="caption" color="primary">
              {t('userPage.group')}: {userGroup?.[user?.group]?.name || user?.group}（ {t('modelpricePage.rate')}:
              {userGroup?.[user?.group]?.ratio || t('dashboard_index.unknown')}/ {t('modelpricePage.RPM')}:{userGroup?.[user?.group]?.api_rate || t('dashboard_index.unknown')}）
            </Typography>
          </Box>
        </Box>

        {/* 用户数据区域 - 严格按照图片布局 */}
        <Box sx={{ px: 3, py: 1.5 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {t('dashboard_index.balance')}
              </Typography>
              <Typography variant="body2">{user?.quota ? '$' + calculateQuota(user.quota) : t('dashboard_index.unknown')}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {t('dashboard_index.used')}
              </Typography>
              <Typography variant="body2">
                {user?.used_quota ? '$' + calculateQuota(user.used_quota) : t('dashboard_index.unknown')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {t('dashboard_index.calls')}
              </Typography>
              <Typography variant="body2">{user?.request_count || t('dashboard_index.unknown')}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {t('invite_count')}
              </Typography>
              <Typography variant="body2">{user?.aff_count || t('dashboard_index.unknown')}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {t('invite_reward')}
              </Typography>
              <Typography variant="body2">
                {user?.aff_quota ? '$' + calculateQuota(user.aff_quota) : t('dashboard_index.unknown')}
              </Typography>
            </Box>
          </Stack>
          <Divider sx={{ borderWidth: '1px', borderStyle: 'dashed', mt: 2, mb: 2 }} />
          {/* 按钮区域 */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{
                borderRadius: '4px',
                py: 1,
                textTransform: 'none',
                fontWeight: 'normal',
                bgcolor: theme.palette.primary.main,
                transition: 'transform 0.2s ease-in-out, background-color 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
              onClick={() => handleNavigate('/panel/topup')}
            >
              {t('topup')}
            </Button>
          </Box>

          <Divider sx={{ borderWidth: '1px', borderStyle: 'dashed', mt: 2, mb: 2 }} />

          {/* 底部导航菜单 */}
          <Box>
            <List>
              <ListItemButton onClick={() => handleNavigate('/')} sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon icon="mingcute:home-3-line" width="1.2rem" color={theme.palette.text.secondary} />
                </ListItemIcon>
                <ListItemText primary={t('menu.home')} />
              </ListItemButton>

              <ListItemButton onClick={() => handleNavigate('/panel/dashboard')} sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon icon="mingcute:dashboard-line" width="1.2rem" color={theme.palette.text.secondary} />
                </ListItemIcon>
                <ListItemText primary={t('dashboard')} />
              </ListItemButton>

              <ListItemButton onClick={() => handleNavigate('/panel/profile')} sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon icon="mingcute:user-4-line" width="1.2rem" color={theme.palette.text.secondary} />
                </ListItemIcon>
                <ListItemText primary={t('profile')} />
              </ListItemButton>
            </List>
          </Box>
        </Box>

        {/* 退出按钮 - 固定在底部 */}
        <Box sx={{ mt: 'auto', p: 2, position: 'sticky', bottom: 0, bgcolor: theme.palette.background.paper }}>
          <Button
            fullWidth
            variant="contained"
            sx={{
              borderRadius: '4px',
              py: 1,
              textTransform: 'none',
              fontWeight: 'normal',
              color: '#ab1632',
              bgcolor: '#FFDDD5', // 自定义颜色
              transition: 'transform 0.2s ease-in-out, background-color 0.2s ease-in-out', // 添加过渡效果
              '&:hover': {
                bgcolor: '#fdb5a5', // 悬停时的颜色
                transform: 'scale(1.03)' // 悬停时放大
              }
            }}
            onClick={handleLogout}
          >
            {t('menu.signout')}
          </Button>
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

ProfileDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func
};

export default ProfileDrawer;
