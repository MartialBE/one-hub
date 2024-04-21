import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
// import { normalizeLocale } from './resources';

import aboutZH from './locales/zh-CN/about.json';
import commonZH from './locales/zh-CN/common.json';
import homeZH from './locales/zh-CN/home.json';
import loginZH from './locales/zh-CN/login.json';
import menuZH from './locales/zh-CN/menu.json';

const resources = {
  'zh-CN': {
    about: aboutZH,
    common: commonZH,
    home: homeZH,
    login: loginZH,
    menu: menuZH
  }
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // backend: {
    //   loadPath: function (lng, ns) {
    //     const normalizedLng = normalizeLocale(lng);
    //     return `/locales/${normalizedLng}/${ns}.json`;
    //   }
    // },
    debug: true,
    load: 'currentOnly',
    // lng: 'en',
    ns: ['common'],
    fallbackLng: 'zh-CN',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false
    },
    detection: {
      caches: ['cookie'],
      cookieMinutes: 60 * 24 * 30,
      lookupCookie: 'OneAPI_i18n'
    }
  });

export default i18n;
