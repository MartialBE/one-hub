import React from 'react';
import PropTypes from 'prop-types';
import ReactApexChart from 'react-apexcharts';
import { Grid, Typography, useTheme, Box, Paper, alpha } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';
import { useTranslation } from 'react-i18next';

const ModelUsagePieChart = ({ isLoading, data }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // 创建具有渐变色效果的调色板
  const generateColors = () => {
    const baseColors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
      '#9c27b0', // 紫色
      '#00bcd4', // 青色
      '#607d8b', // 蓝灰色
      '#ff9800' // 橙色
    ];

    // 为每个基础颜色生成亮色和暗色变体
    const allColors = [];
    baseColors.forEach((color) => {
      allColors.push(color);
      allColors.push(alpha(color, 0.7));
      allColors.push(alpha(color, 0.4));
    });

    return allColors;
  };

  const chartData = {
    options: {
      chart: {
        type: 'donut',
        fontFamily: theme.typography.fontFamily,
        background: 'transparent',
        toolbar: {
          show: false
        }
      },
      labels: data.map((item) => item.name),
      colors: generateColors(),
      dataLabels: {
        enabled: false
      },
      legend: {
        show: true,
        fontSize: '14px',
        position: 'bottom',
        offsetY: 10,
        labels: {
          colors: theme.palette.text.primary
        },
        markers: {
          width: 10,
          height: 10,
          radius: 5
        },
        itemMargin: {
          horizontal: 12,
          vertical: 5
        },
        formatter: function (seriesName, opts) {
          return [seriesName, ' - ', opts.w.globals.series[opts.seriesIndex]];
        }
      },
      stroke: {
        width: 0,
        colors: [theme.palette.background.paper]
      },
      tooltip: {
        theme: theme.palette.mode,
        style: {
          fontSize: '14px',
          fontFamily: theme.typography.fontFamily
        },
        y: {
          formatter: function (value) {
            return value.toLocaleString();
          }
        },
        custom: ({ seriesIndex, w }) => {
          const name = w.globals.labels[seriesIndex];
          const value = w.globals.series[seriesIndex];
          return `<div class="custom-tooltip" style="padding: 8px; color: ${theme.palette.text.primary}; background: ${theme.palette.background.paper}; box-shadow: ${theme.shadows[3]}; border-radius: 4px; border: none;">
                    <span>${name}: <b>${value.toLocaleString()}</b></span>
                  </div>`;
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '60%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '16px',
                fontWeight: 600,
                color: theme.palette.text.primary
              },
              value: {
                show: true,
                fontSize: '22px',
                fontWeight: 600,
                color: theme.palette.text.primary,
                formatter: function (val) {
                  return val.toLocaleString();
                }
              },
              total: {
                show: true,
                label: t('dashboard_index.total'),
                fontSize: '14px',
                fontWeight: 400,
                color: theme.palette.text.secondary,
                formatter: function (w) {
                  return w.globals.seriesTotals.reduce((a, b) => a + b, 0).toLocaleString();
                }
              }
            }
          }
        }
      },
      states: {
        hover: {
          filter: {
            type: 'none'
          }
        },
        active: {
          filter: {
            type: 'none'
          }
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 400
            },
            legend: {
              position: 'bottom',
              fontSize: '12px'
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
        <MainCard
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.2)' : '0 8px 24px rgba(0,0,0,0.05)'
          }}
        >
          <Grid container spacing={gridSpacing}>
            <Grid item xs={12}>
              <Typography
                variant="h3"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  fontSize: '1.25rem',
                  letterSpacing: '0.015em'
                }}
              >
                {t('dashboard_index.7days_model_usage_pie')}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              {data.length > 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: 'transparent',
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    p: 2
                  }}
                >
                  <ReactApexChart options={chartData.options} series={chartData.series} type="donut" height={500} />
                </Paper>
              ) : (
                <Box
                  sx={{
                    height: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    bgcolor: alpha(theme.palette.primary.light, 0.05)
                  }}
                >
                  <Typography
                    variant="h3"
                    color={theme.palette.text.secondary}
                    sx={{
                      fontWeight: 500,
                      opacity: 0.7
                    }}
                  >
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
