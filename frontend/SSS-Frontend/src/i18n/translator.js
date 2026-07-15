const LANG_KEY = "lang";

const defaultLang = "en";

function getStoredLang() {
  const v = localStorage.getItem(LANG_KEY);
  return v ? String(v) : null;
}

export function getLang() {
  return getStoredLang() || defaultLang;
}

export function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
  window.dispatchEvent(new Event("langchange"));
}

// dictionary is simple object: { en: { key: '...' }, hi: {...}, mr: {...} }
import dictionary from "./dictionary";

export function t(key) {
  const lang = getLang();
  const langDict = dictionary?.[lang] || {};
  const enDict = dictionary?.en || {};

  return langDict[key] ?? enDict[key] ?? key;
}

