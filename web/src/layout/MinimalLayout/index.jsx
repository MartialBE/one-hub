import { Outlet } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { AppBar, Box, CssBaseline, Toolbar, Container, useMediaQuery } from '@mui/material';
import Header from './Header';
import Footer from 'ui-component/Footer';

// ==============================|| MINIMAL LAYOUT ||============================== //

const MinimalLayout = () => {
  const theme = useTheme();
  const matchDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        enableColorOnDark
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: theme.palette.background.default,
          boxShadow: 'none',
          borderBottom: 'none',
          zIndex: theme.zIndex.drawer + 1,
          width: '100%',
          borderRadius:0
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ px: { xs: 1.5, sm: 2, md: 3 }, minHeight: '64px', height: '64px' }}>
            <Header />
          </Toolbar>
        </Container>
      </AppBar>
      <Box
        sx={{
          flex: '1 1 auto',
          overflow: 'auto',
          marginTop: { xs: '56px', sm: '64px' },
          backgroundColor: theme.palette.background.default,
          // padding: { xs: '16px', sm: '20px', md: '24px' },
          position: 'relative',
          minHeight: `calc(100vh - ${matchDownSm ? '56px' : '64px'} - ${matchDownMd ? '80px' : '60px'})`,
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
          }
        }}
      >
        <Outlet />
      </Box>
      <Box sx={{ flex: 'none', position: 'relative', zIndex: 1 }}>
        <Footer />
      </Box>
    </Box>
  );
};

export default MinimalLayout;
