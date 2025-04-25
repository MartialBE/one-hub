import React, { useEffect, useState, useCallback } from 'react';
import { API } from 'utils/api';
import { showError } from 'utils/common';
import { Box, Container, Typography } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import { useTranslation } from 'react-i18next';
import ContentViewer from 'ui-component/ContentViewer';

const About = () => {
  const { t } = useTranslation();
  const [about, setAbout] = useState('');
  const [aboutLoaded, setAboutLoaded] = useState(false);

  const displayAbout = useCallback(async () => {
    setAbout(localStorage.getItem('about') || '');
    try {
      const res = await API.get('/api/about');
      const { success, message, data } = res.data;
      if (success) {
        setAbout(data);
        localStorage.setItem('about', data);
      } else {
        showError(message);
        setAbout(t('about.loadingError'));
      }
    } catch (error) {
      setAbout(t('about.loadingError'));
    }

    setAboutLoaded(true);
  }, [t]);

  useEffect(() => {
    displayAbout();
  }, [displayAbout]);

  return (
    <>
      {aboutLoaded && about === '' ? (
        <Box>
          <Container sx={{ paddingTop: '40px' }}>
            <MainCard title={t('about.aboutTitle')}>
              <Typography variant="body2">
                {t('about.aboutDescription')} <br />
                {t('about.projectRepo')}
                <a href="https://github.com/MartialBE/one-hub">https://github.com/MartialBE/one-hub</a>
              </Typography>
            </MainCard>
          </Container>
        </Box>
      ) : (
        <Box>
          <ContentViewer
            content={about}
            loading={!aboutLoaded}
            errorMessage={about === t('about.loadingError') ? t('about.loadingError') : ''}
            containerStyle={{ minHeight: 'calc(100vh - 136px)' }}
            contentStyle={{ fontSize: 'larger' }}
          />
        </Box>
      )}
    </>
  );
};

export default About;
