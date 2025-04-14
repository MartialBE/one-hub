import { Stack, Typography, Box, Button, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SubCard from 'ui-component/cards/SubCard';
import { IconMessageChatbot } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useState, useCallback } from 'react';
import { API } from 'utils/api';
import { replaceChatPlaceholders } from 'utils/common';
import { IconAppWindow } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const QuickStartCard = () => {
  const { t } = useTranslation();
  const [key, setKey] = useState('');
  const theme = useTheme();
  const siteInfo = useSelector((state) => state.siteInfo);
  const chatLinks = siteInfo.chat_links && siteInfo.chat_links != '' ? JSON.parse(siteInfo.chat_links) : [];
  const baseServer = siteInfo.server_address;

  const initChatOptions = useCallback(
    (key) => {
      if (chatLinks.length > 0) {
        let server = '';
        if (baseServer) {
          server = baseServer;
        } else {
          server = window.location.host;
        }
        server = encodeURIComponent(server);
        const useKey = 'sk-' + key;

        const newQuickStartOptions = [];
        const newLocalOptions = [];

        chatLinks.forEach((item) => {
          var url = replaceChatPlaceholders(item.url, useKey, server);
          if (item.url.startsWith('http')) {
            newQuickStartOptions.push({
              icon: <IconMessageChatbot />,
              title: item.name,
              url: url
            });
          } else {
            newLocalOptions.push({
              icon: <IconAppWindow />,
              title: item.name,
              url: url
            });
          }
        });
      }
    },
    [chatLinks, baseServer]
  );

  const handleClick = async (url) => {
    if (!key) {
      try {
        const res = await API.get(`/api/token/playground`);
        const { success, message, data } = res.data;
        if (success) {
          setKey(data);
          initChatOptions(data);
          window.open(replaceChatPlaceholders(url, 'sk-' + data, encodeURIComponent(baseServer || window.location.host)), '_blank');
        } else {
          console.log('message', message);
        }
      } catch (error) {
        console.error('Failed to get token:', error);
      }
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <Box>
      <SubCard>
        <Stack spacing={3}>
          <Typography variant="h3" color={theme.palette.primary.dark}>
            {t('dashboard_index.quickStart')}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {t('dashboard_index.quickStartTip')}
          </Typography>

          <Stack spacing={2}>
            {chatLinks.map(
              (option, index) =>
                option.url.startsWith('http') && (
                  <Button
                    key={index}
                    variant="contained"
                    startIcon={<IconMessageChatbot />}
                    onClick={() => handleClick(option.url)}
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                        boxShadow: '0 0 10px 0 rgba(11, 108, 235, 0.5)'
                      },
                      textTransform: 'none',
                      boxShadow: '0 0 15px 0 rgba(11, 108, 235, 0.5)'
                    }}
                  >
                    {option.name}
                  </Button>
                )
            )}
          </Stack>
          <Divider />
          <Stack spacing={2} direction="row" flexWrap="wrap" sx={{ gap: 2 }}>
            {chatLinks.map(
              (option, index) =>
                !option.url.startsWith('http') && (
                  <Button
                    key={index}
                    variant="contained"
                    startIcon={<IconAppWindow />}
                    onClick={() => handleClick(option.url)}
                    sx={{
                      backgroundColor: '#00B8D4',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#00838F',
                        boxShadow: '0 0 10px 0 rgba(3, 119, 94, 0.5)'
                      },
                      textTransform: 'none',
                      boxShadow: '0 0 15px 0 rgba(3, 119, 94, 0.5)'
                    }}
                  >
                    {option.name}
                  </Button>
                )
            )}
          </Stack>
        </Stack>
      </SubCard>
    </Box>
  );
};

export default QuickStartCard;
