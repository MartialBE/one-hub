import PropTypes from 'prop-types';
import { useState } from 'react';
import { Icon } from '@iconify/react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, ButtonBase } from '@mui/material';

// project imports
import LogoSection from '../LogoSection';
import ProfileSection from './ProfileSection';
import ThemeButton from 'ui-component/ThemeButton';
import I18nButton from 'ui-component/i18nButton';
import { NoticeButton } from 'ui-component/notice';

// assets
// import { Icon } from '@iconify/react';

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

const Header = ({ handleLeftDrawerToggle }) => {
  const theme = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  return (
    <>
      {/* logo & toggler button */}
      <Box
        sx={{
          width: 228,
          display: 'flex',
          [theme.breakpoints.down('md')]: {
            width: 'auto'
          }
        }}
      >
        <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1 }}>
          <LogoSection />
        </Box>
        <ButtonBase
          sx={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
            }
          }}
          onClick={() => {
            setIsDrawerOpen(!isDrawerOpen);
            handleLeftDrawerToggle();
          }}
        >
          <Icon
            icon={isDrawerOpen ? 'material-symbols:menu-open' : 'material-symbols:menu'}
            width="20px"
            color={theme.palette.mode === 'dark' ? '#ffffff' : '#000000'}
            style={{
              opacity: theme.palette.mode === 'dark' ? 0.9 : 0.7,
              transition: 'transform 0.2s ease-in-out'
            }}
          />
        </ButtonBase>
      </Box>

      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ flexGrow: 1 }} />
      <NoticeButton />
      <ThemeButton />
      <I18nButton />
      <ProfileSection />
    </>
  );
};

Header.propTypes = {
  handleLeftDrawerToggle: PropTypes.func
};

export default Header;
