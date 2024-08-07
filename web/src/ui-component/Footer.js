// material-ui
import {  Container } from '@mui/material';
import React from 'react';
import { useSelector } from 'react-redux';

// ==============================|| FOOTER - AUTHENTICATION 2 & 3 ||============================== //

const Footer = () => {
  const siteInfo = useSelector((state) => state.siteInfo);
  return (
    <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'auto' }}>
          <div className="custom-footer" dangerouslySetInnerHTML={{ __html: siteInfo.footer_html }}></div>
    </Container>
  );
};

export default Footer;
