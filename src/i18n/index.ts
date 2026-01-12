// ============================================
// I18N - INTERNATIONALIZATION SYSTEM
// ============================================

import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import es from './locales/es.json';

export type Locale = 'pt-BR' | 'en' | 'es';

export const locales: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  'en': en,
  'es': es,
};

export const localeNames: Record<Locale, string> = {
  'pt-BR': 'Português (BR)',
  'en': 'English',
  'es': 'Español',
};

// Get current locale from localStorage or default to pt-BR
export function getCurrentLocale(): Locale {
  if (typeof window === 'undefined') return 'pt-BR';
  const saved = localStorage.getItem('app_language');
  if (saved && saved in locales) return saved as Locale;
  return 'pt-BR';
}

// Set locale in localStorage
export function setCurrentLocale(locale: Locale): void {
  localStorage.setItem('app_language', locale);
}

// Get translation
export function t(key: string, locale?: Locale): string {
  const currentLocale = locale || getCurrentLocale();
  const translations = locales[currentLocale];
  
  // Navigate nested keys like "common.loading"
  const keys = key.split('.');
  let value: unknown = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // Return key if translation not found (silent fail in production)
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

// Hook-friendly translation getter
export function useTranslation() {
  const locale = getCurrentLocale();
  
  return {
    t: (key: string) => t(key, locale),
    locale,
    setLocale: setCurrentLocale,
  };
}

export default { t, getCurrentLocale, setCurrentLocale, locales, localeNames };