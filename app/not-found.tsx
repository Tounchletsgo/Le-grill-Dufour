import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { getDictionary, t } from "@/i18n";
import { localizedHref } from "@/i18n/types";

export function generateMetadata(): Metadata {
  const locale = getLocale();
  const dict = getDictionary(locale);
  return {
    title: t(dict, "meta.notFoundTitle"),
    robots: "noindex",
  };
}

export default function NotFound() {
  const locale = getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <a href={localizedHref("/", locale)} className="not-found-brand">
          <img
            src="/images/logo/grill-dufour-logo-noir.svg"
            alt="Le Grill Dufour — Restaurant"
            width={200}
            height={96}
          />
        </a>
        <h1>404</h1>
        <p className="not-found-title">{t(dict, "notFound.title")}</p>
        <p className="not-found-text">{t(dict, "notFound.text")}</p>
        <div className="not-found-actions">
          <a href={localizedHref("/", locale)} className="btn btn-primary">
            {t(dict, "notFound.backHome")}
          </a>
          <a href={localizedHref("/la-carte", locale)} className="btn btn-outline">
            {t(dict, "notFound.seeCarte")}
          </a>
          <a href={localizedHref("/commander", locale)} className="btn btn-outline">
            {t(dict, "notFound.order")}
          </a>
        </div>
      </div>
    </div>
  );
}
