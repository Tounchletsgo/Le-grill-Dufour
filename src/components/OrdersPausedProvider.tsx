"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useTranslation } from "@/i18n/LocaleContext";

interface OrdersPausedContextValue {
  paused: boolean;
  showModal: () => void;
}

const OrdersPausedContext = createContext<OrdersPausedContextValue>({
  paused: true,
  showModal: () => {},
});

export function useOrdersPaused() {
  return useContext(OrdersPausedContext);
}

export function OrdersPausedProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/orders-status")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setPaused(d.paused ?? true);
      })
      .catch(() => {
        if (!cancelled) setPaused(true);
      });
    return () => { cancelled = true; };
  }, []);

  const showModal = useCallback(() => setModalOpen(true), []);
  const hideModal = useCallback(() => setModalOpen(false), []);

  return (
    <OrdersPausedContext.Provider value={{ paused, showModal }}>
      {children}
      {modalOpen && <ComingSoonModal onClose={hideModal} />}
    </OrdersPausedContext.Provider>
  );
}

function ComingSoonModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    closeBtnRef.current?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        e.preventDefault();
        closeBtnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", trap);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const noMotion = reducedMotion.current;

  return (
    <div
      ref={overlayRef}
      className={`ops-overlay${visible ? " ops-visible" : ""}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={t("ordersPaused.title")}
    >
      <div className={`ops-modal${visible ? " ops-modal-visible" : ""}`}>
        <div className="ops-grill-stripes" aria-hidden="true">
          <span className={`ops-stripe${!noMotion ? " ops-stripe-anim" : ""}`} style={!noMotion ? { animationDelay: "0s" } : undefined} />
          <span className={`ops-stripe${!noMotion ? " ops-stripe-anim" : ""}`} style={!noMotion ? { animationDelay: "0.15s" } : undefined} />
          <span className={`ops-stripe${!noMotion ? " ops-stripe-anim" : ""}`} style={!noMotion ? { animationDelay: "0.3s" } : undefined} />
        </div>

        <h2 className="ops-title">
          <span className={`ops-bientot${!noMotion ? " ops-glow" : ""}`}>
            {t("ordersPaused.title").split(" ")[0]}
          </span>{" "}
          <span className={`ops-disponible${!noMotion ? " ops-disponible-anim" : ""}`}>
            {t("ordersPaused.title").split(" ").slice(1).join(" ")}
          </span>
        </h2>

        <p className="ops-message">{t("ordersPaused.message")}</p>

        <button
          ref={closeBtnRef}
          className="ops-close-btn"
          onClick={onClose}
          aria-label={t("ordersPaused.close")}
        >
          {t("ordersPaused.close")}
        </button>
      </div>
    </div>
  );
}

export function OrdersPausedBanner() {
  const { paused } = useOrdersPaused();
  const { t } = useTranslation();
  if (!paused) return null;
  return (
    <div className="ops-banner" role="status">
      <span className="ops-banner-dot" aria-hidden="true" />
      {t("ordersPaused.banner")}
    </div>
  );
}
