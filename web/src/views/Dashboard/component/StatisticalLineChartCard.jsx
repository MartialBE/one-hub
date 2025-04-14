import PropTypes from 'prop-types';
// material-ui
import { useTheme, styled } from '@mui/material/styles';
import { Box, Grid, Typography, Divider } from '@mui/material';

// third-party
import Chart from 'react-apexcharts';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SkeletonTotalOrderCard from 'ui-component/cards/Skeleton/EarningCard';
import { useTranslation } from 'react-i18next';
import { IconTrendingDown, IconTrendingUp, IconEqual } from '@tabler/icons-react';
import { renderNumber } from 'utils/common';
const CardWrapper = styled(MainCard)(({ theme }) => ({
  borderRadius: '16px',
  border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
  boxShadow: theme.palette.mode === 'dark' ? 'none' : '0px 1px 3px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  height: '100px'
}));

const getChartOptions = (theme, type = 'default') => {
  const getChartColor = () => {
    switch (type) {
      case 'request':
        return '#60A5FA'; // 浅蓝色
      case 'quota':
        return '#FBBF24'; // 黄色
      case 'token':
        return '#F87171'; // 红色
      default:
        return '#60A5FA';
    }
  };

  return {
    chart: {
      type: 'line',
      toolbar: {
        show: false
      },
      sparkline: {
        enabled: true
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2,
      lineCap: 'round'
    },
    grid: {
      show: false
    },
    xaxis: {
      type: 'category',
      labels: {
        show: false
      }
    },
    yaxis: {
      show: false,
      padding: {
        top: 2,
        bottom: 2
      }
    },
    colors: [getChartColor()],
    tooltip: {
      enabled: true,
      theme: theme.palette.mode,
      style: {
        fontSize: '12px',
        fontFamily: theme.typography.fontFamily
      },
      x: {
        show: true,
        format: 'yyyy-MM-dd'
      },
      y: {
        title: {
          formatter: () => ''
        }
      },
      marker: {
        show: false
      }
    },
    markers: {
      size: 0,
      hover: {
        size: 3,
        sizeOffset: 1
      }
    }
  };
};

// ==============================|| DASHBOARD - TOTAL ORDER LINE CHART CARD ||============================== //

const StatisticalLineChartCard = ({ isLoading, title, chartData, todayValue, lastDayValue, type = 'default' }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const customChartData = chartData
    ? {
        ...chartData,
        options: {
          ...getChartOptions(theme, type),
          chart: {
            ...getChartOptions(theme, type).chart,
            sparkline: {
              enabled: true
            },
            parentHeightOffset: 0,
            toolbar: {
              show: false
            },
            padding: {
              right: 15
            }
          }
        }
      }
    : null;

  return (
    <>
      {isLoading ? (
        <SkeletonTotalOrderCard />
      ) : (
        <CardWrapper border={false} content={false} sx={{ height: '100%' }}>
          <Box
            sx={{
              p: 2.5,
              height: '100%'
            }}
          >
            <Grid container alignItems="center" spacing={2} sx={{ height: '100%' }}>
              <Grid item xs>
                <Typography
                  variant="h3"
                  sx={{
                    fontSize: '24px',
                    fontWeight: 500,
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.87)',
                    mb: 0.5
                  }}
                >
                  {renderNumber(todayValue || 0)}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '13px',
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
                  }}
                >
                  {title}
                </Typography>
                <Divider sx={{ mt: 1.5, mb: 1.5 }} />
                {lastDayValue !== undefined && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mt: 0.5
                    }}
                  >
                    {(() => {
                      // 去除美元符号进行数值比较
                      const todayValueNum = parseFloat((todayValue || '0').toString().replace('$', ''));
                      const lastDayValueNum = parseFloat((lastDayValue || '0').toString().replace('$', ''));

                      // 计算变化百分比
                      const getPercentChange = () => {
                        if (todayValueNum === 0 && lastDayValueNum === 0) return 0;
                        if (todayValueNum === 0 && lastDayValueNum > 0) return -100;
                        if (todayValueNum > 0 && lastDayValueNum === 0) return 100;
                        return Math.round(((todayValueNum - lastDayValueNum) / lastDayValueNum) * 100);
                      };


                      const percentChange = getPercentChange();
                      const isIncrease = percentChange >= 0;
                      let color = isIncrease ? 'error.main' : 'success.main';
                      let Icon = isIncrease ? IconTrendingUp : IconTrendingDown;
                      if (percentChange === 0) {
                        color = 'info.main';
                        Icon = IconEqual;
                      }

                      return (
                        <Typography
                          component="span"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color,
                            fontSize: '14px'
                          }}
                        >
                          <Box component="span" sx={{ ml: 0.5, color: color, fontSize: '14px' }}>
                            {t('dashboard_index.ComparedWithYesterday')}
                          </Box>
                          <Box
                            component="span"
                            sx={{
                              mr: 1,
                              ml: 1,
                              display: 'inline-flex'
                            }}
                          >
                            <Icon />
                          </Box>
                          {`${Math.abs(percentChange)}%`}
                        </Typography>
                      );
                    })()}
                  </Box>
                )}
              </Grid>

              <Grid item xs={6}>
                <Box
                  sx={{
                    height: '70px',
                    position: 'relative',
                    mr: 1
                  }}
                >
                  {customChartData && <Chart {...customChartData} height="100%" width="100%" />}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardWrapper>
      )}
    </>
  );
};

StatisticalLineChartCard.propTypes = {
  isLoading: PropTypes.bool,
  title: PropTypes.string,
  chartData: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  todayValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lastDayValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  type: PropTypes.string
};

export default StatisticalLineChartCard;
