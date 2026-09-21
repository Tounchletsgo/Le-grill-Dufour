"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/i18n/LocaleContext";
import { localizedHref } from "@/i18n/types";

type OrderStatus = "pending_payment" | "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";

interface TrackedOrder {
  order_number: string;
  status: OrderStatus;
  mode: "delivery" | "pickup";
  customer_name: string;
  payment_method: string;
  total: number;
  delivery_fee: number;
  subtotal: number;
  created_at: string;
  notes: string | null;
  order_items: {
    name: string;
    variant_label: string | null;
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

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/commande/${orderId}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setOrder(data.order);
      setError(null);
    } catch {
      setError(t("tracking.notFound"));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  // Supabase Realtime
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
        <p className="track-number">{t("tracking.orderNumber", { number: order.order_number })}</p>
        <h2 className="track-status" style={{ color: isCancelled ? "#ef4444" : isPendingPayment ? "#f59e0b" : "var(--gold)" }}>
          {isPendingPayment ? t("tracking.paymentProcessing") : t(STATUS_KEYS[order.status])}
        </h2>
        {isPendingPayment && (
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

        <div className="track-section">
          <h3>{t("tracking.details")}</h3>
          {order.order_items.map((item, i) => (
            <div className="track-item" key={i}>
              <span>
                {item.quantity}x {item.name}
                {item.variant_label ? ` (${item.variant_label})` : ""}
              </span>
              <span>{formatPrice(item.total_price)}</span>
            </div>
          ))}
          <div className="track-item" style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
            <span>{t("tracking.delivery")}</span>
            <span>{order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : t("tracking.freeDelivery")}</span>
          </div>
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
      </div>
    </div>
  );
}
