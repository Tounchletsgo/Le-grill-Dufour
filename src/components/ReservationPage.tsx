"use client";

import { useState } from "react";
import { restaurant } from "@/data/restaurantData";
import { useTranslation } from "@/i18n/LocaleContext";
import { localizedHref } from "@/i18n/types";
import MobileNav from "./MobileNav";
import LanguageSwitcher from "./LanguageSwitcher";

const BARESTHO_URL =
  process.env.NEXT_PUBLIC_BARESTHO_URL ||
  "https://legrilldufour.reservation.barestho.com/";

const WIDGET_URL = BARESTHO_URL.endsWith("/")
  ? `${BARESTHO_URL}?view=widget`
  : `${BARESTHO_URL}/?view=widget`;

export default function ReservationPage() {
  const [iframeError, setIframeError] = useState(false);
  const { locale, t } = useTranslation();

  return (
    <div className="resa-page">
      <header className="resa-header subpage-header">
        <div className="container resa-header-inner">
          <a href={localizedHref("/", locale)} className="brand">
            <img
              src="/images/logo/grill-dufour-logo-noir.svg"
              alt="Le Grill Dufour — Restaurant"
              className="brand-logo"
              width={100}
              height={48}
            />
          </a>
          <nav className="resa-nav" aria-label={t("nav.mainNav")}>
            <a href={localizedHref("/", locale)}>{t("nav.home")}</a>
            <a href={localizedHref("/la-carte", locale)}>{t("nav.carte")}</a>
            <a href={localizedHref("/commander", locale)}>{t("nav.order")}</a>
            <a href={localizedHref("/reserver", locale)} className="is-active">{t("nav.reserve")}</a>
          </nav>
          <LanguageSwitcher currentPath={localizedHref("/reserver", locale)} />
          <a href={localizedHref("/", locale)} className="btn btn-outline btn-sm">
            {t("reservation.backToSite")}
          </a>
          <MobileNav currentPath={localizedHref("/reserver", locale)} variant="subpage" />
        </div>
      </header>

      <main className="resa-main">
        <div className="container">
          <div className="resa-intro">
            <h1>{t("reservation.title")}</h1>
            <p>
              {t("reservation.subtitle")}{" "}
              {t("reservation.subtitleConfirm")}
            </p>
          </div>

          {!iframeError ? (
            <div className="resa-widget-wrap">
              <iframe
                src={WIDGET_URL}
                title={t("reservation.iframeTitle")}
                className="resa-iframe resa-iframe-full"
                onError={() => setIframeError(true)}
                allow="payment"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="resa-fallback resa-fallback-page">
              <p>{t("reservation.loadError")}</p>
              <a
                href={BARESTHO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                {t("reservation.bookOnBarestho")}
              </a>
              <div className="resa-fallback-contact">
                <p>{t("reservation.orByPhone")}</p>
                <a href={restaurant.phoneHref} className="resa-phone-big">
                  {restaurant.phoneDisplay}
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="resa-footer">
        <div className="container">
          <p>
            &copy; {new Date().getFullYear()} Grill Dufour — {t("reservation.managedBy")}{" "}
            <a
              href="https://www.barestho.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Barestho
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
