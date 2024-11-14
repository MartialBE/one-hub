import PropTypes from 'prop-types';

// material-ui
import { useTheme, styled } from '@mui/material/styles';
import { Box, Grid, Typography } from '@mui/material';

// third-party
import Chart from 'react-apexcharts';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SkeletonTotalOrderCard from 'ui-component/cards/Skeleton/EarningCard';

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

const StatisticalLineChartCard = ({ isLoading, title, chartData, todayValue, type = 'default' }) => {
  const theme = useTheme();

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
        <CardWrapper border={false} content={false}>
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
                  {todayValue || '0'}
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
              </Grid>

              <Grid item xs={6}>
                <Box
                  sx={{
                    height: '60px',
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
  type: PropTypes.string
};

export default StatisticalLineChartCard;
