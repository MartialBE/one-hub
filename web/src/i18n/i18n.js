import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './resources';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh_CN',
    debug: true,
    lng: 'zh-CN',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
