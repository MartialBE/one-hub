// material-ui
import { Link, Container, Box } from '@mui/material';
import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

// ==============================|| FOOTER - AUTHENTICATION 2 & 3 ||============================== //

const Footer = () => {
  const siteInfo = useSelector((state) => state.siteInfo);
  const { t } = useTranslation();

  return (
    <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '64px' }}>
      <Box sx={{ textAlign: 'center' }}>
        {siteInfo.footer_html ? (
          <div className="custom-footer" dangerouslySetInnerHTML={{ __html: siteInfo.footer_html }}></div>
        ) : (
          <>
            <Link href="https://github.com/MartialBE/one-hub" target="_blank">
              {siteInfo.system_name} {import.meta.env.VITE_APP_VERSION}{' '}
            </Link>
            {t('footer.developedBy')}{' '}
            <Link href="https://github.com/MartialBE" target="_blank">
              MartialBE
            </Link>
            ，{t('footer.basedOn')}{' '}
            <Link href="https://github.com/songquanpeng" target="_blank">
              JustSong
            </Link>{' '}
            One Hub，{t('footer.sourceCode')}
            <Link href="https://opensource.org/licenses/mit-license.php"> {t('footer.license')}</Link>
          </>
        )}
      </Box>
    </Container>
  );
};

export default Footer;
