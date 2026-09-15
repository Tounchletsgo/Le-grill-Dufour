"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getLevelByKey } from "@/data/cookingData";

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";

interface OrderItem {
  id: string;
  name: string;
  variant_label: string | null;
  quantity: number;
  unit_price: number;
  notes: string | null;
  doneness_key: string | null;
  doneness_label: string | null;
  order_item_supplements?: { label: string; price: number }[];
  option_selections?: { group_label: string; choices: { label: string; quantity: number }[] }[];
  item_note?: string | null;
  category_slug?: string | null;
}

const DRINK_SLUGS = ["boissons-livraison"];

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
  house_number: string | null;
  address_source: string | null;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
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

// ── Audio alarm system ──────────────────────────────────────
function useAlarmSystem() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loopIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUnlockedRef = useRef(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gdf-alarm-volume");
      return saved ? parseFloat(saved) : 1.0;
    }
    return 1.0;
  });
  const [isRinging, setIsRinging] = useState(false);
  const isRingingRef = useRef(false);

  useEffect(() => {
    const audio = new Audio("/sounds/kitchen-alarm.wav");
    audio.preload = "auto";
    audio.loop = false;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const unlockAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;
    try {
      audio.volume = 0.01;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.volume = volume;
      isUnlockedRef.current = true;
      setIsUnlocked(true);
      return true;
    } catch {
      return false;
    }
  }, [volume]);

  const checkAudioHealth = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !isUnlockedRef.current) return;
    try {
      const origVol = audio.volume;
      audio.volume = 0;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.volume = origVol;
    } catch {
      isUnlockedRef.current = false;
      setIsUnlocked(false);
    }
  }, []);

  useEffect(() => {
    if (!isUnlockedRef.current) return;
    const interval = setInterval(checkAudioHealth, 30000);
    return () => clearInterval(interval);
  }, [isUnlocked, checkAudioHealth]);

  const startRinging = useCallback(() => {
    if (isRingingRef.current) return;
    isRingingRef.current = true;
    setIsRinging(true);

    const playOnce = () => {
      const audio = audioRef.current;
      if (!audio || !isRingingRef.current) return;
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };

    playOnce();
    loopIntervalRef.current = setInterval(playOnce, 2500);
  }, [volume]);

  const stopRinging = useCallback(() => {
    isRingingRef.current = false;
    setIsRinging(false);
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const testSound = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [volume]);

  const updateVolume = useCallback((v: number) => {
    setVolume(v);
    try { localStorage.setItem("gdf-alarm-volume", String(v)); } catch {}
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  return {
    isUnlocked,
    isRinging,
    volume,
    unlockAudio,
    startRinging,
    stopRinging,
    testSound,
    updateVolume,
  };
}

// ── Wake Lock ───────────────────────────────────────────────
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

// ── Notification permission ─────────────────────────────────
function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return "denied" as const;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const notify = useCallback((title: string, body: string) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      const options: NotificationOptions & Record<string, unknown> = {
        body,
        icon: "/favicon-192.png",
        badge: "/favicon-192.png",
        tag: "gdf-new-order",
        requireInteraction: true,
      };
      // Non-standard but widely supported on Android
      (options as any).renotify = true;
      (options as any).vibrate = [300, 100, 300, 100, 500];
      new Notification(title, options);
    } catch {}
  }, []);

  return { permission, requestPermission, notify };
}

// ── Order card ──────────────────────────────────────────────
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
        <span className="staff-order-mode" data-mode={order.mode}>
          {order.mode === "delivery" ? "Livraison" : "À emporter"}
        </span>
        <span>{formatTime(order.created_at)} ({elapsed})</span>
        <span>{order.customer_name}</span>
        <a href={`tel:${order.customer_phone}`} className="staff-phone">
          {order.customer_phone}
        </a>
      </div>

      {order.mode === "delivery" && order.delivery_address && (
        <div className="staff-order-address">
          {order.delivery_address}, {order.delivery_postal} {order.delivery_city}
          {order.address_source === "manual" && (
            <span className="staff-manual-badge">adresse saisie manuellement — à vérifier</span>
          )}
        </div>
      )}

      <div className="staff-order-items">
        {(() => {
          const plats = order.order_items.filter((i) => !DRINK_SLUGS.includes(i.category_slug || ""));
          const drinks = order.order_items.filter((i) => DRINK_SLUGS.includes(i.category_slug || ""));
          const renderItem = (item: OrderItem) => {
            const donenessLevel = item.doneness_key ? getLevelByKey(item.doneness_key) : null;
            return (
              <div className="staff-item-row" key={item.id}>
                <span className="staff-item-qty">{item.quantity}x</span>
                <div className="staff-item-detail">
                  <span>{item.name}</span>
                  {item.variant_label && <small>{item.variant_label}</small>}
                  {item.order_item_supplements?.map((s, i) => (
                    <small key={i}>+ {s.label}</small>
                  ))}
                  {item.option_selections?.map((os, i) => (
                    <small key={`opt-${i}`}>
                      {os.choices
                        .map((c) => c.quantity > 1 ? `${c.label} x${c.quantity}` : c.label)
                        .join(", ")}
                    </small>
                  ))}
                  {item.item_note && <small className="staff-item-notes">Note : {item.item_note}</small>}
                  {item.notes && <small className="staff-item-notes">{item.notes}</small>}
                </div>
                {donenessLevel && (
                  <div className="staff-item-doneness">
                    <span
                      className="staff-doneness-badge"
                      style={{ background: donenessLevel.color }}
                    >
                      {donenessLevel.label}
                    </span>
                  </div>
                )}
              </div>
            );
          };
          return (
            <>
              {plats.map(renderItem)}
              {drinks.length > 0 && (
                <div className="staff-drinks-block">
                  <div className="staff-drinks-label">Boissons</div>
                  {drinks.map(renderItem)}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {order.notes && (
        <div className="staff-order-notes">
          <strong>Notes :</strong> {order.notes}
        </div>
      )}

      {order.discount_amount > 0 && (
        <div className="staff-order-discount">
          Remise livraison : −{formatPrice(order.discount_amount)}
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

// ── Main board ──────────────────────────────────────────────
interface DrinkItem {
  id: string;
  name: string;
  is_out_of_stock: boolean;
}

function DrinkStockPanel({ staffHeaders }: { staffHeaders: () => Record<string, string> }) {
  const [drinks, setDrinks] = useState<DrinkItem[]>([]);
  const [open, setOpen] = useState(false);

  const fetchDrinks = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/menu", { headers: staffHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const drinkCat = (data.categories || []).find(
        (c: any) => c.slug === "boissons-livraison"
      );
      if (drinkCat) {
        setDrinks(
          (drinkCat.menu_items || [])
            .filter((i: any) => i.is_active)
            .map((i: any) => ({ id: i.id, name: i.name, is_out_of_stock: i.is_out_of_stock }))
        );
      }
    } catch {}
  }, [staffHeaders]);

  useEffect(() => { fetchDrinks(); }, [fetchDrinks]);

  const toggleStock = async (id: string, outOfStock: boolean) => {
    setDrinks((prev) => prev.map((d) => d.id === id ? { ...d, is_out_of_stock: outOfStock } : d));
    await fetch("/api/admin/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...staffHeaders() },
      body: JSON.stringify({ table: "menu_items", id, data: { is_out_of_stock: outOfStock } }),
    });
  };

  if (drinks.length === 0) return null;

  return (
    <div className="staff-drinks-panel">
      <button type="button" className="staff-drinks-toggle" onClick={() => setOpen(!open)}>
        Boissons — stock {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="staff-drinks-grid">
          {drinks.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`staff-drink-chip ${d.is_out_of_stock ? "out" : ""}`}
              onClick={() => toggleStock(d.id, !d.is_out_of_stock)}
            >
              {d.name}
              <span>{d.is_out_of_stock ? "✗" : "✓"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── New order alert overlay ─────────────────────────────────
function NewOrderOverlay({
  pendingOrders,
  onAccept,
}: {
  pendingOrders: Order[];
  onAccept: (id: string) => void;
}) {
  const [flash, setFlash] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setFlash((f) => !f), 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try { navigator.vibrate?.([300, 100, 300, 100, 500]); } catch {}
  }, [pendingOrders.length]);

  if (pendingOrders.length === 0) return null;

  return (
    <div className={`staff-alert-overlay ${flash ? "staff-alert-flash" : ""}`}>
      <div className="staff-alert-content">
        <div className="staff-alert-icon">!</div>
        <div className="staff-alert-title">
          {pendingOrders.length === 1
            ? "Nouvelle commande"
            : `${pendingOrders.length} nouvelles commandes`}
        </div>
        <div className="staff-alert-orders">
          {pendingOrders.map((order) => (
            <div key={order.id} className="staff-alert-order">
              <div className="staff-alert-order-info">
                <span className="staff-alert-order-num">{order.order_number}</span>
                <span className={`staff-alert-order-mode ${order.mode}`}>
                  {order.mode === "delivery" ? "Livraison" : "À emporter"}
                </span>
                <span className="staff-alert-order-total">{formatPrice(order.total)}</span>
              </div>
              <button
                type="button"
                className="staff-alert-accept-btn"
                onClick={() => onAccept(order.id)}
              >
                Accepter
              </button>
            </div>
          ))}
        </div>
        {pendingOrders.length > 1 && (
          <button
            type="button"
            className="staff-alert-accept-all"
            onClick={() => pendingOrders.forEach((o) => onAccept(o.id))}
          >
            Tout accepter
          </button>
        )}
      </div>
    </div>
  );
}

export default function KitchenBoard() {
  const [pin, setPin] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("gdf-staff-pin");
    }
    return null;
  });
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(true);
  const knownOrderIds = useRef(new Set<string>());
  const originalTitle = useRef("Cuisine | Grill Dufour");
  const titleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchTimeRef = useRef<number>(Date.now());

  const alarm = useAlarmSystem();
  const { permission: notifPerm, requestPermission, notify } = useNotifications();

  useWakeLock();

  const staffHeaders = useCallback((): Record<string, string> => {
    return { "x-admin-pin": pin || "" };
  }, [pin]);

  function handlePinLogin() {
    if (pinInput.length >= 4) {
      sessionStorage.setItem("gdf-staff-pin", pinInput);
      setPin(pinInput);
      setPinError(null);
    } else {
      setPinError("PIN trop court (min 4 caractères)");
    }
  }

  // ── Tab title blinking ─────────────────────────────────────
  const startTitleBlink = useCallback((count: number) => {
    if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);
    let show = true;
    titleIntervalRef.current = setInterval(() => {
      document.title = show
        ? `(${count}) NOUVELLE COMMANDE !`
        : originalTitle.current;
      show = !show;
    }, 1000);
  }, []);

  const stopTitleBlink = useCallback(() => {
    if (titleIntervalRef.current) {
      clearInterval(titleIntervalRef.current);
      titleIntervalRef.current = null;
    }
    document.title = originalTitle.current;
  }, []);

  // ── Fetch orders ──────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/orders", { headers: staffHeaders() });
      if (res.status === 401) {
        sessionStorage.removeItem("gdf-staff-pin");
        setPin(null);
        return;
      }
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();

      const newOrders: Order[] = data.orders || [];
      const newIds = new Set(newOrders.map((o: Order) => o.id));

      const newPending = newOrders.filter(
        (o) => o.status === "pending" && !knownOrderIds.current.has(o.id)
      );

      if (newPending.length > 0) {
        if (alarm.isUnlocked) alarm.startRinging();

        for (const o of newPending) {
          notify(
            `Commande ${o.order_number}`,
            `${o.mode === "delivery" ? "Livraison" : "À emporter"} — ${formatPrice(o.total)} — ${o.customer_name}`
          );
        }
      }

      knownOrderIds.current = newIds;
      setOrders(newOrders);
      setConnectionError(null);
      setIsOnline(true);
      lastFetchTimeRef.current = Date.now();
    } catch {
      setConnectionError("Connexion perdue — reconnexion en cours...");
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  }, [staffHeaders, alarm, notify]);

  // ── Polling interval (primary: 10s, fallback: 15s if Realtime drops) ──
  useEffect(() => {
    if (!pin) return;
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders, pin]);

  // ── Supabase Realtime subscription ────────────────────────
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !pin) return;

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
          .subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              setRealtimeConnected(true);
            } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
              setRealtimeConnected(false);
            }
          });
      } catch {
        setRealtimeConnected(false);
      }
    })();

    return () => {
      channel?.unsubscribe();
    };
  }, [fetchOrders, pin]);

  // ── Fallback polling if Realtime is disconnected ──────────
  useEffect(() => {
    if (realtimeConnected || !pin) {
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
      return;
    }
    fallbackIntervalRef.current = setInterval(fetchOrders, 15000);
    return () => {
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    };
  }, [realtimeConnected, fetchOrders, pin]);

  // ── Online/offline detection ──────────────────────────────
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); fetchOrders(); };
    const handleOffline = () => { setIsOnline(false); setConnectionError("Hors ligne — reconnexion en cours..."); };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchOrders]);

  // ── Visibility: re-fetch + catch up on missed orders ──────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchOrders();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchOrders]);

  // ── Manage alarm + title blink based on pending orders ────
  const pendingOrders = orders.filter((o) => o.status === "pending");

  useEffect(() => {
    if (pendingOrders.length > 0) {
      startTitleBlink(pendingOrders.length);
    } else {
      alarm.stopRinging();
      stopTitleBlink();
    }
  }, [pendingOrders.length, alarm.stopRinging, startTitleBlink, stopTitleBlink]);

  const advanceOrder = async (id: string, nextStatus: OrderStatus) => {
    try {
      await fetch("/api/staff/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...staffHeaders() },
        body: JSON.stringify({ orderId: id, status: nextStatus }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o))
      );
    } catch {}
  };

  const acceptOrder = useCallback((id: string) => {
    advanceOrder(id, "confirmed");
  }, [staffHeaders]);

  const cancelOrder = async (id: string) => {
    try {
      await fetch("/api/staff/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...staffHeaders() },
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
        headers: { "Content-Type": "application/json", ...staffHeaders() },
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
        headers: { "Content-Type": "application/json", ...staffHeaders() },
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

  const activeCount = orders.filter((o) => activeStatuses.has(o.status)).length;

  // ── PIN login screen ──────────────────────────────────────
  if (!pin) {
    return (
      <div className="staff-page">
        <div className="staff-login">
          <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour" width="120" height="58" />
          <h1>Cuisine</h1>
          <p>Entrez le code PIN pour accéder au tableau de bord.</p>
          <input
            type="password"
            inputMode="numeric"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePinLogin()}
            placeholder="Code PIN"
            autoFocus
            className="staff-login-input"
          />
          {pinError && <p className="staff-login-error">{pinError}</p>}
          <button
            type="button"
            onClick={handlePinLogin}
            className="staff-login-btn"
          >
            Accéder
          </button>
        </div>
      </div>
    );
  }

  // ── Audio unlock screen ───────────────────────────────────
  if (!alarm.isUnlocked) {
    return (
      <div className="staff-page">
        <div className="staff-audio-gate">
          <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour" width="120" height="58" />
          <h1>Activer les alertes sonores</h1>
          <p>
            Pour recevoir les alertes de nouvelles commandes, vous devez activer le son.
            Sans cette activation, les commandes arriveront en silence.
          </p>
          <button
            type="button"
            className="staff-audio-gate-btn"
            onClick={async () => {
              const ok = await alarm.unlockAudio();
              if (ok && notifPerm === "default") {
                await requestPermission();
              }
            }}
          >
            Activer le son
          </button>
          <button
            type="button"
            className="staff-audio-gate-skip"
            onClick={() => {
              alarm.unlockAudio();
            }}
          >
            Continuer sans son (non recommandé)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`staff-page ${pendingOrders.length > 0 ? "staff-page-alert" : ""}`}>
      {/* Connection warning banner */}
      {(!isOnline || connectionError) && (
        <div className="staff-connection-banner">
          <span className="staff-connection-dot" />
          {connectionError || "Hors ligne — reconnexion en cours..."}
        </div>
      )}

      {/* Audio disabled warning */}
      {!alarm.isUnlocked && (
        <div className="staff-audio-banner" onClick={() => alarm.unlockAudio()}>
          Son désactivé — les commandes ne seront pas annoncées. Appuyez ici pour activer.
        </div>
      )}

      {/* Realtime disconnected warning */}
      {!realtimeConnected && isOnline && (
        <div className="staff-realtime-banner">
          Temps réel déconnecté — vérification toutes les 15 secondes
        </div>
      )}

      {/* Full-screen alert overlay for pending orders */}
      {pendingOrders.length > 0 && (
        <NewOrderOverlay
          pendingOrders={pendingOrders}
          onAccept={acceptOrder}
        />
      )}

      <header className="staff-header">
        <div className="staff-header-left">
          <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour — Restaurant" width="66" height="32" />
          <h1>Cuisine</h1>
          {pendingOrders.length > 0 && (
            <span className="staff-pending-badge">{pendingOrders.length} nouvelle{pendingOrders.length > 1 ? "s" : ""}</span>
          )}
        </div>
        <div className="staff-header-right">
          <button
            type="button"
            className="staff-sound-btn"
            onClick={alarm.testSound}
            title="Tester le son"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.8-1-3.3-2.5-4v8c1.5-.7 2.5-2.2 2.5-4zM14 3.2v2.1c2.9.9 5 3.5 5 6.7s-2.1 5.8-5 6.7v2.1c4-.9 7-4.5 7-8.8s-3-7.9-7-8.8z"/>
            </svg>
          </button>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={alarm.volume}
            onChange={(e) => alarm.updateVolume(parseFloat(e.target.value))}
            className="staff-volume-slider"
            title={`Volume : ${Math.round(alarm.volume * 100)}%`}
          />
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

      <DrinkStockPanel staffHeaders={staffHeaders} />

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
