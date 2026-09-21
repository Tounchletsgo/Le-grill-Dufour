"use client";

import { useTranslation } from "@/i18n/LocaleContext";
import { localizedHref } from "@/i18n/types";

export default function SubpageFooter() {
  const { locale, t } = useTranslation();

  return (
    <footer className="carte-footer">
      <div className="container">
        <span>
          &copy; {new Date().getFullYear()} {t("home.copyright")}
        </span>
        <span>
          <a href={localizedHref("/politique-de-confidentialite", locale)}>{t("home.privacy")}</a>
          {" · "}
          <a href={localizedHref("/mentions-legales", locale)}>{t("home.legalNotice")}</a>
        </span>
      </div>
    </footer>
  );
}
