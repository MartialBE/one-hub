import { useState, useEffect } from 'react';
import { Grid, Typography, Divider, Box, TextField, Button, Select, MenuItem } from '@mui/material';
import { gridSpacing } from 'store/constant';
import DateRangePicker from 'ui-component/DateRangePicker';
import ApexCharts from 'ui-component/chart/ApexCharts';
import { showError, calculateQuota } from 'utils/common';
import dayjs from 'dayjs';
import { API } from 'utils/api';
import { generateBarChartOptions, renderChartNumber } from 'utils/chart';
import { useTranslation } from 'react-i18next';

export default function Overview() {
  const { t } = useTranslation();
  const [channelLoading, setChannelLoading] = useState(true);
  const [redemptionLoading, setRedemptionLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [channelData, setChannelData] = useState([]);
  const [redemptionData, setRedemptionData] = useState([]);
  const [orderData, setOrderData] = useState([]);
  const [orderLoading, setOrderLoading] = useState(true);
  const [usersData, setUsersData] = useState([]);
  const [dateRange, setDateRange] = useState({ start: dayjs().subtract(6, 'day').startOf('day'), end: dayjs().endOf('day') });

  const [groupType, setGroupType] = useState('model_type');
  const [userId, setUserId] = useState(0);

  const handleSearch = () => {
    fetchData(dateRange, groupType, userId);
  };

  const handleDateRangeChange = (value) => {
    setDateRange(value);
  };

  const fetchData = async (date, gType, uId) => {
    setUsersLoading(true);
    setChannelLoading(true);
    setRedemptionLoading(true);
    setOrderLoading(true);
    try {
      const res = await API.get('/api/analytics/period', {
        params: {
          start_timestamp: date.start.unix(),
          end_timestamp: date.end.unix(),
          group_type: gType,
          user_id: uId
        }
      });
      const { success, message, data } = res.data;
      if (success) {
        if (data) {
          setUsersData(getUsersData(data?.user_statistics, date));

          setChannelData(getBarChartOptions(data?.channel_statistics, date));

          setRedemptionData(getRedemptionData(data?.redemption_statistics, date));

          setOrderData(getOrdersData(data?.order_statistics, date));
        }
      } else {
        showError(message);
      }
      setUsersLoading(false);
      setChannelLoading(false);
      setRedemptionLoading(false);
      setOrderLoading(false);
    } catch (error) {
      console.log(error);
      return;
    }
  };

  useEffect(() => {
    fetchData(dateRange, groupType, userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Grid container spacing={gridSpacing}>
      <Grid lg={12} xs={12}>
        <Box sx={{ display: 'flex', gap: 2, m: 3 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <DateRangePicker
                defaultValue={dateRange}
                onChange={handleDateRangeChange}
                localeText={{ start: '开始时间', end: '结束时间' }}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Select value={groupType} onChange={(e) => setGroupType(e.target.value)} fullWidth>
                <MenuItem value="model_type">Model Type</MenuItem>
                <MenuItem value="model">Model</MenuItem>
                <MenuItem value="channel">Channel</MenuItem>
              </Select>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField type="number" label="用户ID" value={userId} onChange={(e) => setUserId(Number(e.target.value))} fullWidth />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Button variant="contained" onClick={handleSearch} fullWidth>
                搜索
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h3">
          {dateRange.start.format('YYYY-MM-DD')} - {dateRange.end.format('YYYY-MM-DD')}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Divider />
      </Grid>
      <Grid item xs={12}>
        <ApexCharts
          id="cost"
          isLoading={channelLoading}
          chartDatas={channelData?.costs || {}}
          title={t('analytics_index.consumptionStatistics')}
          decimal={3}
        />
      </Grid>
      <Grid item xs={12}>
        <ApexCharts
          id="token"
          isLoading={channelLoading}
          chartDatas={channelData?.tokens || {}}
          title={t('analytics_index.tokensStatistics')}
          unit=""
        />
      </Grid>
      {/* <Grid item xs={12}>
        <ApexCharts
          id="latency"
          isLoading={channelLoading}
          chartDatas={channelData?.latency || {}}
          title={t('analytics_index.averageLatency')}
          unit=""
        />
      </Grid> */}
      <Grid item xs={12}>
        <ApexCharts
          id="requests"
          isLoading={channelLoading}
          chartDatas={channelData?.requests || {}}
          title={t('analytics_index.requestsCount')}
          unit=""
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <ApexCharts isLoading={redemptionLoading} chartDatas={redemptionData} title={t('analytics_index.redemptionStatistics')} />
      </Grid>
      <Grid item xs={12} md={6}>
        <ApexCharts isLoading={usersLoading} chartDatas={usersData} title={t('analytics_index.registrationStatistics')} />
      </Grid>

      <Grid item xs={12} md={6}>
        <ApexCharts isLoading={orderLoading} chartDatas={orderData} title="充值" />
      </Grid>
    </Grid>
  );
}

function getDates(start, end) {
  var dates = [];
  var current = start;

  while (current.isBefore(end) || current.isSame(end)) {
    dates.push(current.format('YYYY-MM-DD'));
    current = current.add(1, 'day');
  }

  return dates;
}

function calculateDailyData(item, dateMap) {
  const index = dateMap.get(item.Date);
  if (index === undefined) return null;

  return {
    name: item.Channel,
    costs: calculateQuota(item.Quota, 3),
    tokens: item.PromptTokens + item.CompletionTokens,
    requests: item.RequestCount,
    latency: Number(item.RequestTime / 1000 / item.RequestCount).toFixed(3),
    index: index
  };
}

function getBarDataGroup(data, dates) {
  const dateMap = new Map(dates.map((date, index) => [date, index]));

  const result = {
    costs: { total: 0, data: new Map() },
    tokens: { total: 0, data: new Map() },
    requests: { total: 0, data: new Map() },
    latency: { total: 0, data: new Map() }
  };

  for (const item of data) {
    const dailyData = calculateDailyData(item, dateMap);
    if (!dailyData) continue;

    for (let key in result) {
      if (!result[key].data.has(dailyData.name)) {
        result[key].data.set(dailyData.name, { name: dailyData.name, data: new Array(dates.length).fill(0) });
      }
      const channelDailyData = result[key].data.get(dailyData.name);
      channelDailyData.data[dailyData.index] = dailyData[key];
      result[key].total += Number(dailyData[key]);
    }
  }
  return result;
}

function getBarChartOptions(data, dateRange) {
  if (!data) return null;

  const dates = getDates(dateRange.start, dateRange.end);
  const result = getBarDataGroup(data, dates);

  let channelData = {};

  channelData.costs = generateBarChartOptions(dates, Array.from(result.costs.data.values()), '美元', 3);
  channelData.costs.options.title.text = '总消费：$' + renderChartNumber(result.costs.total, 3);

  channelData.tokens = generateBarChartOptions(dates, Array.from(result.tokens.data.values()), '', 0);
  channelData.tokens.options.title.text = '总Tokens：' + renderChartNumber(result.tokens.total, 0);

  channelData.requests = generateBarChartOptions(dates, Array.from(result.requests.data.values()), '次', 0);
  channelData.requests.options.title.text = '总请求数：' + renderChartNumber(result.requests.total, 0);

  // 获取每天所有渠道的平均延迟
  let latency = Array.from(result.latency.data.values());
  let sums = [];
  let counts = [];
  for (let obj of latency) {
    for (let i = 0; i < obj.data.length; i++) {
      let value = parseFloat(obj.data[i]);
      sums[i] = sums[i] || 0;
      counts[i] = counts[i] || 0;
      if (value !== 0) {
        sums[i] = (sums[i] || 0) + value;
        counts[i] = (counts[i] || 0) + 1;
      }
    }
  }

  // 追加latency列表后面
  latency[latency.length] = {
    name: '平均延迟',
    data: sums.map((sum, i) => Number(counts[i] ? sum / counts[i] : 0).toFixed(3))
  };

  let dashArray = new Array(latency.length - 1).fill(0);
  dashArray.push(5);

  channelData.latency = generateBarChartOptions(dates, latency, '秒', 3);
  channelData.latency.type = 'line';
  channelData.latency.options.chart = {
    type: 'line',
    zoom: {
      enabled: false
    },
    background: 'transparent'
  };
  channelData.latency.options.stroke = {
    curve: 'smooth',
    dashArray: dashArray
  };

  return channelData;
}

function getRedemptionData(data, dateRange) {
  if (!data) return null;

  const dates = getDates(dateRange.start, dateRange.end);
  const result = [
    {
      name: '兑换金额($)',
      type: 'column',
      data: new Array(dates.length).fill(0)
    },
    {
      name: '独立用户(人)',
      type: 'line',
      data: new Array(dates.length).fill(0)
    }
  ];

  for (const item of data) {
    const index = dates.indexOf(item.date);
    if (index !== -1) {
      result[0].data[index] = calculateQuota(item.quota, 3);
      result[1].data[index] = item.user_count;
    }
  }

  let chartData = {
    height: 480,
    options: {
      chart: {
        type: 'line',
        background: 'transparent'
      },
      stroke: {
        width: [0, 4]
      },
      dataLabels: {
        enabled: true,
        enabledOnSeries: [1]
      },
      xaxis: {
        type: 'category',
        categories: dates
      },
      yaxis: [
        {
          title: {
            text: '兑换金额($)'
          }
        },
        {
          opposite: true,
          title: {
            text: '独立用户(人)'
          }
        }
      ],
      tooltip: {
        theme: 'dark'
      }
    },
    series: result
  };

  return chartData;
}

function getUsersData(data, dateRange) {
  if (!data) return null;

  const dates = getDates(dateRange.start, dateRange.end);
  const result = [
    {
      name: '直接注册',
      data: new Array(dates.length).fill(0)
    },
    {
      name: '邀请注册',
      data: new Array(dates.length).fill(0)
    }
  ];

  let total = 0;

  for (const item of data) {
    const index = dates.indexOf(item.date);
    if (index !== -1) {
      result[0].data[index] = item.user_count - item.inviter_user_count;
      result[1].data[index] = item.inviter_user_count;

      total += item.user_count;
    }
  }

  let chartData = generateBarChartOptions(dates, result, '人', 0);
  chartData.options.title.text = '总注册人数：' + total;

  return chartData;
}

function getOrdersData(data, dateRange) {
  if (!data) return null;

  const dates = getDates(dateRange.start, dateRange.end);
  const result = [
    {
      name: '充值',
      data: new Array(dates.length).fill(0)
    }
  ];

  let total = 0;

  for (const item of data) {
    const index = dates.indexOf(item.date);
    if (index !== -1) {
      result[0].data[index] = item.order_amount;

      total += item.order_amount;
    }
  }

  let chartData = generateBarChartOptions(dates, result, 'CNY', 0);
  chartData.options.title.text = '总充值数：' + total;

  return chartData;
}
