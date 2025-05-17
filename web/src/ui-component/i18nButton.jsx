import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Avatar, Box, ButtonBase, Hidden, Menu, MenuItem, Typography } from '@mui/material';
import i18nList from 'i18n/i18nList';
import useI18n from 'hooks/useI18n';
import Flags from 'country-flag-icons/react/3x2';
import { height } from '@mui/system';

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

  // 获取当前语言的国家代码
  const getCurrentCountryCode = () => {
    const currentLang = i18n.language || 'zh_CN';
    const langItem = i18nList.find((item) => item.lng === currentLang) || i18nList[0];
    return langItem.countryCode;
  };

  // 动态获取当前语言的国旗组件
  const CurrentFlag = Flags[getCurrentCountryCode()];

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
            borderRadius: '50%',
            background: 'transparent',
            overflow: 'hidden',
            '&[aria-controls="menu-list-grow"],&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              background: 'transparent !important'
            }
          }}
          color="inherit"
        >
          {CurrentFlag && (
            <Box
              sx={{
                width: '1.45rem',
                height: '1.125rem',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CurrentFlag style={{ width: '95%', height: '85%', borderRadius: '0.25rem' }} />
            </Box>
          )}
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
        {i18nList.map((item) => {
          const FlagComponent = Flags[item.countryCode];
          return (
            <MenuItem
              key={item.lng}
              onClick={() => handleLanguageChange(item.lng)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              {FlagComponent && (
                <Box
                  sx={{
                    width: '1.45rem',
                    height: '1.125rem',
                    overflow: 'hidden',
                    borderRadius: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FlagComponent style={{ width: '90%', height: '77%', borderRadius: '0.25rem' }} />
                </Box>
              )}
              <Typography variant="body1">{item.name}</Typography>
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
}
