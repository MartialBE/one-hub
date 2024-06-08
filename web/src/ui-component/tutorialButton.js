import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { Avatar, Box, ButtonBase } from '@mui/material';
import { IconBook2 } from '@tabler/icons-react';
import { Steps } from 'intro.js-react';
import { useLocation } from 'react-router-dom';
import 'intro.js/introjs.css';

export default function TutorialButton() {
  const [tutorialEnabled, setTutorialEnabled] = useState(false);
  const [steps, setSteps] = useState([]);
  const theme = useTheme();
  const location = useLocation();

  const getElementByXpath = (path) => {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  };

  const setStepsData = (currentPage) => {
    const panelPaths = {
      '/panel/topup': [
        {
          element: document.querySelector('a[href="/panel/topup"]'),
          intro: '这是充值入口.',
          position: 'right'
        }
      ],
      '/panel/playground': [
        {
          element: document.querySelector('a[href="/panel/playground"]'),
          intro: '这是使用的地方但是有点小，可以不需要手动设置令牌.',
        }
      ],
      '/panel/token': [
        {
          element: document.querySelector('a[href="/panel/token"]'),
          intro: '这是令牌，创建令牌后点击聊天可以在更大的界面使用，还可以用于在其他平台使用，记得要改代理地址.',
        },
        {
          element: getElementByXpath('//*[@id="root"]/div/main/div/div[1]/button'),
          intro: '点击这个可以新建令牌，里面的额度和到期时间，如果是自己用的话建议设置不限额度和永不过期噢',
          position: 'left'
        }
      ],
      '/panel/*': [
        {
          element: document.querySelector('a[href="/panel/playground"]'),
          intro: '这是使用的地方但是有点小，可以不需要手动设置令牌.',
        },
        {
          element: document.querySelector('a[href="/panel/token"]'),
          intro: '这是令牌，创建令牌后点击聊天可以在更大的界面使用，还可以用于在其他平台使用，记得要改代理地址.',
        },
        {
          element: document.querySelector('a[href="/panel/midjourney"]'),
          intro: '这是MJ绘画，画过的画会在这里出现.',
        }
      ],
      '/panel': [
        {
          element: document.querySelector('a[href="/panel/playground"]'),
          intro: '这是使用的地方但是有点小，可以不需要手动设置令牌.',
        },
        {
          element: document.querySelector('a[href="/panel/token"]'),
          intro: '这是令牌，创建令牌后点击聊天可以在更大的界面使用，还可以用于在其他平台使用，记得要改代理地址.',
        },
        {
          element: document.querySelector('a[href="/panel/midjourney"]'),
          intro: '这是MJ绘画，画过的画会在这里出现.',
        }
      ],
      default: [
        {
          intro: '前往控制台再试试这个按钮吧！',
        }
      ]
    };

    const matchedPath = Object.keys(panelPaths).find(path => new RegExp(path.replace('*', '.*')).test(currentPage)) || 'default';
    return panelPaths[matchedPath];
  };

  useEffect(() => {
    const handleRouteChange = () => {
      const stepsData = setStepsData(location.pathname);
      setTimeout(() => setSteps(stepsData), 100); // 延迟100毫秒执行以确保DOM元素已渲染完成
    };

    handleRouteChange(); // Set steps on initial load

    const observer = new MutationObserver(() => {
      handleRouteChange();
    });

    observer.observe(document, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [location.pathname]);

  const handleAvatarClick = () => {
    setTutorialEnabled(true);
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
