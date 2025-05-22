import { useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
// material-ui
import { useTheme } from '@mui/material/styles';
import { Avatar, Box } from '@mui/material';
import { keyframes } from '@emotion/react';
import User1 from 'assets/images/users/user-round.svg';

// ==============================|| PROFILE MENU ||============================== //

const Profile = ({ toggleProfileDrawer }) => {
  const theme = useTheme();
  const account = useSelector((state) => state.account);
  const anchorRef = useRef(null);

  // Define the gradient animation
  const gradientAnimation = keyframes`
    0% {
      background-position: 0 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0 50%;
    }
  `;

  return (
    <>
      {/* 用户头像按钮 */}
      <Box
        component="div"
        onClick={toggleProfileDrawer}
        sx={{
          cursor: 'pointer',
          position: 'relative',
          width: '48px',
          height: '48px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '50%',
          background: `linear-gradient(90deg, 
            ${theme.palette.primary.main}, 
            ${theme.palette.secondary.main}, 
            ${theme.palette.primary.light}, 
            ${theme.palette.primary.main})`,
          backgroundSize: '300% 300%',
          animation: `${gradientAnimation} 5s ease infinite`,
          '&:hover': {
            animation: `${gradientAnimation} 5s ease infinite`
          }
        }}
      >
        <Avatar
          src={account.user?.avatar_url || User1}
          sx={{
            ...theme.typography.mediumAvatar,
            cursor: 'pointer',
            width: '45px',
            height: '45px',
            border: '2px solid #FFFFFF',
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
