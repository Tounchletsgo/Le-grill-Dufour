"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "@/i18n/LocaleContext";
import { localizedHref } from "@/i18n/types";

type OrderStatus = "pending_payment" | "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";

interface TrackedOrder {
  order_number: string;
  status: OrderStatus;
  mode: "delivery" | "pickup";
  customer_name: string;
  customer_email: string | null;
  payment_method: string;
  payment_status: string | null;
  total: number;
  delivery_fee: number;
  subtotal: number;
  discount_amount: number;
  created_at: string;
  notes: string | null;
  delivery_address: string | null;
  house_number: string | null;
  delivery_postal: string | null;
  delivery_city: string | null;
  locale: string | null;
  estimated_delivery_at: string | null;
  order_items: {
    name: string;
    variant_label: string | null;
    doneness_label: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

const STATUS_KEYS: Record<OrderStatus, string> = {
  pending_payment: "tracking.pendingPayment",
  pending: "tracking.pending",
  confirmed: "tracking.confirmed",
  preparing: "tracking.preparing",
  ready: "tracking.ready",
  delivering: "tracking.delivering",
  delivered: "tracking.delivered",
  cancelled: "tracking.cancelled",
};

const STEPS: OrderStatus[] = ["confirmed", "preparing", "ready", "delivering", "delivered"];

function formatPrice(n: number) {
  return n.toFixed(2).replace(".", ",").replace(",00", "") + " €";
}

export default function OrderTracker({ orderId }: { orderId: string }) {
  const { locale, t } = useTranslation();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const verifiedRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setPaymentSuccess(true);
    }
  }, []);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/commande/${orderId}?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setOrder(data.order);
      setError(null);
    } catch {
      setError(t("tracking.notFound"));
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  useEffect(() => {
    if (!paymentSuccess || !order || order.status !== "pending_payment" || verifiedRef.current || verifying) return;
    verifiedRef.current = true;
    setVerifying(true);

    fetch(`/api/commande/${orderId}/verify-payment`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "confirmed" || data.already_confirmed) {
          fetchOrder();
        }
      })
      .catch(() => {})
      .finally(() => setVerifying(false));
  }, [paymentSuccess, order, orderId, fetchOrder, verifying]);

  useEffect(() => {
    if (!order) return;
    try {
      if (order.status === "delivered" || order.status === "cancelled") {
        localStorage.removeItem("gdf-active-order");
      } else {
        localStorage.setItem("gdf-active-order", JSON.stringify({
          id: orderId,
          number: order.order_number,
          status: order.status,
          ts: Date.now(),
        }));
      }
    } catch {}
  }, [order, orderId]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let channel: any;
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        channel = supabase
          .channel(`order-${orderId}`)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
            () => fetchOrder()
          )
          .subscribe();
      } catch {}
    })();
    return () => { channel?.unsubscribe(); };
  }, [orderId, fetchOrder]);

  if (loading) {
    return (
      <div className="track-page">
        <div className="track-loading">{t("common.loading")}</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="track-page">
        <div className="track-error">
          <p>{error || t("tracking.notFound")}</p>
          <a href={localizedHref("/", locale)} className="cmd-btn cmd-btn-primary" style={{ marginTop: "1rem", display: "inline-flex" }}>
            {t("tracking.backToSite")}
          </a>
        </div>
      </div>
    );
  }

  const currentStepIdx = STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const isPendingPayment = order.status === "pending_payment";
  const isConfirmedOrBeyond = !isPendingPayment && !isCancelled && order.status !== "pending";
  const showSuccessBanner = paymentSuccess && (isConfirmedOrBeyond || isPendingPayment);

  const fullAddress = [
    order.delivery_address,
    order.house_number,
    order.delivery_postal,
    order.delivery_city,
  ].filter(Boolean).join(", ");

  return (
    <div className="track-page">
      <header className="cmd-header">
        <a href={localizedHref("/", locale)} className="cmd-back">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z" />
          </svg>
          {t("tracking.back")}
        </a>
        <div className="cmd-logo">
          <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour — Restaurant" width="75" height="36" />
        </div>
      </header>

      <div className="track-content">
        {showSuccessBanner && (
          <div className="track-success-banner">
            <div className="track-success-icon">
              <svg viewBox="0 0 24 24" width="40" height="40">
                <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M7 12.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="track-success-title">
              {isPendingPayment && verifying
                ? t("tracking.paymentVerifying")
                : isPendingPayment
                  ? t("tracking.paymentReceived")
                  : t("tracking.thankYouTitle", { name: order.customer_name.split(" ")[0] })}
            </h2>
            <p className="track-success-text">
              {isPendingPayment
                ? t("tracking.paymentVerification")
                : t("tracking.thankYouText")}
            </p>
            {order.customer_email && !isPendingPayment && (
              <div className="track-email-block">
                <div className="track-email-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                </div>
                <p className="track-email-main">
                  {t("tracking.emailConfirmSent", { email: order.customer_email })}
                </p>
                <p className="track-email-hint">
                  {t("tracking.emailCheckSpam")}
                </p>
              </div>
            )}
          </div>
        )}

        <p className="track-number">{t("tracking.orderNumber", { number: order.order_number })}</p>

        {!showSuccessBanner && (
          <h2 className="track-status" style={{ color: isCancelled ? "#ef4444" : isPendingPayment ? "#f59e0b" : "var(--gold)" }}>
            {isPendingPayment ? t("tracking.paymentProcessing") : t(STATUS_KEYS[order.status])}
          </h2>
        )}
        {isPendingPayment && !showSuccessBanner && (
          <p className="track-pending-payment-info" style={{ textAlign: "center", color: "#666", fontSize: "0.9rem", margin: "0.5rem 0 1rem" }}>
            {t("tracking.paymentVerification")}
          </p>
        )}

        {!isCancelled && !isPendingPayment && (
          <div className="track-steps">
            {STEPS.map((step, i) => {
              const isDone = i < currentStepIdx;
              const isCurrent = i === currentStepIdx;
              const isPickup = order.mode === "pickup" && step === "delivering";
              if (isPickup) return null;

              return (
                <div key={step} className={`track-step ${isDone || isCurrent ? "active" : ""}`}>
                  <div className={`track-dot ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`}>
                    {isDone && (
                      <svg viewBox="0 0 24 24" width="14" height="14">
                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                      </svg>
                    )}
                  </div>
                  <span className="track-step-label">
                    {step === "delivering" && order.mode === "delivery"
                      ? t("tracking.inDelivery")
                      : step === "ready" && order.mode === "pickup"
                        ? t("tracking.readyPickup")
                        : t(STATUS_KEYS[step])}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {order.status === "delivering" && order.mode === "delivery" && order.estimated_delivery_at && (() => {
          const etaDate = new Date(order.estimated_delivery_at);
          const etaTimeStr = etaDate.toLocaleTimeString(locale === "nl" ? "nl-BE" : "fr-BE", { hour: "2-digit", minute: "2-digit" });
          const minutesLeft = Math.max(0, Math.round((etaDate.getTime() - Date.now()) / 60000));
          return (
            <div className="track-eta-banner">
              <div className="track-eta-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                </svg>
              </div>
              <div className="track-eta-text">
                <span className="track-eta-label">{t("tracking.etaLabel")}</span>
                <span className="track-eta-time">{t("tracking.etaArrival", { time: etaTimeStr })}</span>
                {minutesLeft > 0 && (
                  <span className="track-eta-remaining">{t("tracking.etaRemaining", { minutes: String(minutesLeft) })}</span>
                )}
              </div>
            </div>
          );
        })()}

        {order.mode === "delivery" && fullAddress && (
          <div className="track-section track-address-section">
            <h3>{t("tracking.deliveryAddress")}</h3>
            <p className="track-address-text">{fullAddress}</p>
          </div>
        )}

        {order.mode === "pickup" && (
          <div className="track-section track-address-section">
            <h3>{t("tracking.pickupAddress")}</h3>
            <p className="track-address-text">Rue des Courtils 1B, 7700 Mouscron</p>
          </div>
        )}

        <div className="track-section">
          <h3>{t("tracking.details")}</h3>
          {order.order_items.map((item, i) => (
            <div className="track-item" key={i}>
              <span>
                {item.quantity}x {item.name}
                {item.variant_label ? ` (${item.variant_label})` : ""}
                {item.doneness_label ? ` — ${item.doneness_label}` : ""}
              </span>
              <span>{formatPrice(item.total_price)}</span>
            </div>
          ))}
          {order.discount_amount > 0 && (
            <div className="track-item" style={{ color: "#22863a", fontSize: "0.8rem" }}>
              <span>{t("tracking.discount")}</span>
              <span>−{formatPrice(order.discount_amount)}</span>
            </div>
          )}
          {order.mode === "delivery" && (
            <div className="track-item" style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
              <span>{t("tracking.delivery")}</span>
              <span>{order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : t("tracking.freeDelivery")}</span>
            </div>
          )}
          <div className="track-total">
            <span>{t("tracking.total")}</span>
            <span style={{ color: "var(--gold)" }}>{formatPrice(order.total)}</span>
          </div>
          <div className="track-payment-note">
            {order.payment_method === "online"
              ? `💳 ${t("tracking.paidOnline")}`
              : `💳 ${order.mode === "delivery" ? t("tracking.payAtDelivery") : t("tracking.payAtPickup")} (${order.payment_method === "cash" ? t("tracking.cash") : t("tracking.cardBancontact")})`}
          </div>
        </div>

        <div className="track-home-btn-wrap">
          <a href={localizedHref("/", locale)} className="track-home-btn">
            {t("tracking.backToHome")}
          </a>
        </div>
      </div>
    </div>
  );
}
