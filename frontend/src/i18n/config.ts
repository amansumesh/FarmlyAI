import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import hi from './locales/hi.json';
import ta from './locales/ta.json';
import ml from './locales/ml.json';
import te from './locales/te.json';
import kn from './locales/kn.json';
import en from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      hi: { translation: hi },
      ta: { translation: ta },
      ml: { translation: ml },
      te: { translation: te },
      kn: { translation: kn },
      en: { translation: en }
    },
    lng: localStorage.getItem('i18nextLng') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
