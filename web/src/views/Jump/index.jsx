import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Jump() {
  const { t } = useTranslation();
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const jump = params.get('url');
    const allowedUrls = ['opencat://', 'ama://'];
    if (jump && allowedUrls.some((url) => jump.startsWith(url))) {
      window.location.href = jump;
    }
  }, [location]);

  return <div>{t('jump')}</div>;
}
