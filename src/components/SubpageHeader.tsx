"use client";

import { useTranslation } from "@/i18n/LocaleContext";
import { localizedHref } from "@/i18n/types";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileNav from "./MobileNav";

interface SubpageHeaderProps {
  currentPath: string;
}

export default function SubpageHeader({ currentPath }: SubpageHeaderProps) {
  const { locale, t } = useTranslation();

  const navLinks = [
    { frRoute: "/", label: t("nav.home") },
    { frRoute: "/la-carte", label: t("nav.carte") },
    { frRoute: "/commander", label: t("nav.order") },
    { frRoute: "/reserver", label: t("nav.reserve") },
    { frRoute: "/cheques-cadeaux", label: t("nav.giftCards") },
    { frRoute: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className="carte-header subpage-header">
      <div className="container carte-header-inner">
        <a href={localizedHref("/", locale)} className="brand">
          <img
            src="/images/logo/grill-dufour-logo-noir.svg"
            alt="Le Grill Dufour — Restaurant"
            className="brand-logo"
            width={100}
            height={48}
          />
        </a>
        <nav className="carte-nav" aria-label={t("nav.mainNav")}>
          {navLinks.map((link) => {
            const href = localizedHref(link.frRoute, locale);
            return (
              <a
                key={link.frRoute}
                href={href}
                className={link.frRoute === currentPath ? "is-active" : ""}
              >
                {link.label}
              </a>
            );
          })}
        </nav>
        <LanguageSwitcher currentPath={localizedHref(currentPath, locale)} />
        <a href={localizedHref("/reserver", locale)} className="btn btn-outline btn-sm header-resa-btn">
          {t("nav.reserve")}
        </a>
        <a href={localizedHref("/commander", locale)} className="btn btn-primary btn-sm header-cmd-btn">
          {t("nav.order")}
        </a>
        <a href={localizedHref("/commander", locale)} className="btn btn-primary btn-sm mobile-cmd-btn">
          {t("nav.order")}
        </a>
        <MobileNav currentPath={localizedHref(currentPath, locale)} variant="subpage" />
      </div>
    </header>
  );
}
