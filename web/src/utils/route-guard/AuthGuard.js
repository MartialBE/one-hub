import { useSelector } from 'react-redux';
import { useEffect, useContext } from 'react';
import { UserContext } from 'contexts/UserContext';
import { useNavigate } from 'react-router-dom';

const AuthGuard = ({ children }) => {
  const account = useSelector((state) => state.account);
  const { isUserLoaded } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isUserLoaded && !account.user) {
      navigate('/login');
      return;
    }
  }, [account, navigate, isUserLoaded]);

  // 在用户信息加载完成前不渲染子组件
  if (!isUserLoaded) {
    return null;
  }

  return children;
};

export default AuthGuard;
