import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// material-ui
import { Button, Stack, Typography, Alert } from '@mui/material';

// assets
import { showError, copy } from 'utils/common';
import { API } from 'utils/api';
import { useTranslation } from 'react-i18next';

// ===========================|| FIREBASE - REGISTER ||=========================== //

const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const [inputs, setInputs] = useState({
    email: '',
    token: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const { t } = useTranslation('login');

  const submit = async () => {
    try {
      const res = await API.post(`/api/user/reset`, inputs);
      const { success, message } = res.data;
      if (success) {
        let password = res.data.data;
        setNewPassword(password);
        copy(password, t('new_password'));
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  useEffect(() => {
    let email = searchParams.get('email');
    let token = searchParams.get('token');
    setInputs({
      token,
      email
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack spacing={3} padding={'24px'} justifyContent={'center'} alignItems={'center'}>
      {!inputs.email || !inputs.token ? (
        <Typography variant="h3" sx={{ textDecoration: 'none' }}>
          {t('invalid_link')}
        </Typography>
      ) : newPassword ? (
        <Alert severity="error">
          {t('your_new_password')}: <b>{newPassword}</b> <br />
          {t('password_reset_tip')}
        </Alert>
      ) : (
        <Button fullWidth onClick={submit} size="large" type="submit" variant="contained" color="primary">
          {t('click_reset_password')}
        </Button>
      )}
    </Stack>
  );
};

export default ResetPasswordForm;
