import { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import { gridSpacing } from 'store/constant';
import StatisticalLineChartCard from './component/StatisticalLineChartCard';
import ApexCharts from 'ui-component/chart/ApexCharts';
import { getLastSevenDays, generateBarChartOptions, renderChartNumber } from 'utils/chart';
import { API } from 'utils/api';
import { showError, calculateQuota, renderNumber } from 'utils/common';
// import UserCard from 'ui-component/cards/UserCard';
import { useTranslation } from 'react-i18next';
import ModelUsagePieChart from './component/ModelUsagePieChart'; // 新增

const Dashboard = () => {
  const [isLoading, setLoading] = useState(true);
  const [statisticalData, setStatisticalData] = useState([]);
  const [requestChart, setRequestChart] = useState(null);
  const [quotaChart, setQuotaChart] = useState(null);
  const [tokenChart, setTokenChart] = useState(null);
  // const [users, setUsers] = useState([]);
  const { t } = useTranslation();
  const [modelUsageData, setModelUsageData] = useState([]); // 新增

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
          setModelUsageData(getModelUsageData(data)); // 新增
        }
      } else {
        showError(message);
      }
      setLoading(false);
    } catch (error) {
      return;
    }
  };


  useEffect(() => {
    userDashboard();
  }, []);


  return (
    <Grid container spacing={gridSpacing}>
      <Grid item xs={12}>
        <Grid container spacing={gridSpacing}>
          <Grid item lg={4} xs={12}>
            <StatisticalLineChartCard
              isLoading={isLoading}
              title={t('dashboard_index.today_requests')}
              type="request"
              chartData={requestChart?.chartData}
              todayValue={requestChart?.todayValue}
            />
          </Grid>
          <Grid item lg={4} xs={12}>
            <StatisticalLineChartCard
              isLoading={isLoading}
              title={t('dashboard_index.today_consumption')}
              type="quota"
              chartData={quotaChart?.chartData}
              todayValue={quotaChart?.todayValue}
            />
          </Grid>
          <Grid item lg={4} xs={12}>
            <StatisticalLineChartCard
              isLoading={isLoading}
              title={t('dashboard_index.today_tokens')}
              type="token"
              chartData={tokenChart?.chartData}
              todayValue={tokenChart?.todayValue}
            />
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Grid container spacing={gridSpacing}>
          <Grid item lg={8} xs={12}>
            <ApexCharts isLoading={isLoading} chartDatas={statisticalData} />
          </Grid>
          <Grid item lg={4} xs={12}>
            <ModelUsagePieChart isLoading={isLoading} data={modelUsageData} /> {/* 新增 */}
          </Grid>

        </Grid>
      </Grid>
    </Grid>
  );
};

// 新增函数来处理模型使用数据
function getModelUsageData(data) {
  const modelUsage = {};
  data.forEach(item => {
    if (!modelUsage[item.ModelName]) {
      modelUsage[item.ModelName] = 0;
    }
    modelUsage[item.ModelName] += item.RequestCount;
  });

  return Object.entries(modelUsage).map(([name, count]) => ({
    name,
    value: count
  }));
}

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
  let chartData = null;
  const lastItem = lineDataGroup.length - 1;
  let lineData = lineDataGroup.map((item, index) => {
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

    if (index == lastItem) {
      todayValue = tmp.y;
    }
    return tmp;
  });

  switch (field) {
    case 'RequestCount':
      // chartData = generateLineChartOptions(lineData, '次');
      todayValue = renderNumber(todayValue);
      break;
    case 'Quota':
      // chartData = generateLineChartOptions(lineData, '美元');
      todayValue = '$' + renderNumber(todayValue);
      break;
    case 'PromptTokens':
      // chartData = generateLineChartOptions(lineData, '');
      todayValue = renderNumber(todayValue);
      break;
  }

  chartData = {
    series: [
      {
        data: lineData
      }
    ]
  };

  return { chartData: chartData, todayValue: todayValue };
}



