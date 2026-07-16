import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import i18nextHttpBackend from "i18next-http-backend";

// Init language from localStorage (fallback: en)
const savedLang = localStorage.getItem("app_language");
const initialLang = savedLang || "en";

i18n
  .use(i18nextHttpBackend)
  .use(initReactI18next)
  .init({
    react: {
      useSuspense: false,
    },
    fallbackLng: "en",
    lng: initialLang,
    debug: false,
    backend: {
      // public path relative to Vite dev server
      loadPath: "/locales/{{lng}}/translation.json",
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

