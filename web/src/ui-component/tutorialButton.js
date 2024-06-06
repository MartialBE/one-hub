import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { Avatar, Box, ButtonBase } from '@mui/material';
import { IconBook2 } from '@tabler/icons-react';
import { Steps } from 'intro.js-react';
import 'intro.js/introjs.css';

export default function TutorialButton() {
  const [tutorialEnabled, setTutorialEnabled] = useState(false);
  const [steps, setSteps] = useState([]);
  const theme = useTheme();

  useEffect(() => {
    setSteps([
      {
        element: document.querySelector('a[href="/panel/topup"]'),
        intro: '这是充值入口.',
        position: 'right'
      },
      {
        element: document.querySelector('a[href="/panel/playground"]'),
        intro: '这是使用的地方，可以不需要手动设置令牌.',
      },
      {
        element: document.querySelector('a[href="/panel/token"]'),
        intro: '这是令牌，用于在其他平台使用，记得要改代理地址.',
      }
    ]);
  }, [tutorialEnabled]);

  const handleAvatarClick = () => {
    setTutorialEnabled(true); // 原神启动！！！
  };

  const handleExit = () => {
    setTutorialEnabled(false);
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
      <ButtonBase sx={{ borderRadius: '12px' }}>
        <Avatar
          variant="rounded"
          sx={{
            ...theme.typography.commonAvatar,
            ...theme.typography.mediumAvatar,
            transition: 'all .2s ease-in-out',
            borderColor: theme.typography.menuChip.background,
            backgroundColor: theme.typography.menuChip.background,
            '&[aria-controls="menu-list-grow"],&:hover': {
              background: theme.palette.secondary.dark,
              color: theme.palette.secondary.light
            }
          }}
          onClick={handleAvatarClick}
          color="inherit"
        >
          <IconBook2 stroke={1.5} size="1.3rem" />
        </Avatar>
      </ButtonBase>

      <Steps
        enabled={tutorialEnabled}
        steps={steps}
        initialStep={0}
        onExit={handleExit}
      />
    </Box>
  );
}
