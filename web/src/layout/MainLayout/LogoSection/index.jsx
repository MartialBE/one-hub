import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// material-ui
import { ButtonBase, Box } from '@mui/material';

// project imports
import config from 'config';
import Logo from 'ui-component/Logo';
import { MENU_OPEN } from 'store/actions';

// ==============================|| MAIN LOGO ||============================== //

const LogoSection = () => {
  const defaultId = useSelector((state) => state.customization.defaultId);
  const dispatch = useDispatch();

  return (
    <ButtonBase
      disableRipple
      onClick={() => dispatch({ type: MENU_OPEN, id: defaultId })}
      component={Link}
      to={config.basename}
      sx={{
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          opacity: 0.9
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Logo />
      </Box>
    </ButtonBase>
  );
};

export default LogoSection;
