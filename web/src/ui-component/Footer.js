// material-ui
import {  Container, Box } from '@mui/material';
import React from 'react';
import { useSelector } from 'react-redux';

// ==============================|| FOOTER - AUTHENTICATION 2 & 3 ||============================== //

const Footer = () => {
  const siteInfo = useSelector((state) => state.siteInfo);

  return (
    <Container sx={{ display: 'none', justifyContent: 'center', alignItems: 'center', height: '0px' }}>
    </Container>
  );
};

export default Footer;
