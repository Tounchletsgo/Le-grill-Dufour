"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";

interface OrderItem {
  id: string;
  name: string;
  variant_label: string | null;
  quantity: number;
  unit_price: number;
  notes: string | null;
  order_item_supplements?: { label: string; price: number }[];
}

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  mode: "delivery" | "pickup";
  customer_name: string;
  customer_phone: string;
  delivery_address: string | null;
  delivery_postal: string | null;
  delivery_city: string | null;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  ready: "Prête",
  delivering: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  preparing: "#8b5cf6",
  ready: "#22c55e",
  delivering: "#06b6d4",
  delivered: "#6b7280",
  cancelled: "#ef4444",
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "delivering",
  delivering: "delivered",
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("fr-BE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(n: number) {
  return n.toFixed(2).replace(".", ",").replace(",00", "") + " €";
}

function timeSince(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return "à l'instant";
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h${String(diff % 60).padStart(2, "0")}`;
}

// ── Alarm sound via Web Audio API ────────────────────────────
function playAlarm() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "square";
    gain.gain.value = 0.3;
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 400);
    setTimeout(() => {
      const ctx2 = new AudioContext();
      const osc2 = ctx2.createOscillator();
      const gain2 = ctx2.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx2.destination);
      osc2.frequency.value = 1100;
      osc2.type = "square";
      gain2.gain.value = 0.3;
      osc2.start();
      setTimeout(() => {
        osc2.stop();
        ctx2.close();
      }, 300);
    }, 500);
  } catch {}
}

// ── Wake Lock ────────────────────────────────────────────────
function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    async function acquire() {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch {}
    }
    acquire();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      wakeLockRef.current?.release();
    };
  }, []);
}

// ── Order card ───────────────────────────────────────────────
function OrderCard({
  order,
  onAdvance,
  onCancel,
  onMarkPaid,
  onRefuse,
}: {
  order: Order;
  onAdvance: (id: string, next: OrderStatus) => void;
  onCancel: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onRefuse: (id: string) => void;
}) {
  const nextStatus = NEXT_STATUS[order.status];
  const elapsed = timeSince(order.created_at);

  return (
    <div className="staff-order-card" data-status={order.status}>
      <div className="staff-order-header">
        <div className="staff-order-number">{order.order_number}</div>
        <span
          className="staff-order-badge"
          style={{ background: STATUS_COLORS[order.status] }}
        >
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="staff-order-meta">
        <span>{order.mode === "delivery" ? "Livraison" : "À emporter"}</span>
        <span>{formatTime(order.created_at)} ({elapsed})</span>
        <span>{order.customer_name}</span>
        <a href={`tel:${order.customer_phone}`} className="staff-phone">
          {order.customer_phone}
        </a>
      </div>

      {order.mode === "delivery" && order.delivery_address && (
        <div className="staff-order-address">
          {order.delivery_address}, {order.delivery_postal} {order.delivery_city}
        </div>
      )}

      <div className="staff-order-items">
        {order.order_items.map((item) => (
          <div className="staff-item-row" key={item.id}>
            <span className="staff-item-qty">{item.quantity}x</span>
            <div className="staff-item-detail">
              <span>{item.name}</span>
              {item.variant_label && <small>{item.variant_label}</small>}
              {item.order_item_supplements?.map((s, i) => (
                <small key={i}>+ {s.label}</small>
              ))}
              {item.notes && <small className="staff-item-notes">{item.notes}</small>}
            </div>
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="staff-order-notes">
          <strong>Notes :</strong> {order.notes}
        </div>
      )}

      <div className="staff-order-footer">
        <div className="staff-order-total">
          <span>{formatPrice(order.total)}</span>
          <small>
            {order.payment_method === "cash" ? "Espèces" : "Carte / Bancontact"}
            {order.payment_status === "paid" ? " ✓" : " · à encaisser"}
          </small>
        </div>
        <div className="staff-order-actions">
          {order.status === "pending" && (
            <button
              type="button"
              className="staff-btn staff-btn-refuse"
              onClick={() => onRefuse(order.id)}
            >
              Refuser
            </button>
          )}
          {order.status !== "cancelled" && order.status !== "delivered" && order.status !== "pending" && (
            <button
              type="button"
              className="staff-btn staff-btn-cancel"
              onClick={() => onCancel(order.id)}
            >
              Annuler
            </button>
          )}
          {order.payment_status !== "paid" && order.status !== "cancelled" && (
            <button
              type="button"
              className="staff-btn staff-btn-paid"
              onClick={() => onMarkPaid(order.id)}
            >
              Encaissé
            </button>
          )}
          {nextStatus && (
            <button
              type="button"
              className="staff-btn staff-btn-advance"
              onClick={() => onAdvance(order.id, nextStatus)}
            >
              {STATUS_LABELS[nextStatus]}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main board ───────────────────────────────────────────────
export default function KitchenBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const knownOrderIds = useRef(new Set<string>());

  useWakeLock();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/orders");
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();

      const newOrders: Order[] = data.orders || [];
      const newIds = new Set(newOrders.map((o: Order) => o.id));

      // Play alarm for new pending orders
      for (const o of newOrders) {
        if (o.status === "pending" && !knownOrderIds.current.has(o.id)) {
          playAlarm();
          break;
        }
      }
      knownOrderIds.current = newIds;

      setOrders(newOrders);
      setError(null);
    } catch {
      setError("Connexion perdue. Nouvelle tentative...");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    let channel: any;
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        channel = supabase
          .channel("orders-realtime")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "orders" },
            () => fetchOrders()
          )
          .subscribe();
      } catch {}
    })();

    return () => {
      channel?.unsubscribe();
    };
  }, [fetchOrders]);

  const advanceOrder = async (id: string, nextStatus: OrderStatus) => {
    try {
      await fetch("/api/staff/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, status: nextStatus }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o))
      );
    } catch {}
  };

  const cancelOrder = async (id: string) => {
    try {
      await fetch("/api/staff/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, status: "cancelled" }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "cancelled" as OrderStatus } : o))
      );
    } catch {}
  };

  const markPaid = async (id: string) => {
    try {
      await fetch("/api/staff/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, paymentStatus: "paid" }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, payment_status: "paid" } : o))
      );
    } catch {}
  };

  const refuseOrder = async (id: string) => {
    try {
      await fetch("/api/staff/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, status: "cancelled", refused: true }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "cancelled" as OrderStatus } : o))
      );
    } catch {}
  };

  const activeStatuses = new Set<OrderStatus>(["pending", "confirmed", "preparing", "ready", "delivering"]);
  const displayOrders =
    filter === "active"
      ? orders.filter((o) => activeStatuses.has(o.status))
      : orders;

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const activeCount = orders.filter((o) => activeStatuses.has(o.status)).length;

  return (
    <div className="staff-page">
      <header className="staff-header">
        <div className="staff-header-left">
          <img src="/logo-grill-dufour.webp" alt="" width="32" height="32" />
          <h1>Cuisine</h1>
          {pendingCount > 0 && (
            <span className="staff-pending-badge">{pendingCount} nouvelle{pendingCount > 1 ? "s" : ""}</span>
          )}
        </div>
        <div className="staff-header-right">
          <span className="staff-active-count">{activeCount} active{activeCount > 1 ? "s" : ""}</span>
          <div className="staff-filter-toggle">
            <button
              type="button"
              className={filter === "active" ? "active" : ""}
              onClick={() => setFilter("active")}
            >
              En cours
            </button>
            <button
              type="button"
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              Toutes
            </button>
          </div>
        </div>
      </header>

      {error && <div className="staff-error">{error}</div>}

      {loading ? (
        <div className="staff-loading">Chargement des commandes...</div>
      ) : displayOrders.length === 0 ? (
        <div className="staff-empty">
          <p>Aucune commande {filter === "active" ? "en cours" : ""}</p>
        </div>
      ) : (
        <div className="staff-grid">
          {displayOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAdvance={advanceOrder}
              onCancel={cancelOrder}
              onMarkPaid={markPaid}
              onRefuse={refuseOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
