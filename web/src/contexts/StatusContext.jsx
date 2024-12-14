import { useEffect, useCallback, createContext } from 'react';
import { API } from 'utils/api';
import { showNotice, showError } from 'utils/common';
import { SET_SITE_INFO, SET_MODEL_OWNEDBY } from 'store/actions';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

export const LoadStatusContext = createContext();

// eslint-disable-next-line
const StatusProvider = ({ children }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const loadStatus = useCallback(async () => {
    let system_name = '';
    try {
      const res = await API.get('/api/status');
      const { success, data } = res.data;
      if (success) {
        if (!data.chat_link) {
          delete data.chat_link;
        }
        // 设置系统默认语言
        const storedLanguage = localStorage.getItem('appLanguage') || data.language || 'zh_CN';
        localStorage.setItem('default_language', storedLanguage);
        i18n.changeLanguage(storedLanguage);
        localStorage.setItem('siteInfo', JSON.stringify(data));
        localStorage.setItem('quota_per_unit', data.quota_per_unit);
        localStorage.setItem('display_in_currency', data.display_in_currency);
        dispatch({ type: SET_SITE_INFO, payload: data });
        if (
          data.version !== import.meta.env.VITE_APP_VERSION &&
          data.version !== 'v0.0.0' &&
          data.version !== '' &&
          import.meta.env.VITE_APP_VERSION !== ''
        ) {
          showNotice(t('common.unableServerTip', { version: data.version }));
        }
        if (data.system_name) {
          system_name = data.system_name;
        }
      } else {
        const backupSiteInfo = localStorage.getItem('siteInfo');
        if (backupSiteInfo) {
          const data = JSON.parse(backupSiteInfo);
          if (data.system_name) {
            system_name = data.system_name;
          }
          dispatch({
            type: SET_SITE_INFO,
            payload: data
          });
        }
      }
    } catch (error) {
      showError(t('common.unableServer'));
    }

    if (system_name) {
      document.title = system_name;
    }
    // eslint-disable-next-line
  }, [dispatch]);

  const loadOwnedby = useCallback(async () => {
    try {
      const res = await API.get('/api/model_ownedby');
      const { success, data } = res.data;
      if (success) {
        dispatch({ type: SET_MODEL_OWNEDBY, payload: data });
      }
    } catch (error) {
      showError(error.message);
    }
  }, [dispatch]);

  useEffect(() => {
    loadStatus().then();
    loadOwnedby();
  }, [loadStatus, loadOwnedby]);

  return <LoadStatusContext.Provider value={loadStatus}> {children} </LoadStatusContext.Provider>;
};

export default StatusProvider;
