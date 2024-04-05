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
import Transitions from 'ui-component/extended/Transitions';
import MainCard from 'ui-component/cards/MainCard';
import { useMediaQuery } from '@mui/material';
import { IconMenu2 } from '@tabler/icons-react';
import ProfileSection from 'layout/MainLayout/Header/ProfileSection';

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
        <Box component="span" sx={{ flexGrow: 1, }}>
          <LogoSection />
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ flexGrow: 1 }} />
      <Stack spacing={2} direction="row" justifyContent="center" alignItems="center">
        {isMobile ? (
          <>
            <IconButton onClick={handleOpenMenu}>
              <IconMenu2 />
            </IconButton>
          </>
        ) : (
          <>
            <Button component={Link} variant="text" to="/" color={pathname === '/' ? 'primary' : 'inherit'}>
              首页
            </Button>
            <Button component={Link} variant="text" to="/about" color={pathname === '/about' ? 'primary' : 'inherit'}>
              接口
            </Button>
            <Button
              variant="text"
              href="https://work.weixin.qq.com/kfid/kfce787ac8bbad50026" // 使用href而不是to
              target="_blank" // 在新标签页中打开链接
              rel="noopener noreferrer" // 出于安全考虑，防止链接到不安全的地方
              color={pathname === 'https://work.weixin.qq.com/kfid/kfce787ac8bbad50026' ? 'primary' : 'inherit'}
            >
              客服
            </Button>
            <Button
              variant="text"
              href="https://chat.czl.net" // 使用href而不是to
              target="_blank" // 在新标签页中打开链接
              rel="noopener noreferrer" // 出于安全考虑，防止链接到不安全的地方
              color={pathname === 'https://chat.czl.net' ? 'primary' : 'inherit'}
            >
              对话
            </Button>
            {account.user ? (
              <>
              <Button component={Link} variant="contained" to="/panel" color="primary">
              控制台
            </Button>
              <ProfileSection />
              </>
            ) : (
              <Button component={Link} variant="contained" to="/login" color="primary">
                登录
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
                      <ListItemText primary={<Typography variant="body2">首页</Typography>} />
                    </ListItemButton>

                    <ListItemButton component={Link} variant="text" to="/about">
                      <ListItemText primary={<Typography variant="body2">接口</Typography>} />
                    </ListItemButton>
                    <ListItemButton
                      variant="text"
                      href="https://work.weixin.qq.com/kfid/kfce787ac8bbad50026" // 使用href而不是to
                      target="_blank" // 在新标签页中打开链接
                      rel="noopener noreferrer" // 出于安全考虑，防止链接到不安全的地方
                      color={pathname === 'https://work.weixin.qq.com/kfid/kfce787ac8bbad50026' ? 'primary' : 'inherit'}
                    >
                      客服
                    </ListItemButton>
                    <ListItemButton
                      variant="text"
                      href="https://chat.czl.net" // 使用href而不是to
                      target="_blank" // 在新标签页中打开链接
                      rel="noopener noreferrer" // 出于安全考虑，防止链接到不安全的地方
                      color={pathname === 'https://chat.czl.net' ? 'primary' : 'inherit'}
                    >
                      对话
                    </ListItemButton>
                    <Divider />
                    {account.user ? (
                      <ListItemButton component={Link} variant="contained" to="/panel" color="primary">
                        控制台
                      </ListItemButton>
                    ) : (
                      <ListItemButton component={Link} variant="contained" to="/login" color="primary">
                        登录
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
