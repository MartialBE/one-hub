import React from 'react';
import PropTypes from 'prop-types';
import ReactApexChart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import { useTranslation } from 'react-i18next';

const ModelUsagePieChart = ({ isLoading, data }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const options = {
    chart: {
      type: 'pie',
    },
    labels: data.map(item => item.name),
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }],
    colors: [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
    ],
    legend: {
      show: true,
      fontSize: '14px',
    //   fontFamily: `'Roboto', sans-serif`,
      position: 'bottom',
      offsetX: 10,
      offsetY: 10,
      labels: {
        useSeriesColors: false,
      },
      markers: {
        width: 16,
        height: 16,
        radius: 5,
      },
      itemMargin: {
        horizontal: 15,
        vertical: 8
      }
    },
  };

  const series = data.map(item => item.value);

  return (
    //调整饼图高度
    <MainCard sx={{ height: '100%', minHeight: '350px', display: 'flex', flexDirection: 'column' }}> 
      <Typography variant="h3" sx={{ mb: 2 }}>{t('dashboard_index.7days_model_usage_pie')}</Typography>
      {isLoading ? (
        <Box sx={{ pt: 3, px: 2 }}>
          <Typography>Loading...</Typography>
        </Box>
      ) : data.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h3" color="#697586">
            {t('dashboard_index.no_data_available')}
          </Typography>
        </Box>
      ) : (
        <ReactApexChart options={options} series={series} type="pie" />
      )}
    </MainCard>
  );
};

ModelUsagePieChart.propTypes = {
  isLoading: PropTypes.bool,
  data: PropTypes.array
};

export default ModelUsagePieChart;
