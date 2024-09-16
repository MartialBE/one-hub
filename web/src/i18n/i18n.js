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
    debug: false,
    lng: 'zh-CN',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false // 设置为 false 可以避免一些问题
    }
  });

export default i18n;
