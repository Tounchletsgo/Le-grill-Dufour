import { cookies, headers } from "next/headers";
import type { Locale } from "./types";
import { getDictionary } from "./index";

const LOCALE_COOKIE = "gdf-locale";

export function getLocale(): Locale {
  const headerLocale = headers().get("x-locale");
  if (headerLocale === "nl") return "nl";

  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  if (cookieLocale === "nl") return "nl";

  return "fr";
}

export function getServerDictionary() {
  const locale = getLocale();
  return { locale, dict: getDictionary(locale) };
}
