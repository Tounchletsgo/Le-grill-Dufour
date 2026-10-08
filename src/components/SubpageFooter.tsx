"use client";

import { useTranslation } from "@/i18n/LocaleContext";
import { localizedHref } from "@/i18n/types";

export default function SubpageFooter() {
  const { locale, t } = useTranslation();

  return (
    <footer className="carte-footer">
      <div className="container">
        <span className="carte-footer-brand">
          &copy; {new Date().getFullYear()} {t("home.copyright")}
          <span className="carte-footer-social">
            <a href="https://www.facebook.com/legrilldufour/" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" /></svg></a>
            <a href="https://www.instagram.com/legrilldufour/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 2.1.3 2.9.6.8.3 1.4.7 2 1.3.6.6 1 1.2 1.3 2 .3.8.5 1.7.6 2.9.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 2.1-.6 2.9-.3.8-.7 1.4-1.3 2-.6.6-1.2 1-2 1.3-.8.3-1.7.5-2.9.6-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-2.1-.3-2.9-.6-.8-.3-1.4-.7-2-1.3-.6-.6-1-1.2-1.3-2-.3-.8-.5-1.7-.6-2.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-2.1.6-2.9.3-.8.7-1.4 1.3-2 .6-.6 1.2-1 2-1.3.8-.3 1.7-.5 2.9-.6C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1 .1-1.6.2-2 .4-.5.2-.9.4-1.2.8-.4.3-.6.7-.8 1.2-.2.4-.3 1-.4 2-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1 .2 1.6.4 2 .2.5.4.9.8 1.2.3.4.7.6 1.2.8.4.2 1 .3 2 .4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1-.1 1.6-.2 2-.4.5-.2.9-.4 1.2-.8.4-.3.6-.7.8-1.2.2-.4.3-1 .4-2 .1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1-.2-1.6-.4-2-.2-.5-.4-.9-.8-1.2-.3-.4-.7-.6-1.2-.8-.4-.2-1-.3-2-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 1.8a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4zm5.7-2a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0z" /></svg></a>
          </span>
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
