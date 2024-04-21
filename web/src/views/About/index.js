import React, { useEffect, useState, useCallback } from 'react';
import { API } from 'utils/api';
import { showError } from 'utils/common';
import { marked } from 'marked';
import { Box, Container, Typography } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import { useTranslation } from 'react-i18next';

const About = () => {
  const [about, setAbout] = useState('');
  const [aboutLoaded, setAboutLoaded] = useState(false);
  const { t } = useTranslation('about');

  const displayAbout = useCallback(async () => {
    setAbout(localStorage.getItem('about') || '');
    try {
      const res = await API.get('/api/about');
      const { success, message, data } = res.data;
      if (success) {
        let aboutContent = data;
        if (!data.startsWith('https://')) {
          aboutContent = marked.parse(data);
        }
        setAbout(aboutContent);
        localStorage.setItem('about', aboutContent);
      } else {
        showError(message);
        setAbout(t('error.content'));
      }
    } catch (error) {
      setAbout(t('error.content'));
    }

    setAboutLoaded(true);
  }, [t]);

  useEffect(() => {
    displayAbout().then();
  }, [displayAbout]);

  return (
    <>
      {aboutLoaded && about === '' ? (
        <>
          <Box>
            <Container sx={{ paddingTop: '40px' }}>
              <MainCard title="关于">
                <Typography variant="body2">
                  {t('body1')} <br />
                  {t('body2')}
                  <a href="https://github.com/MartialBE/one-api">https://github.com/MartialBE/one-api</a>
                </Typography>
              </MainCard>
            </Container>
          </Box>
        </>
      ) : (
        <>
          <Box>
            {about.startsWith('https://') ? (
              <iframe title="about" src={about} style={{ width: '100%', height: '100vh', border: 'none' }} />
            ) : (
              <>
                <Container>
                  <div style={{ fontSize: 'larger' }} dangerouslySetInnerHTML={{ __html: about }}></div>
                </Container>
              </>
            )}
          </Box>
        </>
      )}
    </>
  );
};

export default About;
