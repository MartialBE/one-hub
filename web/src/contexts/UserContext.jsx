// contexts/User/index.jsx
import React, { useEffect, useCallback, createContext, useState } from 'react';
import { API, LoginCheckAPI } from 'utils/api';
import { LOGIN } from 'store/actions';
import { useDispatch } from 'react-redux';

export const UserContext = createContext();

// eslint-disable-next-line
const UserProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [userGroup, setUserGroup] = useState({});

  const loadUser = useCallback(async () => {
    const res = await LoginCheckAPI.get('/api/user/self');

    if (res.status === 200) {
      const { data } = res.data;
      dispatch({ type: LOGIN, payload: data });
    }
    setIsUserLoaded(true);
  }, [dispatch]);

  const loadUserGroup = useCallback(() => {
    try {
      API.get('/api/user_group_map').then((res) => {
        const { success, data } = res.data;
        if (success) {
          setUserGroup(data);
        }
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadUser();
    loadUserGroup();
  }, [loadUser, loadUserGroup]);

  return <UserContext.Provider value={{ loadUser, isUserLoaded, userGroup, loadUserGroup }}> {children} </UserContext.Provider>;
};

export default UserProvider;
