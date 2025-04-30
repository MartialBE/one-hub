import { API, LoginCheckAPI } from 'utils/api';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { LOGIN, SET_USER_GROUP } from 'store/actions';
import { useNavigate } from 'react-router';
import { showSuccess } from 'utils/common';
import { useTranslation } from 'react-i18next';

const useLogin = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const login = async (username, password) => {
    try {
      const res = await API.post(`/api/user/login`, {
        username,
        password
      });
      const { success, message } = res.data;
      if (success) {
        loadUser();
        loadUserGroup();
        navigate('/panel');
      }
      return { success, message };
    } catch (err) {
      // 请求失败，设置错误信息
      return { success: false, message: '' };
    }
  };

  const githubLogin = async (code, state) => {
    try {
      const affCode = localStorage.getItem('aff');
      const res = await API.get(`/api/oauth/github?code=${code}&state=${state}&aff=${affCode}`);
      const { success, message } = res.data;
      if (success) {
        if (message === 'bind') {
          showSuccess(t('common.bindOk'));
          navigate('/panel');
        } else {
          loadUser();
          loadUserGroup();
          showSuccess(t('common.loginOk'));
          navigate('/panel');
        }
      }
      return { success, message };
    } catch (err) {
      // 请求失败，设置错误信息
      return { success: false, message: '' };
    }
  };

  const oidcLogin = async (code, state) => {
    try {
      const affCode = localStorage.getItem('aff');
      const res = await API.get(`/api/oauth/oidc?code=${code}&state=${state}&aff=${affCode}`);
      const { success, message } = res.data;
      if (success) {
        if (message === 'bind') {
          showSuccess(t('common.bindOk'));
          navigate('/panel');
        } else {
          loadUser();
          loadUserGroup();
          showSuccess(t('common.loginOk'));
          navigate('/panel');
        }
      }
      return { success, message };
    } catch (err) {
      // 请求失败，设置错误信息
      return { success: false, message: '' };
    }
  };

  const larkLogin = async (code, state) => {
    try {
      const affCode = localStorage.getItem('aff');
      const res = await API.get(`/api/oauth/lark?code=${code}&state=${state}&aff=${affCode}`);
      const { success, message } = res.data;
      if (success) {
        if (message === 'bind') {
          showSuccess(t('common.bindOk'));
          navigate('/panel');
        } else {
          loadUser();
          showSuccess(t('common.loginOk'));
          navigate('/panel');
        }
      }
      return { success, message };
    } catch (err) {
      // 请求失败，设置错误信息
      return { success: false, message: '' };
    }
  };

  const wechatLogin = async (code) => {
    try {
      const affCode = localStorage.getItem('aff');
      const res = await API.get(`/api/oauth/wechat?code=${code}&aff=${affCode}`);
      const { success, message } = res.data;
      if (success) {
        loadUser();
        loadUserGroup();
        showSuccess(t('common.loginOk'));
        navigate('/panel');
      }
      return { success, message };
    } catch (err) {
      // 请求失败，设置错误信息
      return { success: false, message: '' };
    }
  };

  const logout = async () => {
    await API.get('/api/user/logout');
    localStorage.removeItem('user');
    dispatch({ type: LOGIN, payload: null });
    navigate('/');
  };

  const loadUser = useCallback(async () => {
    try {
      const res = await LoginCheckAPI.get('/api/user/self');
      const { success, data } = res.data;
      if (success) {
        dispatch({ type: LOGIN, payload: data });
        return data;
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [dispatch]);

  const loadUserGroup = useCallback(() => {
    try {
      API.get('/api/user_group_map').then((res) => {
        const { success, data } = res.data;
        if (success) {
          dispatch({ type: SET_USER_GROUP, payload: data });
        }
      });
    } catch (error) {
      console.error(error);
    }
    return [];
  }, []);

  return { login, logout, githubLogin, wechatLogin, larkLogin, oidcLogin, loadUser, loadUserGroup };
};

export default useLogin;
