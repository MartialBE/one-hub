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
import { NoticeButton } from 'ui-component/notice';
import I18nButton from 'ui-component/i18nButton';
import { IconMenu2 } from '@tabler/icons-react';
import Transitions from 'ui-component/extended/Transitions';
import MainCard from 'ui-component/cards/MainCard';
import { useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';

// ==============================|| MINIMAL NAVBAR / HEADER ||============================== //

const Header = () => {
  const theme = useTheme();
  const { pathname } = useLocation();
  const account = useSelector((state) => state.account);
  const [open, setOpen] = useState(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();

  const handleOpenMenu = (event) => {
    setOpen(open ? null : event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  return (
    <>
      <Box
        sx={{
          width: 228,
          display: 'flex',
          alignItems: 'center',
          [theme.breakpoints.down('md')]: {
            width: 'auto'
          }
        }}
      >
        <Box component="span" sx={{ display: 'block' }}>
          <LogoSection />
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1 }} />
      <Stack spacing={{ xs: 0.5, sm: 1, md: 2 }} direction="row" justifyContent="center" alignItems="center">
        {isMobile ? (
          <>
            <NoticeButton sx={{ color: theme.palette.text.primary, mr: 1 }} />
            <ThemeButton sx={{ color: theme.palette.text.primary, mr: 1 }} />
            <I18nButton sx={{ color: theme.palette.text.primary, mr: 1 }} />
            <IconButton
              onClick={handleOpenMenu}
              sx={{
                color: theme.palette.text.primary,
                borderRadius: '12px',
                padding: '8px',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <IconMenu2 stroke={1.5} size="1.3rem" />
            </IconButton>
          </>
        ) : (
          <>
            <Button
              component={Link}
              variant="text"
              to="/"
              color={pathname === '/' ? 'primary' : 'inherit'}
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none'
              }}
            >
              {t('menu.home')}
            </Button>
            {account.user && (
              <Button
                component={Link}
                variant="text"
                to="/playground"
                color={pathname === '/playground' ? 'primary' : 'inherit'}
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textTransform: 'none'
                }}
              >
                {t('playground')}
              </Button>
            )}
            <Button
              component={Link}
              variant="text"
              to="/price"
              color={pathname === '/price' ? 'primary' : 'inherit'}
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none'
              }}
            >
              {t('price')}
            </Button>
            <Button
              component={Link}
              variant="text"
              to="/about"
              color={pathname === '/about' ? 'primary' : 'inherit'}
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none'
              }}
            >
              {t('menu.about')}
            </Button>
            <NoticeButton sx={{ color: theme.palette.text.primary, ml: 1 }} />
            <ThemeButton sx={{ color: theme.palette.text.primary, ml: 0.5 }} />
            <I18nButton sx={{ color: theme.palette.text.primary, ml: 0.5 }} />
            {account.user ? (
              <Button
                component={Link}
                variant="contained"
                to="/panel"
                color="primary"
                sx={{
                  ml: 2,
                  px: 2,
                  height: '40px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textTransform: 'none'
                }}
              >
                {t('menu.console')}
              </Button>
            ) : (
              <Button
                component={Link}
                variant="contained"
                to="/login"
                color="primary"
                sx={{
                  ml: 2,
                  px: 2.5,
                  height: '40px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textTransform: 'none'
                }}
              >
                {t('menu.login')}
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
        placement="bottom-end"
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
        style={{ zIndex: theme.zIndex.drawer + 2 }}
      >
        {({ TransitionProps }) => (
          <Transitions in={open} {...TransitionProps}>
            <ClickAwayListener onClickAway={handleCloseMenu}>
              <Paper
                sx={{
                  width: { xs: '100vw', sm: '320px' },
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: theme.shadows[8]
                }}
              >
                <MainCard border={false} elevation={0} content={false} boxShadow>
                  <List
                    component="nav"
                    sx={{
                      width: '100%',
                      backgroundColor: theme.palette.background.paper,
                      py: 1,
                      '& .MuiListItemButton-root': {
                        py: 1.25,
                        px: 2.5,
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      },
                      '& .Mui-selected': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'
                        }
                      }
                    }}
                    onClick={handleCloseMenu}
                  >
                    <ListItemButton component={Link} to="/" selected={pathname === '/'}>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: pathname === '/' ? 500 : 400,
                              color: pathname === '/' ? theme.palette.primary.main : theme.palette.text.primary
                            }}
                          >
                            {t('menu.home')}
                          </Typography>
                        }
                      />
                    </ListItemButton>

                    {account.user && (
                      <ListItemButton component={Link} to="/playground" selected={pathname === '/playground'}>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: pathname === '/playground' ? 500 : 400,
                                color: pathname === '/playground' ? theme.palette.primary.main : theme.palette.text.primary
                              }}
                            >
                              {t('playground')}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    )}

                    <ListItemButton component={Link} to="/price" selected={pathname === '/price'}>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: pathname === '/price' ? 500 : 400,
                              color: pathname === '/price' ? theme.palette.primary.main : theme.palette.text.primary
                            }}
                          >
                            {t('price')}
                          </Typography>
                        }
                      />
                    </ListItemButton>

                    <ListItemButton component={Link} to="/about" selected={pathname === '/about'}>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: pathname === '/about' ? 500 : 400,
                              color: pathname === '/about' ? theme.palette.primary.main : theme.palette.text.primary
                            }}
                          >
                            {t('menu.about')}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                    <Divider sx={{ my: 1 }} />
                    {account.user ? (
                      <ListItemButton
                        component={Link}
                        to="/panel"
                        sx={{
                          backgroundColor: theme.palette.primary.light,
                          borderRadius: '8px',
                          mx: 1.5,
                          '&:hover': {
                            backgroundColor: theme.palette.primary.main,
                            '& .MuiTypography-root': {
                              color: '#fff'
                            }
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography
                              color="primary"
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                textAlign: 'center',
                                transition: 'color 0.2s ease'
                              }}
                            >
                              {t('menu.console')}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    ) : (
                      <ListItemButton
                        component={Link}
                        to="/login"
                        sx={{
                          backgroundColor: theme.palette.primary.light,
                          borderRadius: '8px',
                          mx: 1.5,
                          '&:hover': {
                            backgroundColor: theme.palette.primary.main,
                            '& .MuiTypography-root': {
                              color: '#fff'
                            }
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography
                              color="primary"
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                textAlign: 'center',
                                transition: 'color 0.2s ease'
                              }}
                            >
                              {t('menu.login')}
                            </Typography>
                          }
                        />
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
