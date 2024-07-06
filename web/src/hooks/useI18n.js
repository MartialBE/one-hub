import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const useI18n = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const handleLanguageChange = (lang) => {
      localStorage.setItem('appLanguage', lang);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return i18n;
};

export default useI18n;
