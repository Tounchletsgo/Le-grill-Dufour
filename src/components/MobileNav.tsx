"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n/LocaleContext";
import { localizedHref } from "@/i18n/types";
import LanguageSwitcher from "./LanguageSwitcher";

interface MobileNavProps {
  currentPath?: string;
  variant?: "home" | "subpage";
}

export default function MobileNav({ currentPath, variant = "subpage" }: MobileNavProps) {
  const { locale, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const navLinks = [
    { href: localizedHref("/", locale), label: t("nav.home") },
    { href: localizedHref("/la-carte", locale), label: t("nav.carte") },
    { href: localizedHref("/commander", locale), label: t("nav.order") },
    { href: localizedHref("/reserver", locale), label: t("nav.reserve") },
    { href: localizedHref("/cheques-cadeaux", locale), label: t("nav.giftCards") },
    { href: localizedHref("/contact", locale), label: t("nav.contact") },
  ];

  const close = useCallback(() => {
    setOpen(false);
    btnRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    const firstLink = panelRef.current?.querySelector<HTMLElement>("a[href]");
    firstLink?.focus();

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const isHome = variant === "home";

  return (
    <>
      <button
        ref={btnRef}
        className={`mobile-nav-toggle${isHome ? " mobile-nav-toggle--home" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
      >
        <span className={`mobile-nav-icon${open ? " is-open" : ""}`}>
          <span />
          <span />
          <span />
        </span>
      </button>

      {/* Overlay */}
      <div
        className={`mobile-nav-overlay${open ? " is-visible" : ""}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        id="mobile-nav-panel"
        className={`mobile-nav-panel${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={t("nav.navMenu")}
      >
        <LanguageSwitcher currentPath={currentPath} />

        <nav className="mobile-nav-links" aria-label={t("nav.mainNav")}>
          {navLinks.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              className={currentPath === link.href ? "is-active" : ""}
              onClick={close}
              style={{ animationDelay: open ? `${80 + i * 40}ms` : "0ms" }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="mobile-nav-sep" aria-hidden="true" />

        <div className="mobile-nav-actions">
          <a href={localizedHref("/reserver", locale)} className="btn btn-outline btn-sm mobile-nav-btn" onClick={close}>
            {t("nav.reserve")}
          </a>
          <a href={localizedHref("/commander", locale)} className="btn btn-primary btn-sm mobile-nav-btn" onClick={close}>
            {t("nav.order")}
          </a>
        </div>

        <div className="mobile-nav-sep" aria-hidden="true" />

        <div className="mobile-nav-info">
          <a href="tel:+3256342870" className="mobile-nav-phone">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1L6.6 10.8z" /></svg>
            056 34 28 70
          </a>

          <p className="mobile-nav-address">
            Rue des Courtils – Hovenstraat 1b<br />
            7700 Mouscron
          </p>

          <a href={localizedHref("/contact", locale)} className="mobile-nav-hours-link" onClick={close}>
            {t("nav.seeSchedule")}
          </a>
        </div>

        <div className="mobile-nav-social">
          <a
            href="https://www.facebook.com/legrilldufour/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
          >
            <svg viewBox="0 0 24 24" width="24" height="24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
          </a>
          <a
            href="https://www.instagram.com/legrilldufour/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <svg viewBox="0 0 24 24" width="24" height="24"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" /></svg>
          </a>
        </div>
      </div>
    </>
  );
}
