import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Avatar, Box, ButtonBase, Menu, MenuItem } from '@mui/material';
import { IconLanguageHiragana } from '@tabler/icons-react';
import i18nList from 'i18n/i18nList';
import useI18n from 'hooks/useI18n';

export default function I18nButton() {
  const theme = useTheme();
  const i18n = useI18n();

  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    handleMenuClose();
  };

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
      <ButtonBase sx={{ borderRadius: '12px' }} onClick={handleMenuOpen}>
        <Avatar
          variant="rounded"
          sx={{
            ...theme.typography.commonAvatar,
            ...theme.typography.mediumAvatar,
            ...theme.typography.menuButton,
            transition: 'all .2s ease-in-out',
            borderColor: theme.typography.menuChip.background,
            '&[aria-controls="menu-list-grow"],&:hover': {
              background: `${theme.palette.primary.main}!important`,
              color: theme.palette.primary.light
            }
          }}
          color="inherit"
        >
          <IconLanguageHiragana stroke={1.5} size="1.3rem" />
        </Avatar>
      </ButtonBase>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        {i18nList.map((item) => (
          <MenuItem key={item.lng} onClick={() => handleLanguageChange(item.lng)}>
            {item.name}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
