import { useEffect, useState, useContext } from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { gridSpacing } from 'store/constant';
import StatisticalLineChartCard from './component/StatisticalLineChartCard';
import ApexCharts from 'ui-component/chart/ApexCharts';
import SupportModels from './component/SupportModels';
import { getLastSevenDays, generateBarChartOptions, renderChartNumber } from 'utils/chart';
import { API } from 'utils/api';
import { showError, calculateQuota } from 'utils/common';
import UserCard from 'ui-component/cards/UserCard';
import { useTranslation } from 'react-i18next';
import { UserContext } from 'contexts/UserContext';
import Label from 'ui-component/Label';
import InviteCard from './component/InviteCard';
import QuotaLogWeek from './component/QuotaLogWeek';
import QuickStartCard from './component/QuickStartCard';
import RPM from './component/RPM';

const Dashboard = () => {
  const [isLoading, setLoading] = useState(true);
  const [statisticalData, setStatisticalData] = useState([]);
  const [requestChart, setRequestChart] = useState(null);
  const [quotaChart, setQuotaChart] = useState(null);
  const [tokenChart, setTokenChart] = useState(null);
  const [users, setUsers] = useState([]);
  const { t } = useTranslation();
  const { userGroup } = useContext(UserContext);

  const userDashboard = async () => {
    try {
      const res = await API.get('/api/user/dashboard');
      const { success, message, data } = res.data;
      if (success) {
        if (data) {
          let lineData = getLineDataGroup(data);
          setRequestChart(getLineCardOption(lineData, 'RequestCount'));
          setQuotaChart(getLineCardOption(lineData, 'Quota'));
          setTokenChart(getLineCardOption(lineData, 'PromptTokens'));
          setStatisticalData(getBarDataGroup(data));
        }
      } else {
        showError(message);
      }
      setLoading(false);
    } catch (error) {
      return;
    }
  };

  const loadUser = async () => {
    try {
      let res = await API.get(`/api/user/self`);
      const { success, message, data } = res.data;
      if (success) {
        setUsers(data);
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  useEffect(() => {
    userDashboard();
    loadUser();
  }, []);

  return (
    <Grid container spacing={gridSpacing}>
      {/* 支持的模型   */}
      <Grid item xs={12}>
        <SupportModels />
      </Grid>
      {/* 今日请求、消费、token */}
      <Grid item xs={12}>
        <Grid container spacing={gridSpacing}>
          <Grid item lg={3} xs={12} sx={{ height: '160' }}>
            <StatisticalLineChartCard
              isLoading={isLoading}
              title={t('dashboard_index.today_requests')}
              type="request"
              chartData={requestChart?.chartData}
              todayValue={requestChart?.todayValue}
              lastDayValue={requestChart?.lastDayValue}
            />
          </Grid>
          <Grid item lg={3} xs={12} sx={{ height: '160' }}>
            <StatisticalLineChartCard
              isLoading={isLoading}
              title={t('dashboard_index.today_consumption')}
              type="quota"
              chartData={quotaChart?.chartData}
              todayValue={quotaChart?.todayValue}
              lastDayValue={quotaChart?.lastDayValue}
            />
          </Grid>
          <Grid item lg={3} xs={12} sx={{ height: '160' }}>
            <StatisticalLineChartCard
              isLoading={isLoading}
              title={t('dashboard_index.today_tokens')}
              type="token"
              chartData={tokenChart?.chartData}
              todayValue={tokenChart?.todayValue}
              lastDayValue={tokenChart?.lastDayValue}
            />
          </Grid>
          <Grid item lg={3} xs={12} sx={{ height: '160' }}>
            <RPM />
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Grid container spacing={gridSpacing}>
          <Grid item lg={8} xs={12}>
            {/* 7日模型消费统计 */}
            <ApexCharts isLoading={isLoading} chartDatas={statisticalData} title={t('dashboard_index.week_model_statistics')} />
            <Box mt={2}>
              {/* 7日消费统计 */}
              <QuotaLogWeek />
            </Box>
          </Grid>

          <Grid item lg={4} xs={12}>
            {/* 用户信息 */}
            <UserCard>
              <Box
                sx={{
                  pt: 4,
                  pb: 4,
                  px: 3,
                  textAlign: 'center'
                }}
              >
                <Typography variant="h4" sx={{ mb: 0.5 }}>
                  {users.username}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {users.email}
                </Typography>

                <Label color={'primary'} variant="outlined" sx={{ mb: 3 }}>
                  {userGroup?.[users.group]?.name || users.group}
                  (RPM:{userGroup?.[users.group]?.api_rate || 0})
                </Label>

                {/* 统计信息区域 */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2.5
                  }}
                >
                  {[
                    {
                      label: t('dashboard_index.balance'),
                      value: users?.quota ? '$' + calculateQuota(users.quota) : t('dashboard_index.unknown')
                    },
                    {
                      label: t('dashboard_index.used'),
                      value: users?.used_quota ? '$' + calculateQuota(users.used_quota) : t('dashboard_index.unknown')
                    },
                    { label: t('dashboard_index.calls'), value: users?.request_count || t('dashboard_index.unknown') }
                  ].map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        px: 2,
                        py: 1.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(145, 158, 171, 0.08)',
                        '&:hover': {
                          bgcolor: 'rgba(145, 158, 171, 0.12)'
                        }
                      }}
                    >
                      <Typography variant="body2">{item.label}</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </UserCard>
            <Box mt={2}>
              <QuickStartCard />
            </Box>
            {/* 邀请 */}
            <Box mt={2}>
              <InviteCard />
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};
export default Dashboard;

function getLineDataGroup(statisticalData) {
  let groupedData = statisticalData.reduce((acc, cur) => {
    if (!acc[cur.Date]) {
      acc[cur.Date] = {
        date: cur.Date,
        RequestCount: 0,
        Quota: 0,
        PromptTokens: 0,
        CompletionTokens: 0
      };
    }
    acc[cur.Date].RequestCount += cur.RequestCount;
    acc[cur.Date].Quota += cur.Quota;
    acc[cur.Date].PromptTokens += cur.PromptTokens;
    acc[cur.Date].CompletionTokens += cur.CompletionTokens;
    return acc;
  }, {});
  let lastSevenDays = getLastSevenDays();
  return lastSevenDays.map((Date) => {
    if (!groupedData[Date]) {
      return {
        date: Date,
        RequestCount: 0,
        Quota: 0,
        PromptTokens: 0,
        CompletionTokens: 0
      };
    } else {
      return groupedData[Date];
    }
  });
}

function getBarDataGroup(data) {
  const lastSevenDays = getLastSevenDays();
  const result = [];
  const map = new Map();
  let totalCosts = 0;

  for (const item of data) {
    if (!map.has(item.ModelName)) {
      const newData = { name: item.ModelName, data: new Array(7).fill(0) };
      map.set(item.ModelName, newData);
      result.push(newData);
    }
    const index = lastSevenDays.indexOf(item.Date);
    if (index !== -1) {
      let costs = Number(calculateQuota(item.Quota, 3));
      map.get(item.ModelName).data[index] = costs;
      totalCosts += parseFloat(costs.toFixed(3));
    }
  }

  let chartData = generateBarChartOptions(lastSevenDays, result, '美元', 3);
  chartData.options.title.text = '7日总消费：$' + renderChartNumber(totalCosts, 3);

  return chartData;
}

function getLineCardOption(lineDataGroup, field) {
  let todayValue = 0;
  let lastDayValue = 0;
  let chartData = null;

  let lineData = lineDataGroup.map((item) => {
    let tmp = {
      x: item.date,
      y: item[field]
    };
    switch (field) {
      case 'Quota':
        tmp.y = calculateQuota(item.Quota, 3);
        break;
      case 'PromptTokens':
        tmp.y += item.CompletionTokens;
        break;
    }

    return tmp;
  });

  // 获取今天和昨天的数据
  if (lineData.length > 1) {
    todayValue = lineData[lineData.length - 1].y;
    if (lineData.length > 2) {
      lastDayValue = lineData[lineData.length - 2].y;
    }
  }

  switch (field) {
    case 'RequestCount':
      // chartData = generateLineChartOptions(lineData, '次');
      lastDayValue = parseFloat(lastDayValue);
      todayValue = parseFloat(todayValue);
      break;
    case 'Quota':
      // chartData = generateLineChartOptions(lineData, '美元');
      lastDayValue = parseFloat(lastDayValue);
      todayValue = '$' + parseFloat(todayValue);
      break;
    case 'PromptTokens':
      // chartData = generateLineChartOptions(lineData, '');
      lastDayValue = parseFloat(lastDayValue);
      todayValue = parseFloat(todayValue);
      break;
  }

  chartData = {
    series: [
      {
        data: lineData
      }
    ]
  };

  return { chartData: chartData, todayValue: todayValue, lastDayValue: lastDayValue };
}
