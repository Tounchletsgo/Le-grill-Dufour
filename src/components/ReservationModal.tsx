"use client";

import { useState, useEffect, useCallback } from "react";
import { restaurant } from "@/data/restaurantData";
import { useTranslation } from "@/i18n/LocaleContext";

const BARESTHO_URL =
  process.env.NEXT_PUBLIC_BARESTHO_URL ||
  "https://legrilldufour.reservation.barestho.com/";

const WIDGET_URL = BARESTHO_URL.endsWith("/")
  ? `${BARESTHO_URL}?view=widget`
  : `${BARESTHO_URL}/?view=widget`;

export default function ReservationModal() {
  const [open, setOpen] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const { t } = useTranslation();

  const close = useCallback(() => {
    setOpen(false);
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const link = target.closest<HTMLAnchorElement>("[data-reservation]");
      if (!link) return;

      if (window.innerWidth < 768) return;

      e.preventDefault();
      setOpen(true);
      setIframeError(false);
      document.body.style.overflow = "hidden";
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && open) close();
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="resa-overlay" onClick={close}>
      <div className="resa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="resa-modal-header">
          <h2>{t("reservation.modalTitle")}</h2>
          <button
            className="resa-modal-close"
            onClick={close}
            aria-label={t("reservation.modalClose")}
            type="button"
          >
            &times;
          </button>
        </div>

        <div className="resa-modal-body">
          {!iframeError ? (
            <iframe
              src={WIDGET_URL}
              title={t("reservation.iframeTitle")}
              className="resa-iframe"
              onError={() => setIframeError(true)}
              allow="payment"
              loading="lazy"
            />
          ) : (
            <div className="resa-fallback">
              <p>{t("reservation.modalLoadError")}</p>
              <a
                href={BARESTHO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                {t("reservation.modalBook")}
              </a>
              <p className="resa-fallback-phone">
                {t("reservation.modalPhone")}
                <a href={restaurant.phoneHref} className="resa-phone-link">
                  {restaurant.phoneDisplay}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
