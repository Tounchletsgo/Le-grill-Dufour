"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "./types";
import type { TranslationKeys } from "./fr";
import { getDictionary, t as tFn } from "./index";

interface LocaleContextValue {
  locale: Locale;
  dict: TranslationKeys;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => {
    const dict = getDictionary(locale);
    return {
      locale,
      dict,
      t: (key: string, vars?: Record<string, string | number>) => tFn(dict, key, vars),
    };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    const dict = getDictionary("fr");
    return {
      locale: "fr",
      dict,
      t: (key: string, vars?: Record<string, string | number>) => tFn(dict, key, vars),
    };
  }
  return ctx;
}

export function useTranslation() {
  return useLocale();
}
