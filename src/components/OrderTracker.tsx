"use client";

import { useState, useEffect, useCallback } from "react";

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";

interface TrackedOrder {
  order_number: string;
  status: OrderStatus;
  mode: "delivery" | "pickup";
  customer_name: string;
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

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente de confirmation",
  confirmed: "Commande confirmée",
  preparing: "En préparation",
  ready: "Prête",
  delivering: "En cours de livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STEPS: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "delivering", "delivered"];

function formatPrice(n: number) {
  return n.toFixed(2).replace(".", ",").replace(",00", "") + " €";
}

export default function OrderTracker({ orderId }: { orderId: string }) {
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
      setError("Commande introuvable.");
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
        <div className="track-loading">Chargement...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="track-page">
        <div className="track-error">
          <p>{error || "Commande introuvable."}</p>
          <a href="/" className="cmd-btn cmd-btn-primary" style={{ marginTop: "1rem", display: "inline-flex" }}>
            Retour au site
          </a>
        </div>
      </div>
    );
  }

  const currentStepIdx = STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="track-page">
      <header className="cmd-header">
        <a href="/" className="cmd-back">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z" />
          </svg>
          Retour
        </a>
        <div className="cmd-logo">
          <img src="/logo-grill-du-four.webp" alt="Le Grill du Four" width="36" height="36" />
        </div>
      </header>

      <div className="track-content">
        <p className="track-number">Commande {order.order_number}</p>
        <h2 className="track-status" style={{ color: isCancelled ? "#ef4444" : "var(--gold)" }}>
          {STATUS_LABELS[order.status]}
        </h2>

        {!isCancelled && (
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
                      ? "En livraison"
                      : step === "ready" && order.mode === "pickup"
                        ? "Prête — venez la chercher"
                        : STATUS_LABELS[step]}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="track-section">
          <h3>Détails</h3>
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
            <span>Livraison</span>
            <span>{order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : "Gratuite"}</span>
          </div>
          <div className="track-total">
            <span>Total</span>
            <span style={{ color: "var(--gold)" }}>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
