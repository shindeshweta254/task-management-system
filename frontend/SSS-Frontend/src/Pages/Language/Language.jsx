import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import "./Language.css";
import { setLang } from "../../i18n/translator";

function languageRouteForRole(roleName) {
  const r = (roleName || "").toUpperCase();
  if (r === "EMPLOYEE") return "/dashboard";
  if (r === "MANAGER") return "/manager-dashboard";
  if (r === "DIRECTOR") return "/director-dashboard";
  if (r === "SUPERVISOR") return "/supervisor-dashboard";
  return "/dashboard";
}

function Language() {
  const navigate = useNavigate();
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  const roleName = user?.role?.roleName || "EMPLOYEE";
  const [busy, setBusy] = useState(false);

  const circles = [
    { key: "hi", label: "Hindi" },
    { key: "en", label: "English" },
    { key: "mr", label: "Marathi" },
  ];

  const onSelect = async (langKey) => {
    if (busy) return;
    setBusy(true);
    setLang(langKey);
    navigate(languageRouteForRole(roleName));
  };

  return (
    <div className="language-page">
      <div className="language-card">
        <h2>Choose Language</h2>
        <p className="language-subtitle">Select language (Hindi / English / Marathi)</p>

        <div className="language-circles">
          {circles.map((c) => (
            <button
              key={c.key}
              type="button"
              className="lang-circle"
              onClick={() => onSelect(c.key)}
              disabled={busy}
              aria-label={c.label}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Language;

