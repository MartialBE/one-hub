// material-ui
import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Stack,
  Popper,
  IconButton,
  List,
  ListItemButton,
  Paper,
  ListItemText,
  Typography,
  Divider,
  ClickAwayListener
} from '@mui/material';
import LogoSection from 'layout/MainLayout/LogoSection';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ThemeButton from 'ui-component/ThemeButton';
import ProfileSection from 'layout/MainLayout/Header/ProfileSection';
import { IconMenu2 } from '@tabler/icons-react';
import Transitions from 'ui-component/extended/Transitions';
import MainCard from 'ui-component/cards/MainCard';
import { useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

const Header = () => {
  const theme = useTheme();
  const { pathname } = useLocation();
  const account = useSelector((state) => state.account);
  const [open, setOpen] = useState(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleOpenMenu = (event) => {
    setOpen(open ? null : event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };
  const { t } = useTranslation('common');

  return (
    <>
      <Box
        sx={{
          width: 228,
          display: 'flex',
          [theme.breakpoints.down('md')]: {
            width: 'auto'
          }
        }}
      >
        <Box component="span" sx={{ flexGrow: 1 }}>
          <LogoSection />
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ flexGrow: 1 }} />
      <Stack spacing={2} direction="row" justifyContent="center" alignItems="center">
        {isMobile ? (
          <>
            <ThemeButton />
            <IconButton onClick={handleOpenMenu}>
              <IconMenu2 />
            </IconButton>
          </>
        ) : (
          <>
            <Button component={Link} variant="text" to="/" color={pathname === '/' ? 'primary' : 'inherit'}>
              {t('home')}
            </Button>
            <Button component={Link} variant="text" to="/about" color={pathname === '/about' ? 'primary' : 'inherit'}>
              {t('about')}
            </Button>
            <ThemeButton />
            {account.user ? (
              <>
                <Button component={Link} variant="contained" to="/panel" color="primary">
                  {t('panel')}
                </Button>
                <ProfileSection />
              </>
            ) : (
              <Button component={Link} variant="contained" to="/login" color="primary">
                {t('login')}
              </Button>
            )}
          </>
        )}
      </Stack>

      <Popper
        open={!!open}
        anchorEl={open}
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
        style={{ width: '100vw' }}
      >
        {({ TransitionProps }) => (
          <Transitions in={open} {...TransitionProps}>
            <ClickAwayListener onClickAway={handleCloseMenu}>
              <Paper style={{ width: '100%' }}>
                <MainCard border={false} elevation={16} content={false} boxShadow shadow={theme.shadows[16]}>
                  <List
                    component="nav"
                    sx={{
                      width: '100%',
                      maxWidth: '100%',
                      minWidth: '100%',
                      backgroundColor: theme.palette.background.paper,

                      '& .MuiListItemButton-root': {
                        mt: 0.5
                      }
                    }}
                    onClick={handleCloseMenu}
                  >
                    <ListItemButton component={Link} variant="text" to="/">
                      <ListItemText primary={<Typography variant="body2">{t('home')}</Typography>} />
                    </ListItemButton>

                    <ListItemButton component={Link} variant="text" to="/about">
                      <ListItemText primary={<Typography variant="body2">{t('about')}</Typography>} />
                    </ListItemButton>
                    <Divider />
                    {account.user ? (
                      <ListItemButton component={Link} variant="contained" to="/panel" color="primary">
                        {t('panel')}
                      </ListItemButton>
                    ) : (
                      <ListItemButton component={Link} variant="contained" to="/login" color="primary">
                        {t('login')}
                      </ListItemButton>
                    )}
                  </List>
                </MainCard>
              </Paper>
            </ClickAwayListener>
          </Transitions>
        )}
      </Popper>
    </>
  );
};

export default Header;
