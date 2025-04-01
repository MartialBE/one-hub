import { useState, useRef, useEffect } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Avatar,
  Box,
  ClickAwayListener,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popper,
  Typography,
  useMediaQuery,
  Drawer
} from '@mui/material';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import Transitions from 'ui-component/extended/Transitions';
import User1 from 'assets/images/users/user-round.svg';
import useLogin from 'hooks/useLogin';

// assets
import { Icon } from '@iconify/react';

import { useTranslation } from 'react-i18next';

// ==============================|| PROFILE MENU ||============================== //

const ProfileSection = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const customization = useSelector((state) => state.customization);
  const account = useSelector((state) => state.account);
  const { logout } = useLogin();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  console.log('Current device is mobile:', isMobile);

  // 调试宽度
  useEffect(() => {
    console.log('Window width:', window.innerWidth, 'isMobile:', isMobile);
  }, [isMobile]);

  const [open, setOpen] = useState(false);
  /**
   * anchorRef is used on different componets and specifying one type leads to other components throwing an error
   * */
  const anchorRef = useRef(null);
  const handleLogout = async () => {
    logout();
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleToggle = () => {
    console.log('Toggle clicked - current menu state:', open);
    setOpen(!open);
  };

  // 渲染移动端菜单内容
  const renderMobileMenuContent = () => (
    <Box sx={{ p: 0 }}>
      <List>
        <ListItemButton
          onClick={() => {
            navigate('/panel/profile');
            setOpen(false);
          }}
        >
          <ListItemIcon>
            <Icon icon="solar:user-id-bold-duotone" width="1.5rem" />
          </ListItemIcon>
          <ListItemText primary={<Typography variant="body1">{t('setting')}</Typography>} />
        </ListItemButton>

        <ListItemButton
          onClick={() => {
            handleLogout();
            setOpen(false);
          }}
        >
          <ListItemIcon>
            <Icon icon="solar:logout-3-bold-duotone" width="1.5rem" />
          </ListItemIcon>
          <ListItemText primary={<Typography variant="body1">{t('menu.signout')}</Typography>} />
        </ListItemButton>
      </List>
    </Box>
  );

  // 渲染桌面端菜单
  const renderDesktopMenu = () => (
    <Popper
      placement="bottom-end"
      open={open}
      anchorEl={anchorRef.current}
      role={undefined}
      transition
      disablePortal
      popperOptions={{
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 14]
            }
          }
        ]
      }}
      sx={{ zIndex: 1600 }}
    >
      {({ TransitionProps }) => (
        <Transitions type="grow" position="top-right" in={open} {...TransitionProps}>
          <Paper sx={{ width: 'auto', maxWidth: 350, overflow: 'hidden', borderRadius: '10px' }}>
            <ClickAwayListener onClickAway={handleClose}>
              <MainCard border={false} elevation={16} content={false} boxShadow shadow={theme.shadows[16]}>
                <List
                  component="nav"
                  sx={{
                    width: '100%',
                    bgcolor: 'background.paper',
                    py: 1,
                    '& .MuiListItemButton-root': {
                      mt: 0.5,
                      py: 0.5,
                      px: 2,
                      borderRadius: `${customization.borderRadius}px`
                    }
                  }}
                >
                  <ListItemButton
                    onClick={() => {
                      navigate('/panel/profile');
                      setOpen(false);
                    }}
                  >
                    <ListItemIcon>
                      <Icon icon="solar:user-id-bold-duotone" width="1.3rem" />
                    </ListItemIcon>
                    <ListItemText primary={<Typography variant="body2">{t('setting')}</Typography>} />
                  </ListItemButton>

                  <ListItemButton onClick={handleLogout}>
                    <ListItemIcon>
                      <Icon icon="solar:logout-3-bold-duotone" width="1.3rem" />
                    </ListItemIcon>
                    <ListItemText primary={<Typography variant="body2">{t('menu.signout')}</Typography>} />
                  </ListItemButton>
                </List>
              </MainCard>
            </ClickAwayListener>
          </Paper>
        </Transitions>
      )}
    </Popper>
  );

  return (
    <>
      {/* 用户头像按钮 */}
      <Box component="div" onClick={handleToggle} sx={{ cursor: 'pointer' }}>
        <Avatar
          src={account.user?.avatar_url || User1}
          sx={{
            ...theme.typography.mediumAvatar,
            cursor: 'pointer',
            border: `2px solid ${theme.palette.primary.light}`
          }}
          ref={anchorRef}
        />
      </Box>

      {/* 调试信息 */}
      <Box sx={{ display: 'none' }}>
        Device: {isMobile ? 'Mobile' : 'Desktop'}, Menu: {open ? 'Open' : 'Closed'}
      </Box>

      {/* 移动端使用Drawer */}
      {isMobile ? (
        <Drawer
          anchor="bottom"
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16
            }
          }}
          sx={{ zIndex: 1600 }}
        >
          {renderMobileMenuContent()}
        </Drawer>
      ) : (
        renderDesktopMenu()
      )}
    </>
  );
};

export default ProfileSection;
