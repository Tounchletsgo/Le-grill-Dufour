export { type Locale, defaultLocale, locales, routeMap, resolveLocaleFromPath, localizedHref } from "./types";
export { type TranslationKeys } from "./fr";

import fr from "./fr";
import nl from "./nl";
import type { TranslationKeys } from "./fr";
import type { Locale } from "./types";

const dictionaries: Record<Locale, TranslationKeys> = { fr, nl };

export function getDictionary(locale: Locale): TranslationKeys {
  return dictionaries[locale] ?? dictionaries.fr;
}

function resolve(obj: unknown, parts: string[]): unknown {
  let value = obj;
  for (const part of parts) {
    if (value && typeof value === "object" && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return value;
}

export function t(dict: TranslationKeys, key: string, vars?: Record<string, string | number>): string {
  const parts = key.split(".");
  let value = resolve(dict, parts);

  if (value === undefined) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] Missing translation key: ${key}`);
    }
    value = resolve(fr, parts);
    if (value === undefined) return key;
  }

  let result = typeof value === "string" ? value : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return result;
}
