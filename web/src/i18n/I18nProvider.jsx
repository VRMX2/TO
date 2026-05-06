import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SUPPORTED_LANGUAGES, translations } from './translations';

const I18nContext = createContext(null);

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function interpolate(template, params) {
  if (!params) return template;
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => String(params[key.trim()] ?? ''));
}

function detectInitialLanguage() {
  const stored = localStorage.getItem('gt_lang');
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
  const browser = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return SUPPORTED_LANGUAGES.includes(browser) ? browser : 'en';
}

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(detectInitialLanguage);

  useEffect(() => {
    localStorage.setItem('gt_lang', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const value = useMemo(() => {
    const dictionary = translations[language] || translations.en;
    const fallback = translations.en;
    const t = (key, params) => {
      const resolved = getNestedValue(dictionary, key) ?? getNestedValue(fallback, key) ?? key;
      return interpolate(String(resolved), params);
    };
    return { language, setLanguage, t, isRtl: language === 'ar' };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return ctx;
}
