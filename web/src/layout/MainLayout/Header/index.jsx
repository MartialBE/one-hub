import PropTypes from 'prop-types';
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useLocation } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, IconButton, Stack } from '@mui/material';

// project imports
import LogoSection from '../LogoSection';
import Profile from './Profile';
import ThemeButton from 'ui-component/ThemeButton';
import I18nButton from 'ui-component/i18nButton';
import { NoticeButton } from 'ui-component/notice';

// assets
// import { Icon } from '@iconify/react';

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

const Header = ({ handleLeftDrawerToggle, toggleProfileDrawer }) => {
  const theme = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const location = useLocation();
  
  // 检查当前路径是否为面板/控制台页面
  const isConsoleRoute = location.pathname.startsWith('/panel');

  return (
    <>
      {/* logo & toggler button */}
      <Box
        sx={{
          width: isDrawerOpen ? 255 : 150,
          display: 'flex',
          alignItems: 'center',
          [theme.breakpoints.down('md')]: {
            width: 'auto'
          }
        }}
      >
        <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1 }}>
          <LogoSection />
        </Box>
        <IconButton
          size="medium"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{
            width: '38',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'
            },
            transition: 'background-color 0.2s ease-in-out'
          }}
          onClick={() => {
            setIsDrawerOpen(!isDrawerOpen);
            handleLeftDrawerToggle();
          }}
        >
          <Icon
            icon={isDrawerOpen ? 'tabler:layout-sidebar-right-collapse' : 'tabler:layout-sidebar-left-expand'}
            width="22px"
            height="22px"
            color={theme.palette.mode === 'dark' ? theme.palette.text.secondary : theme.palette.text.primary}
          />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      {/* 右侧功能按钮区 */}
      <Stack direction="row" spacing={1} alignItems="center">
        <NoticeButton />
        <ThemeButton />
        <I18nButton />
        {isConsoleRoute && <Profile toggleProfileDrawer={toggleProfileDrawer} />}
      </Stack>
    </>
  );
};

Header.propTypes = {
  handleLeftDrawerToggle: PropTypes.func,
  toggleProfileDrawer: PropTypes.func
};

export default Header;
