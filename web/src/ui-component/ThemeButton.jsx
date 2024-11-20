import { useDispatch, useSelector } from 'react-redux';
import { SET_THEME } from 'store/actions';
import { useTheme } from '@mui/material/styles';
import { Avatar, Box, ButtonBase } from '@mui/material';
import { Icon } from '@iconify/react';

export default function ThemeButton() {
  const dispatch = useDispatch();

  const defaultTheme = useSelector((state) => state.customization.theme);

  const theme = useTheme();

  return (
    <Box
      sx={{
        ml: 2,
        mr: 3,
        [theme.breakpoints.down('md')]: {
          mr: 2
        }
      }}
    >
      <ButtonBase sx={{ borderRadius: '12px' }}>
        <Avatar
          variant="rounded"
          sx={{
            ...theme.typography.commonAvatar,
            ...theme.typography.mediumAvatar,
            ...theme.typography.menuButton,
            transition: 'all .2s ease-in-out',
            borderColor: 'transparent',
            backgroundColor: 'transparent',
            boxShadow: 'none',
            // color: 'inherit',
            borderRadius: '50%',
            '&[aria-controls="menu-list-grow"],&:hover': {
              boxShadow: '0 0 10px rgba(0,0,0,0.2)',
              backgroundColor: 'transparent',
              borderRadius: '50%'
            }
          }}
          onClick={() => {
            let theme = defaultTheme === 'light' ? 'dark' : 'light';
            dispatch({ type: SET_THEME, theme: theme });
            localStorage.setItem('theme', theme);
          }}
          color="inherit"
        >
          {defaultTheme === 'light' ? (
            <Icon icon="solar:sun-2-bold-duotone" width="1.3rem" />
          ) : (
            <Icon icon="solar:moon-bold-duotone" width="1.3rem" />
          )}
        </Avatar>
      </ButtonBase>
    </Box>
  );
}
