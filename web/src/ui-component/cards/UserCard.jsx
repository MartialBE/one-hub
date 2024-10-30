import PropTypes from 'prop-types';
import { Box, Avatar } from '@mui/material';
import Card from '@mui/material/Card';
import userAvatar from 'assets/images/users/user-round.svg';

import React from 'react';

export default function UserCard({ children }) {
  return (
    <Card
      sx={{
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden'
        // bgcolor: 'rgba(22, 28, 36, 0.94)',
        // color: '#fff'
      }}
    >
      {/* 顶部渐变背景 */}
      <Box
        sx={{
          height: '140px',
          background: 'linear-gradient(135deg, #40c4ff 0%, #7b1fa2 100%)',
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
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          display: 'flex',
          padding: '2px',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
      >
        <Avatar
          src={userAvatar}
          sx={{
            width: '100%',
            height: '100%'
            // bgcolor: '#1a2027'
          }}
        />
      </Box>

      {children}
    </Card>
  );
}

UserCard.propTypes = {
  children: PropTypes.node
};
