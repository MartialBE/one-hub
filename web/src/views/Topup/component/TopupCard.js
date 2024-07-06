import {
  Typography,
  Stack,
  OutlinedInput,
  InputAdornment,
  Button,
  InputLabel,
  FormControl,
  useMediaQuery,
  TextField,
  Box,
  Grid,
  Divider,
  Badge
} from '@mui/material';
import { IconBuildingBank } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';
import SubCard from 'ui-component/cards/SubCard';
import UserCard from 'ui-component/cards/UserCard';
import AnimateButton from 'ui-component/extended/AnimateButton';
import { useSelector } from 'react-redux';
import PayDialog from './PayDialog';

import { API } from 'utils/api';
import React, { useEffect, useState } from 'react';
import { showError, showInfo, showSuccess, renderQuota, trims } from 'utils/common';
import { useTranslation } from 'react-i18next';

const TopupCard = () => {
  const { t } = useTranslation(); // Translation hook
  const theme = useTheme();
  const [redemptionCode, setRedemptionCode] = useState('');
  const [userQuota, setUserQuota] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [payment, setPayment] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [amount, setAmount] = useState(0);
  const [discountTotal, setDiscountTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [disabledPay, setDisabledPay] = useState(false);
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));
  const siteInfo = useSelector((state) => state.siteInfo);
  const RechargeDiscount = useSelector((state) => {
    if (state.siteInfo.RechargeDiscount === '') {
      return {};
    }
    return JSON.parse(state.siteInfo.RechargeDiscount);
  });
  const topUp = async () => {
    if (redemptionCode === '') {
      showInfo(t('topupCard.inputPlaceholder'));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await API.post('/api/user/topup', {
        key: trims(redemptionCode)
      });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess('充值成功！');
        setUserQuota((quota) => {
          return quota + data;
        });
        setRedemptionCode('');
      } else {
        showError(message);
      }
    } catch (err) {
      showError('请求失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePay = () => {
    if (!selectedPayment) {
      showError(t('topupCard.selectPaymentMethod'));
      return;
    }

    if (amount <= 0 || amount < siteInfo.PaymentMinAmount) {
      showError(`${t('topupCard.amountMinLimit')} ${siteInfo.PaymentMinAmount}`);
      return;
    }

    if (amount > 1000000) {
      showError(t('topupCard.amountMaxLimit'));
      return;
    }

    // 判读金额是否是正整数
    if (!/^[1-9]\d*$/.test(amount)) {
      showError(t('topupCard.positiveIntegerAmount'));
      return;
    }

    setDisabledPay(true);
    setOpen(true);
  };

  const onClosePayDialog = () => {
    setOpen(false);
    setDisabledPay(false);
  };

  const getPayment = async () => {
    try {
      let res = await API.get(`/api/user/payment`);
      const { success, data } = res.data;
      if (success) {
        if (data.length > 0) {
          data.sort((a, b) => b.sort - a.sort);
          setPayment(data);
          setSelectedPayment(data[0]);
        }
      }
    } catch (error) {
      return;
    }
  };

  const openTopUpLink = () => {
    if (!siteInfo.top_up_link) {
      showError(t('topupCard.adminSetupRequired'));
      return;
    }
    window.open(siteInfo.top_up_link, '_blank');
  };

  const getUserQuota = async () => {
    try {
      let res = await API.get(`/api/user/self`);
      const { success, message, data } = res.data;
      if (success) {
        setUserQuota(data.quota);
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  const handlePaymentSelect = (payment) => {
    setSelectedPayment(payment);
  };

  const handleAmountChange = (event) => {
    const value = event.target.value;
    if (value === '') {
      setAmount('');
      return;
    }
    handleSetAmount(value);
  };

  const handleSetAmount = (amount) => {
    amount = Number(amount);
    setAmount(amount);
    handleDiscountTotal(amount);
  };

  const calculateFee = () => {
    if (!selectedPayment) return 0;

    if (selectedPayment.fixed_fee > 0) {
      return Number(selectedPayment.fixed_fee); //固定费率不计算折扣
    }
    const discount = RechargeDiscount[amount] || 1; // 如果没有折扣，则默认为1（即没有折扣）
    let newAmount = amount * discount; //折后价格
    return parseFloat(selectedPayment.percent_fee * Number(newAmount)).toFixed(2);
  };

  const calculateTotal = () => {
    if (amount === 0) return 0;
    const discount = RechargeDiscount[amount] || 1; // 如果没有折扣，则默认为1（即没有折扣）
    let newAmount = amount * discount; //折后价格
    let total = Number(newAmount) + Number(calculateFee());
    if (selectedPayment && selectedPayment.currency === 'CNY') {
      total = parseFloat((total * siteInfo.PaymentUSDRate).toFixed(2));
    }
    return total;
  };

  const handleDiscountTotal = (amount) => {
    if (amount === 0) return 0;
    // 如果金额在RechargeDiscount中，则应用折扣,手续费和货币换算汇率不算在折扣内
    const discount = RechargeDiscount[amount] || 1; // 如果没有折扣，则默认为1（即没有折扣）
    console.log(amount, discount);
    setDiscountTotal(amount * discount);
  };

  useEffect(() => {
    getPayment().then();
    getUserQuota().then();
  }, []);

  return (
    <UserCard>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} paddingTop={'20px'}>
        <IconBuildingBank color={theme.palette.primary.main} />
        <Typography variant="h4">{t('topupCard.currentQuota')}</Typography>
        <Typography variant="h4">{renderQuota(userQuota)}</Typography>
      </Stack>

      {payment.length > 0 && (
        <SubCard
          sx={{
            marginTop: '40px'
          }}
          title={t('topupCard.onlineTopup')}
        >
          <Stack spacing={2}>
            {payment.map((item, index) => (
              <AnimateButton key={index}>
                <Button
                  disableElevation
                  fullWidth
                  size="large"
                  variant="outlined"
                  onClick={() => handlePaymentSelect(item)}
                  sx={{
                    ...theme.typography.LoginButton,
                    border: selectedPayment === item ? `1px solid ${theme.palette.primary.main}` : '1px solid transparent'
                  }}
                >
                  <Box sx={{ mr: { xs: 1, sm: 2, width: 20 }, display: 'flex', alignItems: 'center' }}>
                    <img src={item.icon} alt="github" width={25} height={25} style={{ marginRight: matchDownSM ? 8 : 16 }} />
                  </Box>
                  {item.name}
                </Button>
              </AnimateButton>
            ))}
            <Grid container spacing={2}>
              {Object.entries(RechargeDiscount).map(([key, value]) => (
                <Grid item key={key}>
                  <Badge badgeContent={value !== 1 ? `${value * 10}折` : null} color="error">
                    <Button
                      variant="outlined"
                      onClick={() => handleSetAmount(key)}
                      sx={{
                        border: amount === Number(key) ? `1px solid ${theme.palette.primary.main}` : '1px solid transparent'
                      }}
                    >
                      ${key}
                    </Button>
                  </Badge>
                </Grid>
              ))}
            </Grid>
            <TextField label={t('topupCard.amount')} type="number" onChange={handleAmountChange} value={amount} />
            <Divider />
            <Grid container direction="row" justifyContent="flex-end" spacing={2}>
              <Grid item xs={6} md={9}>
                <Typography variant="h6" style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                  {t('topupCard.topupAmount')}:{' '}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                ${Number(amount)}
              </Grid>
              {discountTotal !== amount && (
                <>
                  <Grid item xs={6} md={9}>
                    <Typography variant="h6" style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                      {t('topupCard.discountedPrice')}:{' '}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    ${discountTotal}
                  </Grid>
                </>
              )}
              {selectedPayment && (selectedPayment.percent_fee > 0 || selectedPayment.fixed_fee > 0) && (
                <>
                  <Grid item xs={6} md={9}>
                    <Typography variant="h6" style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                      {t('topupCard.fee')}:{' '}
                      {selectedPayment &&
                        (selectedPayment.fixed_fee > 0
                          ? '(固定)'
                          : selectedPayment.percent_fee > 0
                            ? `(${selectedPayment.percent_fee * 100}%)`
                            : '')}{' '}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    ${calculateFee()}
                  </Grid>
                </>
              )}

              <Grid item xs={6} md={9}>
                <Typography variant="h6" style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                  {t('topupCard.actualAmountToPay')}:{' '}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                {calculateTotal()}{' '}
                {selectedPayment &&
                  (selectedPayment.currency === 'CNY'
                    ? `CNY (${t('topupCard.exchangeRate')}: ${siteInfo.PaymentUSDRate})`
                    : selectedPayment.currency)}
              </Grid>
            </Grid>
            <Divider />
            <Button variant="contained" onClick={handlePay} disabled={disabledPay}>
              {t('topupCard.topup')}
            </Button>
          </Stack>
          <PayDialog open={open} onClose={onClosePayDialog} amount={amount} uuid={selectedPayment.uuid} />
        </SubCard>
      )}

      <SubCard
        sx={{
          marginTop: '40px'
        }}
        title={t('topupCard.redemptionCodeTopup')}
      >
        <FormControl fullWidth variant="outlined">
          <InputLabel htmlFor="key">{t('topupCard.inputLabel')}</InputLabel>
          <OutlinedInput
            id="key"
            label={t('topupCard.inputLabel')}
            type="text"
            value={redemptionCode}
            onChange={(e) => setRedemptionCode(e.target.value)}
            name="key"
            placeholder={t('topupCard.inputPlaceholder')}
            endAdornment={
              <InputAdornment position="end">
                <Button variant="contained" onClick={topUp} disabled={isSubmitting}>
                  {isSubmitting ? t('topupCard.exchangeButton.submitting') : t('topupCard.exchangeButton.default')}
                </Button>
              </InputAdornment>
            }
            aria-describedby="helper-text-channel-quota-label"
          />
        </FormControl>

        <Stack justifyContent="center" alignItems={'center'} spacing={3} paddingTop={'20px'}>
          <Typography variant={'h4'} color={theme.palette.grey[700]}>
            {t('topupCard.noRedemptionCodeText')}
          </Typography>
          <Button variant="contained" onClick={openTopUpLink}>
            {t('topupCard.getRedemptionCode')}
          </Button>
        </Stack>
      </SubCard>
    </UserCard>
  );
};

export default TopupCard;
