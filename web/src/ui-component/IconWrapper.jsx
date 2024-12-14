import { forwardRef } from 'react';
import UnknownType from 'assets/images/icons/unknown_type.svg';
import { styled } from '@mui/material/styles';

const IconWrapperStyled = styled('div')(({ theme }) => ({
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 1)' : 'transparent',
  '& img': {
    width: '20px',
    height: '20px'
  }
}));

const IconWrapper = forwardRef(({ children, url, ...other }, ref) => {
  return (
    <IconWrapperStyled ref={ref} {...other}>
      <img src={url || UnknownType} alt={url} />
      {children}
    </IconWrapperStyled>
  );
});

export default IconWrapper;
