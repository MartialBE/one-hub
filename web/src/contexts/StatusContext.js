import { useEffect, useCallback, createContext } from 'react';
import { API } from 'utils/api';
import { showNotice, showError } from 'utils/common';
import { SET_SITE_INFO } from 'store/actions';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

export const LoadStatusContext = createContext();

// eslint-disable-next-line
const StatusProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('common');

  const loadStatus = useCallback(async () => {
    let system_name = '';
    try {
      const res = await API.get('/api/status');
      const { success, data } = res.data;
      if (success) {
        if (!data.chat_link) {
          delete data.chat_link;
        }
        localStorage.setItem('siteInfo', JSON.stringify(data));
        localStorage.setItem('quota_per_unit', data.quota_per_unit);
        localStorage.setItem('display_in_currency', data.display_in_currency);
        dispatch({ type: SET_SITE_INFO, payload: data });
        if (
          data.version !== process.env.REACT_APP_VERSION &&
          data.version !== 'v0.0.0' &&
          data.version !== '' &&
          process.env.REACT_APP_VERSION !== ''
        ) {
          showNotice(t('new_version', { version: data.version }));
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
      showError(t('error.server_error'));
    }

    if (system_name) {
      document.title = system_name;
    }
  }, [dispatch, t]);

  useEffect(() => {
    loadStatus().then();
  }, [loadStatus]);

  return <LoadStatusContext.Provider value={loadStatus}> {children} </LoadStatusContext.Provider>;
};

export default StatusProvider;
