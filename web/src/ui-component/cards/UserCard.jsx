import PropTypes from 'prop-types';
import { Box, Avatar } from '@mui/material';
import Card from '@mui/material/Card';
import userAvatar from 'assets/images/users/user-round.svg';
import userBackground from 'assets/images/users/background-1.webp';
import { useSelector } from 'react-redux';
// material-ui
import { useTheme } from '@mui/material/styles';
import { keyframes } from '@emotion/react';
import React from 'react';

export default function UserCard({ children }) {
  const account = useSelector((state) => state.account);
  const theme = useTheme();

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
    <Card
      sx={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden'
        // bgcolor: 'rgba(22, 28, 36, 0.94)',
        // color: '#fff'
      }}
    >
      {/* 顶部渐变背景 */}
      <Box
        sx={{
          height: '140px',
          background: `url(${userBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.8,
          position: 'relative'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '84px',
          height: '84px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(90deg, 
            ${theme.palette.primary.main}, 
            ${theme.palette.secondary.main}, 
            ${theme.palette.primary.light}, 
            ${theme.palette.primary.main})`,
          backgroundSize: '300% 300%',
          animation: `${gradientAnimation} 5s ease infinite`,
          '&:hover': {
            animation: `${gradientAnimation} 5s ease infinite`,
          }
        }}
      >
        <Avatar
          src={account.user?.avatar_url || userAvatar}
          sx={{
            width: '80px',
            height: '80px',
            border: '2px solid #FFFFFF',
            bgcolor: '#FFFFFF',
            variant: 'rounded',
            transition: 'transform 0.2s ease-in-out, background-color 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.03)'
            }
          }}
        />
      </Box>

      <Box sx={{ p: 2 }}>{children}</Box>
    </Card>
  );
}

UserCard.propTypes = {
  children: PropTypes.node
};
