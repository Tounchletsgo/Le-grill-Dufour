"use client";

import { useLocale } from "@/i18n/LocaleContext";
import { localizedHref } from "@/i18n/types";

export default function LanguageSwitcher({ currentPath = "/" }: { currentPath?: string }) {
  const { locale } = useLocale();

  const frHref = currentPath.startsWith("/nl") ? currentPath.replace(/^\/nl/, "") || "/" : currentPath;
  const nlHref = localizedHref(frHref, "nl");

  const setLocaleCookie = (loc: string) => {
    document.cookie = `gdf-locale=${loc};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`;
  };

  return (
    <span className="lang-switch">
      <a
        href={locale === "nl" ? frHref : undefined}
        className={`lang-switch-item${locale === "fr" ? " is-active" : ""}`}
        onClick={() => setLocaleCookie("fr")}
        aria-current={locale === "fr" ? "true" : undefined}
      >
        FR
      </a>
      <span className="lang-switch-sep" aria-hidden="true">|</span>
      <a
        href={locale === "fr" ? nlHref : undefined}
        className={`lang-switch-item${locale === "nl" ? " is-active" : ""}`}
        onClick={() => setLocaleCookie("nl")}
        aria-current={locale === "nl" ? "true" : undefined}
      >
        NL
      </a>
    </span>
  );
}
