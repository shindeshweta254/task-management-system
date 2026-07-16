import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import "./SelectLanguage.css";

function SelectLanguage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const currentLang = useMemo(() => {
    return localStorage.getItem("app_language") || "en";
  }, []);

  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "mr", label: "मराठी" },
  ];

  const select = (lng) => {
    localStorage.setItem("app_language", lng);
    // i18n instance is initialised in src/i18n/i18n.js
    // eslint-disable-next-line global-require
    const i18n = require("../../i18n/i18n").default;
    i18n.changeLanguage(lng);
    navigate("/dashboard");
  };

  return (
    <div className="sl-page">
      <div className="sl-card">
        <h1 className="sl-title">{t("language.selectTitle")}</h1>
        <p className="sl-subtitle">{t("language.selectSubtitle")}</p>

        <div className="sl-grid">
          {languages.map((l) => {
            const active = l.code === currentLang;
            return (
              <button
                key={l.code}
                type="button"
                className={active ? "sl-lang-card active" : "sl-lang-card"}
                onClick={() => select(l.code)}
              >
                <div className="sl-lang-label">{l.label}</div>
                {active && <div className="sl-lang-badge">{t("language.current")}</div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SelectLanguage;

