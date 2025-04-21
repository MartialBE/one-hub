import React from 'react';
import PropTypes from 'prop-types';
import ReactApexChart from 'react-apexcharts';
import { Grid, Typography } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

import {
  red,
  pink,
  purple,
  deepPurple,
  indigo,
  blue,
  lightBlue,
  cyan,
  teal,
  green,
  lightGreen,
  lime,
  yellow,
  amber,
  orange,
  deepOrange,
  brown,
  grey,
  blueGrey
} from '@mui/material/colors';

const ModelUsagePieChart = ({ isLoading, data }) => {
  const { t } = useTranslation();

  const chartData = {
    options: {
      chart: {
        type: 'pie',
        height: '100%'
      },
      labels: data.map((item) => item.name),
      colors: [
        red[500],
        pink[500],
        purple[500],
        deepPurple[500],
        indigo[500],
        blue[500],
        lightBlue[500],
        cyan[500],
        teal[500],
        green[500],
        lightGreen[500],
        lime[500],
        yellow[500],
        amber[500],
        orange[500],
        deepOrange[500],
        brown[500],
        grey[500],
        blueGrey[500],
        red[300],
        pink[300],
        purple[300],
        deepPurple[300],
        indigo[300],
        blue[300],
        lightBlue[300],
        cyan[300],
        teal[300],
        green[300],
        red[700],
        pink[700],
        purple[700],
        deepPurple[700],
        indigo[700],
        blue[700],
        lightBlue[700],
        cyan[700],
        teal[700],
        green[700],
        lightGreen[700],
        lime[700],
        yellow[700],
        amber[700],
        orange[700],
        deepOrange[700],
        brown[700],
        grey[700],
        blueGrey[700]
      ],
      legend: {
        show: true,
        fontSize: '14px',
        position: 'bottom',
        offsetY: 5,
        labels: {
          useSeriesColors: false
        },
        markers: {
          width: 12,
          height: 12,
          radius: 5
        },
        itemMargin: {
          horizontal: 10,
          vertical: 3
        }
      },
      stroke: {
        width: 0 // 将线条宽度设置为 0，effectively 禁用了饼块之间的白线
      },
      plotOptions: {
        pie: {
          donut: {
            size: '0%' // 可以调整这个值来改变饼图中心空洞的大小
          }
        }
      },
      responsive: [
        {
          breakpoint: 490,
          options: {
            chart: {
              height: 490
            },
            legend: {
              position: 'bottom',
              fontSize: '10px'
            }
          }
        }
      ]
    },
    series: data.map((item) => item.value)
  };

  return (
    <>
      {isLoading ? (
        <MainCard>
          <Box sx={{ pt: 3, px: 2 }}>
            <Typography>Loading...</Typography>
          </Box>
        </MainCard>
      ) : (
        <MainCard>
          <Grid container spacing={gridSpacing}>
            <Grid item xs={12}>
              <Typography variant="h3" sx={{ mb: 2 }}>
                {t('dashboard_index.7days_model_usage_pie')}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              {data.length > 0 ? (
                <ReactApexChart options={chartData.options} series={chartData.series} type="pie" height={500} />
              ) : (
                <Box
                  sx={{
                    height: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="h3" color={'#697586'}>
                    {t('dashboard_index.no_data_available')}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </MainCard>
      )}
    </>
  );
};

ModelUsagePieChart.propTypes = {
  isLoading: PropTypes.bool,
  data: PropTypes.array
};

export default ModelUsagePieChart;
