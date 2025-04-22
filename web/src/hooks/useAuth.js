import { useIsAdmin } from 'utils/common';
import { useNavigate } from 'react-router-dom';

const useAuth = () => {
  const userIsAdmin = useIsAdmin();
  const navigate = useNavigate();

  if (!userIsAdmin) {
    navigate('/panel/404');
  }
};

export default useAuth;
