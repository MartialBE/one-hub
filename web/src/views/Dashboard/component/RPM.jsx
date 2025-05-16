import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
// material-ui
import { useTheme, styled } from '@mui/material/styles';
import { Box, Grid, Typography, IconButton, LinearProgress } from '@mui/material';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SkeletonTotalOrderCard from 'ui-component/cards/Skeleton/EarningCard';
import { useTranslation } from 'react-i18next';
import { API } from 'utils/api';
import { showError } from 'utils/common';
import RefreshIcon from '@mui/icons-material/Refresh';

const CardWrapper = styled(MainCard)(({ theme }) => ({
  borderRadius: '16px',
  border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
  boxShadow: theme.palette.mode === 'dark' ? 'none' : '0px 1px 3px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  height: '100px'
}));

// ==============================|| RPM - REQUEST RATE LIMIT CARD ||============================== //

const RPM = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [rateData, setRateData] = useState({ rpm: 0, maxRPM: 0, tpm: 0, maxTPM: 0, usageRpmRate: 0, usageTpmRate: 0 });
  const [localLoading, setLocalLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const fetchRPMData = async () => {
    setLocalLoading(true);
    try {
      const res = await API.get('/api/user/dashboard/rate');
      const { success, message, data } = res.data;
      if (success && data) {
        setRateData({
          rpm: data.rpm || 0,
          maxRPM: data.maxRPM || 0,
          tpm: data.tpm || 0,
          maxTPM: data.maxTPM || 0,
          usageRpmRate: data.usageRpmRate || 0,
          usageTpmRate: data.usageTpmRate || 0
        });
      } else {
        showError(message);
      }
    } catch (error) {
      console.error('Error fetching RPM data:', error);
    } finally {
      setLocalLoading(false);
      setInitialLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchRPMData();
    // const interval = setInterval(() => {
    //   fetchRPMData();
    // }, 30000); // 30秒刷新一次
    // return () => clearInterval(interval);
  }, []);

  return (
    <>
      {initialLoading ? (
        <SkeletonTotalOrderCard />
      ) : (
        <CardWrapper border={false} content={false} sx={{ height: '100%' }}>
          <Box
            sx={{
              p: 2.5,
              height: '100%',
              position: 'relative'
            }}
          >
            <Grid container alignItems="center" spacing={2} sx={{ height: '100%' }}>
              <Grid item xs>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontSize: '24px',
                      fontWeight: 500,
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.87)',
                      mb: 0.5
                    }}
                  >
                    {rateData.rpm} RPM
                  </Typography>
                  <IconButton
                    onClick={fetchRPMData}
                    disabled={localLoading}
                    size="small"
                    sx={{
                      p: 0.5,
                      '&:hover': {
                        backgroundColor: 'transparent'
                      }
                    }}
                  >
                    <RefreshIcon
                      fontSize="small"
                      sx={{
                        color: localLoading ? theme.palette.primary.main : theme.palette.text.secondary,
                        animation: localLoading ? 'spin 1s linear infinite' : 'none',
                        '@keyframes spin': {
                          '0%': {
                            transform: 'rotate(0deg)'
                          },
                          '100%': {
                            transform: 'rotate(360deg)'
                          }
                        }
                      }}
                    />
                  </IconButton>
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '13px',
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
                  }}
                >
                  {t('dashboard_index.RPM')}
                </Typography>
                <LinearProgress
                  variant="buffer"
                  value={rateData.usageRpmRate > 100 ? 100 : rateData.usageRpmRate}
                  valueBuffer={100}
                  color={rateData.usageRpmRate > 80 ? 'error' : rateData.usageRpmRate > 50 ? 'warning' : 'success'}
                  sx={{
                    mt: 1.5,
                    mb: 1.5
                  }}
                />
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mt: 0.5
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: rateData.usageRpmRate > 80 ? 'error.main' : rateData.usageRpmRate > 50 ? 'warning.main' : 'success.main',
                      fontSize: '14px'
                    }}
                  >
                    <Box component="span" sx={{ ml: 0.5, fontSize: '14px' }}>
                      {t('dashboard_index.usage')}
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        mr: 1,
                        ml: 1,
                        display: 'inline-flex'
                      }}
                    ></Box>
                    {`${rateData.usageRpmRate}%`}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardWrapper>
      )}
    </>
  );
};

RPM.propTypes = {
  title: PropTypes.string
};

export default RPM;
