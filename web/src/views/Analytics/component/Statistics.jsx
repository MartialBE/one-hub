import { useState, useEffect, useCallback } from 'react';
import { Grid } from '@mui/material';
import DataCard from 'ui-component/cards/DataCard';
import { gridSpacing } from 'store/constant';
import { showError, renderQuota } from 'utils/common';
import { API } from 'utils/api';
import { useTranslation } from 'react-i18next';

export default function Overview() {
  const { t } = useTranslation();
  const [userLoading, setUserLoading] = useState(true);
  const [channelLoading, setChannelLoading] = useState(true);
  const [rechargeLoading, setRechargeLoading] = useState(true);
  const [userStatistics, setUserStatistics] = useState({});

  const [channelStatistics, setChannelStatistics] = useState({
    active: 0,
    disabled: 0,
    test_disabled: 0,
    total: 0
  });

  const [rechargeStatistics, setRechargeStatistics] = useState({
    total: 0,
    Redemption: 0,
    Oder: 0,
    OderContent: ''
  });

  const userStatisticsData = (data) => {
    data.total_quota = renderQuota(data.total_quota);
    data.total_used_quota = renderQuota(data.total_used_quota);
    data.total_direct_user = data.total_user - data.total_inviter_user;
    setUserStatistics(data);
  };

  const channelStatisticsData = (data) => {
    let channelData = channelStatistics;
    channelData.total = 0;
    data.forEach((item) => {
      if (item.status === 1) {
        channelData.active = item.total_channels;
      } else if (item.status === 2) {
        channelData.disabled = item.total_channels;
      } else if (item.status === 3) {
        channelData.test_disabled = item.total_channels;
      }
      channelData.total += item.total_channels;
    });
    setChannelStatistics(channelData);
  };

  const rechargeStatisticsData = (redemptionData, OrderData) => {
    let rechargeData = rechargeStatistics;
    rechargeData.total = 0;

    if (redemptionData) {
      redemptionData.forEach((item) => {
        rechargeData.Redemption += item.quota;
      });

      rechargeData.total += rechargeData.Redemption;
      rechargeData.Redemption = renderQuota(rechargeData.Redemption);
    }

    if (OrderData) {
      let orderMap = {};
      OrderData.forEach((item) => {
        rechargeData.Oder += item.quota;
        if (!orderMap[item.order_currency]) {
          orderMap[item.order_currency] = 0;
        }
        orderMap[item.order_currency] += item.money;
      });

      rechargeData.total += rechargeData.Oder;
      rechargeData.Oder = renderQuota(rechargeData.Oder);

      // 循环遍历orderMap
      for (let key in orderMap) {
        rechargeData.OderContent += key + ': ' + orderMap[key] + ' ';
      }

      console.log(rechargeData.OderContent);
    }

    rechargeData.total = renderQuota(rechargeData.total);
    setRechargeStatistics(rechargeData);
  };

  const statisticsData = useCallback(async () => {
    try {
      const res = await API.get('/api/analytics/statistics');
      const { success, message, data } = res.data;
      if (success) {
        if (data.user_statistics) {
          userStatisticsData(data.user_statistics);
        }

        if (data.channel_statistics) {
          channelStatisticsData(data.channel_statistics);
        }

        if (data.redemption_statistic || data.order_statistics) {
          rechargeStatisticsData(data?.redemption_statistic, data?.order_statistics);
        }
        setUserLoading(false);
        setChannelLoading(false);
        setRechargeLoading(false);
      } else {
        showError(message);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    statisticsData();
  }, [statisticsData]);

  return (
    <Grid container spacing={gridSpacing}>
      <Grid item lg={3} xs={12}>
        <DataCard
          isLoading={userLoading}
          title={t('analytics_index.totalUserSpending')}
          content={userStatistics?.total_used_quota || '0'}
          subContent={t('analytics_index.totalUserBalance') + '：' + (userStatistics?.total_quota || '0')}
        />
      </Grid>
      <Grid item lg={3} xs={12}>
        <DataCard
          isLoading={userLoading}
          title={t('analytics_index.totalUsers')}
          content={userStatistics?.total_user || '0'}
          subContent={
            <>
              {t('analytics_index.directRegistration')}：{userStatistics?.total_direct_user || '0'} <br />
              {t('analytics_index.invitationRegistration')}：{userStatistics?.total_inviter_user || '0'}
            </>
          }
        />
      </Grid>
      <Grid item lg={3} xs={12}>
        <DataCard
          isLoading={channelLoading}
          title={t('analytics_index.channelCount')}
          content={channelStatistics.total}
          subContent={
            <>
              {t('analytics_index.active')}：{channelStatistics.active} / {t('analytics_index.disabled')}：{'·'}
              {channelStatistics.disabled} / {t('analytics_index.testDisabled')}：{channelStatistics.test_disabled}
            </>
          }
        />
      </Grid>
      <Grid item lg={3} xs={12}>
        <DataCard
          isLoading={rechargeLoading}
          title={'充值统计'}
          content={rechargeStatistics.total}
          subContent={
            <>
              兑换码: {rechargeStatistics.Redemption} <br /> 订单: {rechargeStatistics.Oder} / {rechargeStatistics.OderContent}
            </>
          }
        />
      </Grid>
    </Grid>
  );
}
