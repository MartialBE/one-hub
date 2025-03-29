import { styled } from '@mui/material/styles';
import { Container } from '@mui/material';

const AdminContainer = styled(Container)(({ theme }) => ({
  paddingLeft: '0px !important',
  paddingRight: '0px !important',
  paddingBottom: '30px !important',
  marginBottom: '30px !important',
  [theme.breakpoints.up('md')]: {
    maxWidth: '1400px'
  }
}));

export default AdminContainer;
