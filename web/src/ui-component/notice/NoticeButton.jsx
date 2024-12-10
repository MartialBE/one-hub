import { Avatar, Box, ButtonBase } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Icon } from '@iconify/react';

import { useNotice } from './NoticeContext';

export function NoticeButton() {
  const theme = useTheme();
  const { openNotice } = useNotice();

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
          onClick={openNotice}
          color="inherit"
        >
          <Icon icon="lets-icons:message-duotone" width="1.3rem" />
        </Avatar>
      </ButtonBase>
    </Box>
  );
}
