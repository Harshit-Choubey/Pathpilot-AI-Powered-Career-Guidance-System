import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "compare_careers": "Compare Careers",
      "skill_gap": "Skill Gap Analysis",
      "ai_guide": "AI Career Guide",
      "logout": "Log out"
    }
  },
  hi: {
    translation: {
      "dashboard": "डैशबोर्ड",
      "compare_careers": "करियर की तुलना करें",
      "skill_gap": "कौशल अंतराल विश्लेषण",
      "ai_guide": "एआई करियर गाइड",
      "logout": "लॉग आउट"
    }
  },
  mr: {
    translation: {
      "dashboard": "डॅशबोर्ड",
      "compare_careers": "करिअरची तुलना करा",
      "skill_gap": "कौशल्य अंतर विश्लेषण",
      "ai_guide": "एआय करिअर मार्गदर्शक",
      "logout": "बाहेर पडा"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
