import React, { useEffect, useState } from 'react';
import { showError } from 'utils/common';
import { API } from 'utils/api';
import { marked } from 'marked';
import BaseIndex from './baseIndex';
import { Box, Container } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    try {
      const res = await API.get('/api/home_page_content');
      const { success, message, data } = res.data;
      if (success) {
        let content = data;
        if (!data.startsWith('https://')) {
          content = marked.parse(data);
        }
        setHomePageContent(content);
        localStorage.setItem('home_page_content', content);
      } else {
        showError(message);
        setHomePageContent(t('home.loadingErr'));
      }
      setHomePageContentLoaded(true);
    } catch (error) {
      return;
    }
  };

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  return (
    <>
      {homePageContentLoaded && homePageContent === '' ? (
        <BaseIndex />
      ) : (
        <>
          <Box>
            {homePageContent.startsWith('https://') ? (
              <iframe title="home_page_content" src={homePageContent} style={{ width: '100%', height: '100vh', border: 'none' }} />
            ) : (
              <>
                <Container>
                  <div style={{ fontSize: 'larger' }} dangerouslySetInnerHTML={{ __html: homePageContent }}></div>
                </Container>
              </>
            )}
          </Box>
        </>
      )}
    </>
  );
};

export default Home;
