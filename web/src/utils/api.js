import { showError } from './common';
import axios from 'axios';
import { store } from '../store';
import { LOGIN } from 'store/actions';

export const API = axios.create({
  // ... 其他代码 ...
  withCredentials: true, // 确保携带 cookie

  baseURL: import.meta.env.VITE_APP_SERVER || '/'
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      store.dispatch({ type: LOGIN, payload: null });
      // window.location.href = '/login';
    }

    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    showError(error);
  }
);

export const LoginCheckAPI = axios.create({
  // ... 其他代码 ...
  withCredentials: true, // 确保携带 cookie

  baseURL: import.meta.env.VITE_APP_SERVER || '/'
});
