import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/translation.json';
import hi from './locales/hi/translation.json';
import mr from './locales/mr/translation.json';

// Retrieve saved language from localStorage or fall back to English
const savedLang = localStorage.getItem('pathpilot_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Persist language choice whenever it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('pathpilot_language', lng);
});

export default i18n;
