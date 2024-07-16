import { API } from 'utils/api';
import { useNavigate } from 'react-router';
import { showSuccess } from 'utils/common';
import { useTranslation } from 'react-i18next';

const useRegister = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const register = async (input, turnstile) => {
    try {
      let affCode = localStorage.getItem('aff');
      if (affCode) {
        input = { ...input, aff_code: affCode };
      }

      const res = await API.post(`/api/user/register?turnstile=${turnstile}`, input);
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('common.registerOk'));
        navigate('/login');
      }
      return { success, message };
    } catch (err) {
      // 请求失败，设置错误信息
      return { success: false, message: '' };
    }
  };

  const sendVerificationCode = async (email, turnstile) => {
    try {
      const res = await API.get(`/api/verification?email=${email}&turnstile=${turnstile}`);
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('common.registerTip'));
      }
      return { success, message };
    } catch (err) {
      // 请求失败，设置错误信息
      return { success: false, message: '' };
    }
  };

  return { register, sendVerificationCode };
};

export default useRegister;
