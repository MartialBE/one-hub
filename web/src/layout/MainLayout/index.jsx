import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import AuthGuard from 'utils/route-guard/AuthGuard';

// material-ui
import { styled, useTheme } from '@mui/material/styles';
import { AppBar, Box, CssBaseline, Toolbar, useMediaQuery } from '@mui/material';
import AdminContainer from 'ui-component/AdminContainer';

// project imports
import Breadcrumbs from 'ui-component/extended/Breadcrumbs';
import Header from './Header';
import Sidebar from './Sidebar';
import navigation from 'menu-items';
import { drawerWidth } from 'store/constant';
import { SET_MENU } from 'store/actions';

// assets
import { Icon } from '@iconify/react';

// styles
export const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
  ...theme.typography.mainContent,
  borderRadius: 0,
  backgroundColor: theme.palette.background.default,
  transition: theme.transitions.create(
    ['margin', 'width'],
    open
      ? {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen
        }
      : {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen
        }
  ),
  overflowY: 'auto',
  overflowX: 'hidden',
  height: 'calc(100vh - 64px)',
  paddingBottom: '30px',
  marginTop: '64px',
  position: 'relative',
  scrollbarWidth: 'thin',
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px'
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
    borderRadius: '4px'
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent'
  },
  [theme.breakpoints.up('md')]: {
    marginLeft: open ? 0 : -(drawerWidth - 20),
    width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3)
  },
  [theme.breakpoints.down('md')]: {
    marginLeft: '0',
    width: '100%',
    padding: '16px',
    marginTop: '64px',
    height: 'calc(100vh - 64px)'
  },
  [theme.breakpoints.down('sm')]: {
    marginLeft: '0',
    width: '100%',
    padding: '16px',
    marginRight: '0',
    marginTop: '56px',
    height: 'calc(100vh - 56px)'
  }
}));

// ==============================|| MAIN LAYOUT ||============================== //

const MainLayout = () => {
  const theme = useTheme();
  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));
  // Handle left drawer
  const leftDrawerOpened = useSelector((state) => state.customization.opened);
  const dispatch = useDispatch();
  const handleLeftDrawerToggle = () => {
    dispatch({ type: SET_MENU, opened: !leftDrawerOpened });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        overflow: 'hidden',
        width: '100%',
        height: '100vh',
        position: 'relative',
        backgroundColor: theme.palette.background.default
      }}
    >
      <CssBaseline />
      {/* header */}
      <AppBar
        enableColorOnDark
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: theme.palette.background.default,
          boxShadow: 'none',
          borderBottom: 'none',
          transition: leftDrawerOpened ? theme.transitions.create('width') : 'none',
          zIndex: {
            xs: matchDownMd && leftDrawerOpened ? 0 : theme.zIndex.drawer - 1,
            md: theme.zIndex.drawer + 1
          },
          width: '100%'
        }}
      >
        <Toolbar sx={{ px: { xs: 1.5, sm: 2, md: 3 }, minHeight: '64px', height: '64px' }}>
          <Header handleLeftDrawerToggle={handleLeftDrawerToggle} />
        </Toolbar>
      </AppBar>

      {/* drawer */}
      <Sidebar drawerOpen={!matchDownMd ? leftDrawerOpened : !leftDrawerOpened} drawerToggle={handleLeftDrawerToggle} />

      {/* main content */}
      <Main theme={theme} open={leftDrawerOpened}>
        {/* breadcrumb */}
        <Breadcrumbs separator={<Icon icon="solar:arrow-right-linear" width="16" />} navigation={navigation} icon title rightAlign />
        <AuthGuard>
          <AdminContainer>
            <Outlet />
          </AdminContainer>
        </AuthGuard>
      </Main>
    </Box>
  );
};

export default MainLayout;
