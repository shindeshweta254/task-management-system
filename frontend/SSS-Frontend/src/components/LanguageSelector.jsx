import { useTranslation } from "react-i18next";
import i18n from "../i18n/i18n";

function LanguageSelector() {
  const { t } = useTranslation();

  const current = i18n.language || localStorage.getItem("app_language") || "en";

  return (
    <div className="lang-selector">
      <label style={{ display: "none" }}>{t("app.name")}</label>
      <select
        value={current}
        onChange={(e) => {
          const next = e.target.value;
          localStorage.setItem("app_language", next);
          i18n.changeLanguage(next);
        }}
        style={{ minWidth: 140 }}
      >
        <option value="en">English</option>
        <option value="hi">हिंदी</option>
        <option value="mr">मराठी</option>
      </select>
    </div>
  );
}

export default LanguageSelector;

