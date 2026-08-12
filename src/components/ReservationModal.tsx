"use client";

import { useState, useEffect, useCallback } from "react";
import { restaurant } from "@/data/restaurantData";

const BARESTHO_URL =
  process.env.NEXT_PUBLIC_BARESTHO_URL ||
  "https://legrilldufour.reservation.barestho.com/";

const WIDGET_URL = BARESTHO_URL.endsWith("/")
  ? `${BARESTHO_URL}?view=widget`
  : `${BARESTHO_URL}/?view=widget`;

export default function ReservationModal() {
  const [open, setOpen] = useState(false);
  const [iframeError, setIframeError] = useState(false);

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
          <h2>Réserver une table</h2>
          <button
            className="resa-modal-close"
            onClick={close}
            aria-label="Fermer"
            type="button"
          >
            &times;
          </button>
        </div>

        <div className="resa-modal-body">
          {!iframeError ? (
            <iframe
              src={WIDGET_URL}
              title="Réservation Barestho — Grill Dufour"
              className="resa-iframe"
              onError={() => setIframeError(true)}
              allow="payment"
              loading="lazy"
            />
          ) : (
            <div className="resa-fallback">
              <p>Le formulaire de réservation ne peut pas se charger ici.</p>
              <a
                href={BARESTHO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Réserver sur Barestho
              </a>
              <p className="resa-fallback-phone">
                Ou appelez-nous directement :
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
