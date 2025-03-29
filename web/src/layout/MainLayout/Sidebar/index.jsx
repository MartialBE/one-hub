import PropTypes from 'prop-types';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Chip, Drawer, Stack, useMediaQuery } from '@mui/material';

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar';
import { BrowserView, MobileView } from 'react-device-detect';

// project imports
import MenuList from './MenuList';
import LogoSection from '../LogoSection';
import MenuCard from './MenuCard';
import { drawerWidth } from 'store/constant';
import { useTranslation } from 'react-i18next';

// ==============================|| SIDEBAR DRAWER ||============================== //

const Sidebar = ({ drawerOpen, drawerToggle, window }) => {
  const theme = useTheme();
  const matchUpMd = useMediaQuery(theme.breakpoints.up('md'));
  const { t } = useTranslation();

  // 处理滚动事件，阻止冒泡
  const handleScroll = (e) => {
    e.stopPropagation();
  };

  const drawer = (
    <>
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Box sx={{ display: 'flex', p: 2, mx: 'auto' }}>
          <LogoSection />
        </Box>
      </Box>
      <BrowserView>
        <Box
          onWheel={handleScroll}
          onTouchMove={handleScroll}
          sx={{
            height: !matchUpMd ? 'calc(100vh - 56px)' : 'calc(100vh - 88px)',
            overflowX: 'hidden',
            mt: '0'
          }}
        >
          <PerfectScrollbar
            component="div"
            options={{
              wheelPropagation: false,
              suppressScrollX: true
            }}
            style={{
              height: '100%',
              paddingLeft: '16px',
              paddingRight: '16px',
              paddingTop: '8px'
            }}
          >
            <MenuList />
            <MenuCard />
            <Stack direction="row" justifyContent="center" sx={{ mb: 2, mt: 2 }}>
              <Chip
                label={import.meta.env.VITE_APP_VERSION || t('menu.unknownVersion')}
                disabled
                chipcolor="secondary"
                size="small"
                sx={{
                  cursor: 'pointer',
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  height: '24px',
                  '& .MuiChip-label': {
                    px: 1.5
                  }
                }}
              />
            </Stack>
          </PerfectScrollbar>
        </Box>
      </BrowserView>
      <MobileView>
        <Box
          onWheel={handleScroll}
          onTouchMove={handleScroll}
          sx={{
            px: 2,
            pt: 1,
            height: 'calc(100vh - 56px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': {
              display: 'none'
            }
          }}
        >
          <MenuList />
          <MenuCard />
          <Stack direction="row" justifyContent="center" sx={{ mb: 2, mt: 2 }}>
            <Chip
              label={import.meta.env.VITE_APP_VERSION || t('menu.unknownVersion')}
              disabled
              chipcolor="secondary"
              size="small"
              sx={{
                cursor: 'pointer',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
                height: '24px',
                '& .MuiChip-label': {
                  px: 1.5
                }
              }}
            />
          </Stack>
        </Box>
      </MobileView>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{
        flexShrink: { md: 0 },
        width: matchUpMd ? drawerWidth : 'auto'
      }}
      aria-label="mailbox folders"
    >
      <Drawer
        container={window?.document.body}
        variant={matchUpMd ? 'persistent' : 'temporary'}
        anchor="left"
        open={drawerOpen}
        onClose={drawerToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            background: theme.palette.background.default,
            color: theme.palette.text.primary,
            borderRight: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            transition: theme.transitions.create('width'),
            boxSizing: 'border-box',
            boxShadow: 'none',
            borderRadius: 0,
            [theme.breakpoints.up('md')]: {
              top: '88px',
              height: 'calc(100% - 88px)'
            },
            overflowX: 'hidden'
          }
        }}
        ModalProps={{ keepMounted: true }}
        color="inherit"
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

Sidebar.propTypes = {
  drawerOpen: PropTypes.bool,
  drawerToggle: PropTypes.func,
  window: PropTypes.object
};

export default Sidebar;
