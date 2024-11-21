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
  Switch,
  FormControlLabel,
  FormHelperText
} from '@mui/material';

import { showSuccess, showError, trims } from 'utils/common';
import { API } from 'utils/api';
import { useTranslation } from 'react-i18next';

const validationSchema = Yup.object().shape({
  is_edit: Yup.boolean(),
  symbol: Yup.string().required('symbol is required'),
  name: Yup.string().required('name is required'),
  ratio: Yup.number().required('ratio is required')
});

const originInputs = {
  is_edit: false,
  symbol: '',
  name: '',
  ratio: 1,
  public: false,
  api_rate: 300
};

const EditModal = ({ open, userGroupId, onCancel, onOk }) => {
  const theme = useTheme();
  const [inputs, setInputs] = useState(originInputs);
  const { t } = useTranslation();

  const submit = async (values, { setErrors, setStatus, setSubmitting }) => {
    setSubmitting(true);

    let res;
    values = trims(values);
    try {
      if (values.is_edit) {
        res = await API.put(`/api/user_group/`, { ...values, id: parseInt(userGroupId) });
      } else {
        res = await API.post(`/api/user_group/`, values);
      }
      const { success, message } = res.data;
      if (success) {
        if (values.is_edit) {
          showSuccess(t('userPage.saveSuccess'));
        } else {
          showSuccess(t('userPage.saveSuccess'));
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

  const loadUserGroup = async () => {
    try {
      let res = await API.get(`/api/user_group/${userGroupId}`);
      const { success, message, data } = res.data;
      if (success) {
        data.is_edit = true;
        setInputs(data);
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  useEffect(() => {
    if (userGroupId) {
      loadUserGroup().then();
    } else {
      setInputs(originInputs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userGroupId]);

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth={'md'}>
      <DialogTitle sx={{ margin: '0px', fontWeight: 700, lineHeight: '1.55556', padding: '24px', fontSize: '1.125rem' }}>
        {userGroupId ? t('common.edit') : t('common.create')}
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Formik initialValues={inputs} enableReinitialize validationSchema={validationSchema} onSubmit={submit}>
          {({ errors, handleBlur, handleChange, setFieldValue, handleSubmit, touched, values, isSubmitting }) => (
            <form noValidate onSubmit={handleSubmit}>
              <FormControl fullWidth error={Boolean(touched.symbol && errors.symbol)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-symbol-label">{t('userGroup.symbol')}</InputLabel>
                <OutlinedInput
                  id="channel-symbol-label"
                  label={t('userGroup.symbol')}
                  type="text"
                  value={values.symbol}
                  name="symbol"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  inputProps={{ autoComplete: 'symbol' }}
                  aria-describedby="helper-text-channel-symbol-label"
                  disabled={values.is_edit}
                />
                {touched.symbol && errors.symbol ? (
                  <FormHelperText error id="helper-tex-channel-symbol-label">
                    {t(errors.symbol)}
                  </FormHelperText>
                ) : (
                  <FormHelperText id="helper-tex-channel-type-label"> {t('userGroup.symbolTip')} </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth error={Boolean(touched.name && errors.name)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-name-label">{t('userGroup.name')}</InputLabel>
                <OutlinedInput
                  id="channel-name-label"
                  label={t('userGroup.name')}
                  type="text"
                  value={values.name}
                  name="name"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  inputProps={{ autoComplete: 'name' }}
                  aria-describedby="helper-text-channel-name-label"
                />
                {touched.name && errors.name ? (
                  <FormHelperText error id="helper-tex-channel-name-label">
                    {t(errors.name)}
                  </FormHelperText>
                ) : (
                  <FormHelperText id="helper-tex-channel-type-label"> {t('userGroup.nameTip')} </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth error={Boolean(touched.ratio && errors.ratio)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-ratio-label">{t('userGroup.ratio')}</InputLabel>
                <OutlinedInput
                  id="channel-ratio-label"
                  label={t('userGroup.ratio')}
                  type="number"
                  value={values.ratio}
                  name="ratio"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  aria-describedby="helper-text-channel-ratio-label"
                />

                {touched.ratio && errors.ratio && (
                  <FormHelperText error id="helper-tex-channel-ratio-label">
                    {t(errors.ratio)}
                  </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth error={Boolean(touched.api_rate && errors.api_rate)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-api-rate-label">{t('userGroup.apiRate')}</InputLabel>
                <OutlinedInput
                  id="channel-api-rate-label"
                  label={t('userGroup.apiRate')}
                  type="number"
                  value={values.api_rate}
                  name="api_rate"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  aria-describedby="helper-text-channel-api-rate-label"
                />

                {touched.api_rate && errors.api_rate ? (
                  <FormHelperText error id="helper-tex-channel-api-rate-label">
                    {t(errors.api_rate)}
                  </FormHelperText>
                ) : (
                  <FormHelperText id="helper-tex-channel-api-rate-label"> {t('userGroup.apiRateTip')} </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Switch
                      checked={values.public}
                      onClick={() => {
                        setFieldValue('public', !values.public);
                      }}
                    />
                  }
                  label={t('userGroup.public')}
                />
              </FormControl>
              <DialogActions>
                <Button onClick={onCancel}>{t('userPage.cancel')}</Button>
                <Button disableElevation disabled={isSubmitting} type="submit" variant="contained" color="primary">
                  {t('userPage.submit')}
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
  userGroupId: PropTypes.number,
  onCancel: PropTypes.func,
  onOk: PropTypes.func
};
