// contexts/User/index.jsx
import React, { useEffect, useCallback, createContext, useState } from 'react';
import useLogin from 'hooks/useLogin';

export const UserContext = createContext();

// eslint-disable-next-line
const UserProvider = ({ children }) => {
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  // const [userGroup, setUserGroup] = useState({});
  const { loadUser: loadUserAction, loadUserGroup: loadUserGroupAction } = useLogin();

  const loadUser = useCallback(async () => {
    setIsUserLoaded(false);
    await loadUserAction();
    setIsUserLoaded(true);
  }, [loadUserAction]);

  const loadUserGroup = useCallback(() => {
    loadUserGroupAction();
  }, [loadUserGroupAction]);

  useEffect(() => {
    loadUser();
    loadUserGroup();
  }, [loadUser, loadUserGroup]);

  return <UserContext.Provider value={{ loadUser, isUserLoaded, loadUserGroup }}> {children} </UserContext.Provider>;
};

export default UserProvider;
