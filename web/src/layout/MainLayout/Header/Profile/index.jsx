import { useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
// material-ui
import { useTheme } from '@mui/material/styles';
import { Avatar, Box } from '@mui/material';
import User1 from 'assets/images/users/user-round.svg';

// ==============================|| PROFILE MENU ||============================== //

const Profile = ({ toggleProfileDrawer }) => {
  const theme = useTheme();
  const account = useSelector((state) => state.account);
  const anchorRef = useRef(null);

  return (
    <>
      {/* 用户头像按钮 */}
      <Box component="div" onClick={toggleProfileDrawer} sx={{ cursor: 'pointer' }}>
        <Avatar
          src={account.user?.avatar_url || User1}
          sx={{
            ...theme.typography.mediumAvatar,
            cursor: 'pointer',
            // 滚动渐变边框
            border: `1px solid ${theme.palette.primary.dark}`,
            width: '45px',
            height: '45px',
            bgcolor: '#FFFFFF',
            variant: 'rounded',
            transition: 'transform 0.2s ease-in-out, background-color 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.03)'
            }
          }}
          ref={anchorRef}
        />
      </Box>
    </>
  );
};

Profile.propTypes = {
  toggleProfileDrawer: PropTypes.func
};

export default Profile;