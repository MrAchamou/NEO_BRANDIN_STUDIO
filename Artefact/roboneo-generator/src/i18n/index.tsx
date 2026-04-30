/**
 * AI BRAND OS — i18n engine
 *
 * Architecture :
 *  - Pas de strings codées en dur dans les composants : tout passe par t(key).
 *  - 6 langues initiales (en, fr, es, de, it, pt) ; ajouter une langue =
 *    ajouter un fichier JSON et l'enregistrer dans `LOCALES`.
 *  - Persistence : localStorage `aibrandos.ui_lang` + `aibrandos.output_lang`.
 *  - Output language (langue des sorties IA) distincte de l'UI language.
 *  - Fallback EN si clé manquante. Warning console en dev uniquement.
 *  - Variable interpolation : `t("brief.module_count", { filled: 3, total: 10 })`.
 */

import React, {
  createContext, useContext, useState, useCallback, useEffect, useMemo,
  type ReactNode,
} from "react";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import de from "./locales/de.json";
import it from "./locales/it.json";
import pt from "./locales/pt.json";

export type Locale = "en" | "fr" | "es" | "de" | "it" | "pt";

export const LOCALES: Record<Locale, typeof en> = {
  en, fr, es, de, it, pt,
};

export const SUPPORTED_LOCALES: Array<{ code: Locale; flag: string; native: string; english: string }> = [
  { code: "en", flag: "🇬🇧", native: "English",    english: "English" },
  { code: "fr", flag: "🇫🇷", native: "Français",   english: "French" },
  { code: "es", flag: "🇪🇸", native: "Español",    english: "Spanish" },
  { code: "de", flag: "🇩🇪", native: "Deutsch",    english: "German" },
  { code: "it", flag: "🇮🇹", native: "Italiano",   english: "Italian" },
  { code: "pt", flag: "🇵🇹", native: "Português",  english: "Portuguese" },
];

const UI_KEY = "aibrandos.ui_lang";
const OUT_KEY = "aibrandos.output_lang";
const DEFAULT_LOCALE: Locale = "fr"; // l'utilisateur travaille en français

// ─── Storage helpers ────────────────────────────────────────────────────────

function readLocale(key: string, fallback: Locale): Locale {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw && raw in LOCALES) return raw as Locale;
  } catch {}
  return fallback;
}

function writeLocale(key: string, value: Locale) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, value); } catch {}
}

// ─── Translate function ─────────────────────────────────────────────────────

function getNested(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object" && k in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, obj);
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{{${k}}}`,
  );
}

const missingKeysWarned = new Set<string>();

function translateWith(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const value = getNested(LOCALES[locale], key);
  if (typeof value === "string") return interpolate(value, vars);

  // Fallback EN
  const fallback = getNested(LOCALES.en, key);
  if (typeof fallback === "string") {
    if (import.meta.env.DEV && !missingKeysWarned.has(`${locale}:${key}`)) {
      missingKeysWarned.add(`${locale}:${key}`);
      // eslint-disable-next-line no-console
      console.warn(`[i18n] Missing key for locale "${locale}": ${key} (fell back to en)`);
    }
    return interpolate(fallback, vars);
  }

  if (import.meta.env.DEV && !missingKeysWarned.has(`MISSING:${key}`)) {
    missingKeysWarned.add(`MISSING:${key}`);
    // eslint-disable-next-line no-console
    console.warn(`[i18n] Missing translation key entirely: ${key}`);
  }
  return key;
}

/**
 * Returns an array (used for module variants etc.). Falls back to EN if missing.
 */
function translateArrayWith(locale: Locale, key: string): string[] {
  const value = getNested(LOCALES[locale], key);
  if (Array.isArray(value)) return value as string[];
  const fallback = getNested(LOCALES.en, key);
  if (Array.isArray(fallback)) return fallback as string[];
  return [];
}

// ─── React Context ──────────────────────────────────────────────────────────

interface I18nContextValue {
  uiLocale: Locale;
  outputLocale: Locale;
  setUILocale: (l: Locale) => void;
  setOutputLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tArray: (key: string) => string[];
  /** ISO English name of output locale, useful to inject in AI prompts. */
  outputLanguageName: () => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const LANG_CHANGED_EVENT = "aibrandos:lang-changed";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [uiLocale, setUILocaleState] = useState<Locale>(() =>
    readLocale(UI_KEY, DEFAULT_LOCALE),
  );
  const [outputLocale, setOutputLocaleState] = useState<Locale>(() =>
    readLocale(OUT_KEY, readLocale(UI_KEY, DEFAULT_LOCALE)),
  );

  const setUILocale = useCallback((l: Locale) => {
    setUILocaleState(l);
    writeLocale(UI_KEY, l);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", l);
    }
    window.dispatchEvent(new CustomEvent(LANG_CHANGED_EVENT, { detail: { ui: l } }));
  }, []);

  const setOutputLocale = useCallback((l: Locale) => {
    setOutputLocaleState(l);
    writeLocale(OUT_KEY, l);
    window.dispatchEvent(new CustomEvent(LANG_CHANGED_EVENT, { detail: { output: l } }));
  }, []);

  // Set initial <html lang>
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", uiLocale);
    }
  }, [uiLocale]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translateWith(uiLocale, key, vars),
    [uiLocale],
  );

  const tArray = useCallback((key: string) => translateArrayWith(uiLocale, key), [uiLocale]);

  const outputLanguageName = useCallback(() => {
    return SUPPORTED_LOCALES.find((l) => l.code === outputLocale)?.english ?? "English";
  }, [outputLocale]);

  const value = useMemo<I18nContextValue>(
    () => ({ uiLocale, outputLocale, setUILocale, setOutputLocale, t, tArray, outputLanguageName }),
    [uiLocale, outputLocale, setUILocale, setOutputLocale, t, tArray, outputLanguageName],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useT must be used inside <I18nProvider>");
  }
  return ctx;
}

// ─── Standalone helpers (outside React tree) ────────────────────────────────

/**
 * Read the current UI/output locale from localStorage without React.
 * Use sparingly — prefer useT() inside components.
 */
export function getCurrentUILocale(): Locale {
  return readLocale(UI_KEY, DEFAULT_LOCALE);
}

export function getCurrentOutputLocale(): Locale {
  return readLocale(OUT_KEY, getCurrentUILocale());
}

/**
 * Listen to language changes outside React (e.g. fetch wrapper).
 */
export function onLanguageChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(LANG_CHANGED_EVENT, cb);
  return () => window.removeEventListener(LANG_CHANGED_EVENT, cb);
}
