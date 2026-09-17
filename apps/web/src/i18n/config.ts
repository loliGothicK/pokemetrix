import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslation from "@locales/en/translation.json";
import jaTranslation from "@locales/ja/translation.json";

export const supportedLngs = {
  en: "English",
  ja: "日本語",
} as const;

export const defaultLanguage = "en" as const;

export const getInitialLanguage = (): string => {
  if (typeof window !== "undefined") {
    const match = window.location.pathname.match(/^\/(en|ja)(?:\/|$)/);
    if (match?.[1]) {
      return match[1];
    }
  }
  return defaultLanguage;
};

export const supportedLanguageOptions = Object.entries(supportedLngs).map(([value, label]) => ({
  value,
  label,
}));

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslation,
    },
    ja: {
      translation: jaTranslation,
    },
  },
  lng: getInitialLanguage(),
  fallbackLng: defaultLanguage,
  returnEmptyString: true,
  supportedLngs: Object.keys(supportedLngs),
  debug: process.env.NODE_ENV === "development",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
