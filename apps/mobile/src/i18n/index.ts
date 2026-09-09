// CareGrid Localization Foundation (i18next)
// Supports: Marathi (Default), Hindi, English

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import mr from './mr.json';
import hi from './hi.json';
import en from './en.json';
import { Language } from '@rhcp/shared-types';

export const resources = {
  mr: { translation: mr },
  hi: { translation: hi },
  en: { translation: en },
} as const;

export type SupportedLanguage = 'mr' | 'hi' | 'en';

// NOTE: Production default per CareGrid SRS = 'mr' (Marathi, rural Maharashtra).
// Set to 'en' here for development/testing convenience. Switch back to 'mr' before production build.
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// In-memory language storage fallback for cross-platform/node environment
let currentActiveLanguage: SupportedLanguage = DEFAULT_LANGUAGE;

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });
}

/**
 * Switch active application language
 */
export async function setLanguage(lang: SupportedLanguage | Language): Promise<void> {
  const normalized: SupportedLanguage =
    lang === 'MARATHI' || lang === 'mr'
      ? 'mr'
      : lang === 'HINDI' || lang === 'hi'
      ? 'hi'
      : 'en';

  currentActiveLanguage = normalized;
  await i18n.changeLanguage(normalized);
}

/**
 * Get current active language
 */
export function getCurrentLanguage(): SupportedLanguage {
  return (i18n.language as SupportedLanguage) || currentActiveLanguage || DEFAULT_LANGUAGE;
}

/**
 * Helper to translate with parameters
 */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

export default i18n;
