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
  FormHelperText
} from '@mui/material';

import { showSuccess, showError, trims } from 'utils/common';
import { API } from 'utils/api';
import { useTranslation } from 'react-i18next';
import IconWrapper from 'ui-component/IconWrapper';

const validationSchema = Yup.object().shape({
  is_edit: Yup.boolean(),
  id: Yup.string().required('ID不能为空'),
  name: Yup.string().required('名称不能为空'),
  icon: Yup.string()
});

const originInputs = {
  is_edit: false,
  id: '',
  name: '',
  icon: ''
};

const EditModal = ({ open, Oid, onCancel, onOk }) => {
  const theme = useTheme();
  const [inputs, setInputs] = useState(originInputs);
  const { t } = useTranslation();

  const submit = async (values, { setErrors, setStatus, setSubmitting }) => {
    setSubmitting(true);

    let res;
    values = trims(values);
    try {
      if (values.is_edit) {
        res = await API.put(`/api/model_ownedby/`, { ...values, id: parseInt(Oid) });
      } else {
        res = await API.post(`/api/model_ownedby/`, { ...values, id: parseInt(values.id) });
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

  const loadModelOwnedBy = async () => {
    try {
      let res = await API.get(`/api/model_ownedby/${Oid}`);
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
    if (Oid) {
      loadModelOwnedBy().then();
    } else {
      setInputs(originInputs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Oid]);

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth={'md'}>
      <DialogTitle sx={{ margin: '0px', fontWeight: 700, lineHeight: '1.55556', padding: '24px', fontSize: '1.125rem' }}>
        {Oid ? t('common.edit') : t('common.create')}
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Formik initialValues={inputs} enableReinitialize validationSchema={validationSchema} onSubmit={submit}>
          {({ errors, handleBlur, handleChange, handleSubmit, touched, values, isSubmitting }) => (
            <form noValidate onSubmit={handleSubmit}>
              <FormControl fullWidth error={Boolean(touched.id && errors.id)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-id-label">{t('modelOwnedby.id')}</InputLabel>
                <OutlinedInput
                  id="channel-id-label"
                  label={t('modelOwnedby.id')}
                  type="text"
                  value={values.id}
                  name="id"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  inputProps={{ autoComplete: 'id' }}
                  aria-describedby="helper-text-channel-id-label"
                  disabled={values.is_edit}
                />
                {touched.id && errors.id ? (
                  <FormHelperText error id="helper-tex-channel-id-label">
                    {t(errors.id)}
                  </FormHelperText>
                ) : (
                  <FormHelperText id="helper-tex-channel-type-label"> {t('modelOwnedby.idTip')} </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth error={Boolean(touched.name && errors.name)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-name-label">{t('modelOwnedby.name')}</InputLabel>
                <OutlinedInput
                  id="channel-name-label"
                  label={t('modelOwnedby.name')}
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
                  <FormHelperText id="helper-tex-channel-type-label"> {t('modelOwnedby.nameTip')} </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth error={Boolean(touched.icon && errors.icon)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-icon-label">{t('modelOwnedby.icon')}</InputLabel>
                <OutlinedInput
                  id="channel-icon-label"
                  label={t('modelOwnedby.icon')}
                  type="text"
                  value={values.icon}
                  name="icon"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  aria-describedby="helper-text-channel-ratio-label"
                  startAdornment={<IconWrapper url={values.icon} />}
                />

                {touched.ratio && errors.ratio && (
                  <FormHelperText error id="helper-tex-channel-ratio-label">
                    {t(errors.ratio)}
                  </FormHelperText>
                )}
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
  Oid: PropTypes.number,
  onCancel: PropTypes.func,
  onOk: PropTypes.func
};
