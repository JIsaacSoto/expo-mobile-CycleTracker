import React, { createContext, useContext, useMemo } from "react";
import { getLocales } from "expo-localization";
import { format } from "date-fns";
import { enUS, es as esLocale, type Locale } from "date-fns/locale";
import { fromISODate, type ISODate } from "@/lib/dates";
import type { LanguagePreference } from "@/types/preferences";
import en from "./en";
import es from "./es";
import type { Language, TranslationKey, TranslationParams, Translations } from "./types";

export type { Language, TranslationKey, TranslationParams } from "./types";

const dictionaries: Record<Language, Translations> = { es, en };
const dateLocales: Record<Language, Locale> = { es: esLocale, en: enUS };

export type DateStyle = "long" | "medium" | "short" | "full" | "monthYear" | "weekday";

const DATE_PATTERNS: Record<Language, Record<DateStyle, string>> = {
  es: {
    long: "EEEE, d 'de' MMMM",
    medium: "d 'de' MMMM",
    short: "d MMM",
    full: "d 'de' MMMM 'de' yyyy",
    monthYear: "MMMM yyyy",
    weekday: "EEEE",
  },
  en: {
    long: "EEEE, MMMM d",
    medium: "MMMM d",
    short: "MMM d",
    full: "MMMM d, yyyy",
    monthYear: "MMMM yyyy",
    weekday: "EEEE",
  },
};

export function deviceLanguage(): Language {
  try {
    const code = getLocales()[0]?.languageCode;
    return code === "es" ? "es" : "en";
  } catch {
    return "en";
  }
}

export function resolveLanguage(preference: LanguagePreference): Language {
  return preference === "es" || preference === "en" ? preference : deviceLanguage();
}

function lookup(dict: Translations, path: string): string | undefined {
  let node: unknown = dict;
  for (const part of path.split(".")) {
    if (node && typeof node === "object" && part in (node as object)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === "string" ? node : undefined;
}

export function translate(
  language: Language,
  key: TranslationKey,
  params?: TranslationParams
): string {
  const dict = dictionaries[language];
  let template: string | undefined;
  if (params && typeof params.count === "number") {
    template = lookup(dict, `${key}_${params.count === 1 ? "one" : "other"}`);
  }
  template ??= lookup(dict, key);
  if (template === undefined) return key;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    params?.[name] !== undefined ? String(params[name]) : ""
  );
}

export function capitalize(text: string): string {
  return text ? text.charAt(0).toLocaleUpperCase() + text.slice(1) : text;
}

export function formatISODate(language: Language, iso: ISODate, style: DateStyle = "medium"): string {
  return format(fromISODate(iso), DATE_PATTERNS[language][style], {
    locale: dateLocales[language],
  });
}

export interface I18nValue {
  language: Language;
  dateLocale: Locale;
  t: (key: TranslationKey, params?: TranslationParams) => string;
  /** Translation stored as "a|b|c", returned as a list. */
  tList: (key: TranslationKey) => string[];
  formatDate: (iso: ISODate, style?: DateStyle) => string;
}

function createI18n(language: Language): I18nValue {
  return {
    language,
    dateLocale: dateLocales[language],
    t: (key, params) => translate(language, key, params),
    tList: (key) => translate(language, key).split("|").filter(Boolean),
    formatDate: (iso, style) => formatISODate(language, iso, style),
  };
}

const I18nContext = createContext<I18nValue>(createI18n("es"));

export function I18nProvider({
  language,
  children,
}: {
  language: Language;
  children: React.ReactNode;
}) {
  const value = useMemo(() => createI18n(language), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
