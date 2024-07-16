import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useTheme } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  FormControl,
  InputLabel,
  OutlinedInput,
  TextField,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';

import { showSuccess, showError, trims } from 'utils/common';
import { API } from 'utils/api';
import { PaymentType, CurrencyType, PaymentConfig } from '../type/Config';
import { useTranslation } from 'react-i18next';

const getValidationSchema = (t) =>
  Yup.object().shape({
    is_edit: Yup.boolean(),
    name: Yup.string().required(t('validation.requiredName')),
    icon: Yup.string().required(t('payment_edit.requiredIcon')),
    fixed_fee: Yup.number().min(0, t('payment_edit.requiredFixedFee')),
    percent_fee: Yup.number().min(0, t('payment_edit.requiredPercentFee')),
    currency: Yup.string().required(t('payment_edit.requiredCurrency'))
  });

const originInputs = {
  is_edit: false,
  type: 'epay',
  uuid: '',
  name: '',
  icon: '',
  notify_domain: '',
  fixed_fee: 0,
  percent_fee: 0,
  currency: 'CNY',
  config: {},
  sort: 0,
  enable: true
};

const EditModal = ({ open, paymentId, onCancel, onOk }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [inputs, setInputs] = useState(originInputs);

  const submit = async (values, { setErrors, setStatus, setSubmitting }) => {
    setSubmitting(true);

    let config = JSON.stringify(values.config);
    let res;
    values = trims(values);
    try {
      if (values.is_edit) {
        res = await API.put(`/api/payment/`, { ...values, id: parseInt(paymentId), config });
      } else {
        res = await API.post(`/api/payment/`, { ...values, config });
      }
      const { success, message } = res.data;
      if (success) {
        if (values.is_edit) {
          showSuccess(t('payment_edit.updateOk'));
        } else {
          showSuccess(t('payment_edit.addOk'));
        }
        setSubmitting(false);
        setStatus({ success: true });
        onOk(true);
      } else {
        showError(message);
        setErrors({ submit: message });
      }
    } catch (error) {
      return;
    }
  };

  const loadPayment = async () => {
    try {
      let res = await API.get(`/api/payment/${paymentId}`);
      const { success, message, data } = res.data;
      if (success) {
        data.is_edit = true;
        data.config = JSON.parse(data.config);
        setInputs(data);
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  useEffect(() => {
    if (paymentId) {
      loadPayment().then();
    } else {
      setInputs(originInputs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth={'md'}>
      <DialogTitle sx={{ margin: '0px', fontWeight: 700, lineHeight: '1.55556', padding: '24px', fontSize: '1.125rem' }}>
        {paymentId ? t('payment_edit.paymentEdit') : t('paymentGatewayPage.createPayment')}
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Formik initialValues={inputs} enableReinitialize validationSchema={getValidationSchema(t)} onSubmit={submit}>
          {({ errors, handleBlur, handleChange, handleSubmit, touched, values, isSubmitting }) => (
            <form noValidate onSubmit={handleSubmit}>
              <FormControl fullWidth error={Boolean(touched.type && errors.type)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-type-label">{t('paymentGatewayPage.tableHeaders.type')}</InputLabel>
                <Select
                  id="channel-type-label"
                  label={t('paymentGatewayPage.tableHeaders.type')}
                  value={values.type}
                  name="type"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200
                      }
                    }
                  }}
                >
                  {Object.entries(PaymentType).map(([value, text]) => (
                    <MenuItem key={value} value={value}>
                      {text}
                    </MenuItem>
                  ))}
                </Select>
                {touched.type && errors.type ? (
                  <FormHelperText error id="helper-tex-channel-type-label">
                    {errors.type}
                  </FormHelperText>
                ) : (
                  <FormHelperText id="helper-tex-channel-type-label"> {t('payment_edit.paymentType')} </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth error={Boolean(touched.name && errors.name)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-name-label">{t('paymentGatewayPage.tableHeaders.name')}</InputLabel>
                <OutlinedInput
                  id="channel-name-label"
                  label={t('paymentGatewayPage.tableHeaders.name')}
                  type="text"
                  value={values.name}
                  name="name"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  inputProps={{ autoComplete: 'name' }}
                  aria-describedby="helper-text-channel-name-label"
                />
                {touched.name && errors.name && (
                  <FormHelperText error id="helper-tex-channel-name-label">
                    {errors.name}
                  </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth error={Boolean(touched.icon && errors.icon)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-icon-label">{t('paymentGatewayPage.tableHeaders.icon')}</InputLabel>
                <OutlinedInput
                  id="channel-icon-label"
                  label={t('paymentGatewayPage.tableHeaders.icon')}
                  type="text"
                  value={values.icon}
                  name="icon"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  inputProps={{ autoComplete: 'icon' }}
                  aria-describedby="helper-text-channel-icon-label"
                />
                {touched.icon && errors.icon && (
                  <FormHelperText error id="helper-tex-channel-icon-label">
                    {errors.icon}
                  </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth error={Boolean(touched.notify_domain && errors.notify_domain)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-notify_domain-label">{t('payment_edit.notifyDomain')}</InputLabel>
                <OutlinedInput
                  id="channel-notify_domain-label"
                  label={t('payment_edit.notifyDomain')}
                  type="text"
                  value={values.notify_domain}
                  name="notify_domain"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  inputProps={{ autoComplete: 'notify_domain' }}
                  aria-describedby="helper-text-channel-notify_domain-label"
                />
                {touched.notify_domain && errors.notify_domain ? (
                  <FormHelperText error id="helper-tex-notify_domain-label">
                    {errors.notify_domain}
                  </FormHelperText>
                ) : (
                  <FormHelperText id="helper-tex-notify_domain-label"> {t('payment_edit.notifyDomainTip')} </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth error={Boolean(touched.fixed_fee && errors.fixed_fee)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-fixed_fee-label">{t('paymentGatewayPage.tableHeaders.fixedFee')}</InputLabel>
                <OutlinedInput
                  id="channel-fixed_fee-label"
                  label={t('paymentGatewayPage.tableHeaders.fixedFee')}
                  type="number"
                  value={values.fixed_fee}
                  name="fixed_fee"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  inputProps={{ autoComplete: 'fixed_fee' }}
                  aria-describedby="helper-text-channel-fixed_fee-label"
                />
                {touched.fixed_fee && errors.fixed_fee ? (
                  <FormHelperText error id="helper-tex-fixed_fee-label">
                    {errors.fixed_fee}
                  </FormHelperText>
                ) : (
                  <FormHelperText id="helper-tex-fixed_fee-label"> {t('payment_edit.FixedTip')} </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth error={Boolean(touched.percent_fee && errors.percent_fee)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-percent_fee-label">{t('paymentGatewayPage.tableHeaders.percentFee')}</InputLabel>
                <OutlinedInput
                  id="channel-percent_fee-label"
                  label={t('paymentGatewayPage.tableHeaders.percentFee')}
                  type="number"
                  value={values.percent_fee}
                  name="percent_fee"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  inputProps={{ autoComplete: 'percent_fee' }}
                  aria-describedby="helper-text-channel-percent_fee-label"
                />
                {touched.percent_fee && errors.percent_fee ? (
                  <FormHelperText error id="helper-tex-percent_fee-label">
                    {errors.percent_fee}
                  </FormHelperText>
                ) : (
                  <FormHelperText id="helper-tex-percent_fee-label"> {t('payment_edit.percentTip')} </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth error={Boolean(touched.currency && errors.currency)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-currency-label">{t('payment_edit.currencyType')}</InputLabel>
                <Select
                  id="channel-currency-label"
                  label={t('payment_edit.currencyType')}
                  value={values.currency}
                  name="currency"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200
                      }
                    }
                  }}
                >
                  {Object.entries(CurrencyType).map(([value, text]) => (
                    <MenuItem key={value} value={value}>
                      {text}
                    </MenuItem>
                  ))}
                </Select>
                {touched.currency && errors.currency ? (
                  <FormHelperText error id="helper-tex-channel-currency-label">
                    {errors.currency}
                  </FormHelperText>
                ) : (
                  <FormHelperText id="helper-tex-channel-currency-label"> {t('payment_edit.currencyTip')} </FormHelperText>
                )}
              </FormControl>

              {PaymentConfig[values.type] &&
                Object.keys(PaymentConfig[values.type]).map((configKey) => {
                  const param = PaymentConfig[values.type][configKey];
                  const name = `config.${configKey}`;
                  return param.type === 'select' ? (
                    <FormControl key={name} fullWidth>
                      <InputLabel htmlFor="channel-currency-label">{param.name}</InputLabel>
                      <Select
                        label={param.name}
                        value={values.config?.[configKey] || ''}
                        key={name}
                        name={name}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 200
                            }
                          }
                        }}
                      >
                        {Object.values(param.options).map((option) => {
                          return (
                            <MenuItem key={option.value} value={option.value}>
                              {option.name}
                            </MenuItem>
                          );
                        })}
                      </Select>
                      <FormHelperText id="helper-tex-channel-currency-label"> {param.description} </FormHelperText>
                    </FormControl>
                  ) : (
                    <FormControl key={name} fullWidth sx={{ ...theme.typography.otherInput }}>
                      <TextField
                        multiline
                        key={name}
                        name={name}
                        value={values.config?.[configKey] || ''}
                        label={param.name}
                        placeholder={param.description}
                        onChange={handleChange}
                      />
                      <FormHelperText id="helper-tex-channel-key-label"> {param.description} </FormHelperText>
                    </FormControl>
                  );
                })}

              <DialogActions>
                <Button onClick={onCancel}>{t('common.cancel')}</Button>
                <Button disableElevation disabled={isSubmitting} type="submit" variant="contained" color="primary">
                  {t('common.submit')}
                </Button>
              </DialogActions>
            </form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default EditModal;

EditModal.propTypes = {
  open: PropTypes.bool,
  paymentId: PropTypes.number,
  onCancel: PropTypes.func,
  onOk: PropTypes.func
};
