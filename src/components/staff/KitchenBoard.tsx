"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getLevelByKey, type CookingLevel } from "@/data/cookingData";

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

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "delivering",
  delivering: "delivered",
};

function formatPrice(n: number) {
  return n.toFixed(2).replace(".", ",").replace(",00", "") + " €";
}

function timeSince(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return "à l'instant";
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h${String(diff % 60).padStart(2, "0")}`;
}

function timerUrgency(dateStr: string): "ok" | "warn" | "late" {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 10) return "ok";
  if (diff < 20) return "warn";
  return "late";
}

// ── Grill summary: aggregate doneness across items ────────
function useGrillSummary(items: OrderItem[]) {
  return useMemo(() => {
    const map = new Map<string, { level: CookingLevel; count: number }>();
    for (const item of items) {
      if (!item.doneness_key || DRINK_SLUGS.includes(item.category_slug || "")) continue;
      const level = getLevelByKey(item.doneness_key);
      if (!level) continue;
      const existing = map.get(level.key);
      if (existing) {
        existing.count += item.quantity;
      } else {
        map.set(level.key, { level, count: item.quantity });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.level.sort_order - b.level.sort_order);
  }, [items]);
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
      (options as any).renotify = true;
      (options as any).vibrate = [300, 100, 300, 100, 500];
      new Notification(title, options);
    } catch {}
  }, []);

  return { permission, requestPermission, notify };
}

// ── Timer display (auto-refresh) ────────────────────────────
function TimerBadge({ createdAt }: { createdAt: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);
  const urgency = timerUrgency(createdAt);
  return (
    <span className="kb-card-timer" data-urgency={urgency}>
      {timeSince(createdAt)}
    </span>
  );
}

// ── SVG icons ───────────────────────────────────────────────
const DeliveryIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1.5-9H17V12h4.5L19.5 9.5zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM20 8l3 4v5h-2a3 3 0 0 1-6 0H9a3 3 0 0 1-6 0H1V6c0-1.1.9-2 2-2h14v4h3z"/></svg>
);
const PickupIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 6V4l-2-2H8L6 4v2H2v13a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6h-4zM8 4h8v2H8V4zm6 11h-2v2h-2v-2H8v-2h2v-2h2v2h2v2z"/></svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z"/></svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1L6.6 10.8z"/></svg>
);
const MapIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>
);

// ── Order card (Kanban) ─────────────────────────────────────
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
  const grillSummary = useGrillSummary(order.order_items);

  const plats = order.order_items.filter((i) => !DRINK_SLUGS.includes(i.category_slug || ""));
  const drinks = order.order_items.filter((i) => DRINK_SLUGS.includes(i.category_slug || ""));

  const statusVar = order.status === "pending" ? "new" :
    order.status === "confirmed" ? "confirmed" :
    order.status === "preparing" ? "preparing" :
    order.status === "ready" ? "ready" :
    order.status === "delivering" ? "delivering" : "done";

  return (
    <div className="kb-card" data-status={order.status === "pending" ? "pending" : undefined}>
      {/* Header: stripe + order number + timer */}
      <div className="kb-card-top">
        <div className="kb-card-stripe" style={{ background: `var(--kb-status-${statusVar})` }} />
        <div className="kb-card-header">
          <span className="kb-card-id">{order.order_number}</span>
          <TimerBadge createdAt={order.created_at} />
        </div>
      </div>

      {/* Mode badge */}
      <div className="kb-card-mode" data-mode={order.mode}>
        {order.mode === "delivery" ? <><DeliveryIcon /> Livraison</> : <><PickupIcon /> À emporter</>}
      </div>

      {/* Status label for non-pending */}
      {order.status !== "pending" && (
        <div className="kb-card-status-label">
          <span className="kb-card-status-dot" style={{ background: `var(--kb-status-${statusVar})` }} />
          <span className="kb-card-status-text" style={{ color: `var(--kb-status-${statusVar})` }}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>
      )}

      {/* Grill summary chips */}
      {grillSummary.length > 0 && (
        <div className="kb-grill-summary">
          {grillSummary.map(({ level, count }) => (
            <span key={level.key} className="kb-grill-chip" style={{ background: level.color }}>
              <span className="count">{count}</span> {level.label.toLowerCase()}
            </span>
          ))}
        </div>
      )}

      {/* Items */}
      <div className="kb-card-items">
        {plats.map((item) => {
          const donenessLevel = item.doneness_key ? getLevelByKey(item.doneness_key) : null;
          return (
            <div className="kb-item" key={item.id}>
              <span className="kb-item-qty">{item.quantity}x</span>
              <div className="kb-item-body">
                <span className="kb-item-name">{item.name}</span>
                {item.variant_label && <span className="kb-item-variant">{item.variant_label}</span>}
                {(item.order_item_supplements && item.order_item_supplements.length > 0) || (item.option_selections && item.option_selections.length > 0) ? (
                  <div className="kb-item-options">
                    {item.option_selections?.map((os, i) => (
                      <span key={`opt-${i}`} className="kb-item-option">
                        {os.choices.map((c) => c.quantity > 1 ? `${c.label} x${c.quantity}` : c.label).join(", ")}
                      </span>
                    ))}
                    {item.order_item_supplements?.map((s, i) => (
                      <span key={`sup-${i}`} className="kb-item-option">+ {s.label}</span>
                    ))}
                  </div>
                ) : null}
                {item.item_note && <span className="kb-item-option kb-item-note-inline">Note : {item.item_note}</span>}
                {item.notes && <span className="kb-item-option kb-item-note-inline">{item.notes}</span>}
              </div>
              {donenessLevel && (
                <span className="kb-item-doneness" style={{ background: donenessLevel.color }}>
                  {donenessLevel.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Drinks */}
      {drinks.length > 0 && (
        <>
          <div className="kb-drinks-divider">Boissons</div>
          <div className="kb-card-items" style={{ paddingTop: 4 }}>
            {drinks.map((item) => (
              <div className="kb-item" key={item.id}>
                <span className="kb-item-qty">{item.quantity}x</span>
                <div className="kb-item-body">
                  <span className="kb-item-name">{item.name}</span>
                  {item.variant_label && <span className="kb-item-variant">{item.variant_label}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Notes callout */}
      {order.notes && (
        <div className="kb-card-notes">
          <strong>Remarque client</strong>
          {order.notes}
        </div>
      )}

      {/* Customer info */}
      <div className="kb-card-customer">
        <div className="kb-customer-row">
          <UserIcon />
          <span className="kb-customer-name">{order.customer_name}</span>
        </div>
        <div className="kb-customer-row">
          <PhoneIcon />
          <a href={`tel:${order.customer_phone}`} className="kb-customer-phone">
            {order.customer_phone}
          </a>
        </div>
        {order.mode === "delivery" && order.delivery_address && (
          <div className="kb-customer-row">
            <MapIcon />
            <span className="kb-customer-address">
              {order.delivery_address}, {order.delivery_postal} {order.delivery_city}
            </span>
            {order.address_source === "manual" && (
              <span className="kb-manual-warn">Saisie manuelle</span>
            )}
          </div>
        )}
      </div>

      {/* Footer: total + actions */}
      <div className="kb-card-footer">
        <div className="kb-card-total">
          <span className="kb-card-price">{formatPrice(order.total)}</span>
          <span className={`kb-card-payment ${order.payment_status !== "paid" ? "unpaid" : ""}`}>
            {order.payment_method === "cash" ? "Espèces" : "Carte"}
            {order.payment_status === "paid" ? " ✓ Payé" : " · À encaisser"}
          </span>
        </div>
        <div className="kb-card-actions">
          {order.status === "pending" && (
            <>
              <button type="button" className="kb-btn kb-btn-refuse" onClick={() => onRefuse(order.id)}>
                Refuser
              </button>
              <button type="button" className="kb-btn kb-btn-accept" onClick={() => onAdvance(order.id, "confirmed")}>
                Accepter
              </button>
            </>
          )}
          {order.status !== "pending" && order.status !== "cancelled" && order.status !== "delivered" && (
            <button type="button" className="kb-btn kb-btn-cancel" onClick={() => onCancel(order.id)}>
              Annuler
            </button>
          )}
          {order.payment_status !== "paid" && order.status !== "cancelled" && order.status !== "pending" && (
            <button type="button" className="kb-btn kb-btn-paid" onClick={() => onMarkPaid(order.id)}>
              Encaissé
            </button>
          )}
          {nextStatus && order.status !== "pending" && (
            <button
              type="button"
              className={`kb-btn ${
                nextStatus === "ready" ? "kb-btn-ready" :
                nextStatus === "delivering" ? "kb-btn-delivering" :
                "kb-btn-advance"
              }`}
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

// ── Drink stock panel ─────────────────────────────────────
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
    <div className="kb-drinks-panel">
      <button type="button" className="kb-drinks-toggle" onClick={() => setOpen(!open)}>
        Boissons — stock {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="kb-drinks-grid">
          {drinks.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`kb-drink-chip ${d.is_out_of_stock ? "out" : ""}`}
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

// ── Kanban column type ──────────────────────────────────────
type KanbanCol = "new" | "prep" | "ready";

// ── Main board ──────────────────────────────────────────────
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
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(true);
  const [activeTab, setActiveTab] = useState<KanbanCol>("new");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gdf-kitchen-theme");
      return saved === "light" ? "light" : "dark";
    }
    return "dark";
  });
  const knownOrderIds = useRef(new Set<string>());
  const originalTitle = useRef("Cuisine | Grill Dufour");
  const titleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchTimeRef = useRef<number>(Date.now());

  const alarm = useAlarmSystem();
  const { permission: notifPerm, requestPermission, notify } = useNotifications();

  useWakeLock();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-kitchen-theme", theme);
    try { localStorage.setItem("gdf-kitchen-theme", theme); } catch {}
  }, [theme]);

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

  // ── Polling interval ──────────────────────────────────────
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

  // ── Visibility: re-fetch on focus ─────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchOrders();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchOrders]);

  // ── Alarm + title blink for pending orders ────────────────
  const pendingOrders = orders.filter((o) => o.status === "pending");

  useEffect(() => {
    if (pendingOrders.length > 0) {
      startTitleBlink(pendingOrders.length);
    } else {
      alarm.stopRinging();
      stopTitleBlink();
    }
  }, [pendingOrders.length, alarm.stopRinging, startTitleBlink, stopTitleBlink]);

  // ── Order actions ─────────────────────────────────────────
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

  // ── Kanban columns ────────────────────────────────────────
  const colNew = orders.filter((o) => o.status === "pending" || o.status === "confirmed");
  const colPrep = orders.filter((o) => o.status === "preparing");
  const colReady = orders.filter((o) => o.status === "ready" || o.status === "delivering");

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
    <div className={`staff-page kb-page ${pendingOrders.length > 0 ? "staff-page-alert" : ""}`}>
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

      {/* Header */}
      <header className="kb-header">
        <div className="kb-header-left">
          <span className="kb-brand">Grill Dufour</span>
          <span className="kb-header-title">Cuisine</span>
        </div>
        <div className="kb-header-right">
          <div className="kb-header-stats">
            {colNew.length > 0 && (
              <span className="kb-stat-pill" data-type="pending">{colNew.length} nouvelle{colNew.length > 1 ? "s" : ""}</span>
            )}
            {colPrep.length > 0 && (
              <span className="kb-stat-pill" data-type="active">{colPrep.length} en cours</span>
            )}
            {colReady.length > 0 && (
              <span className="kb-stat-pill" data-type="ready">{colReady.length} prête{colReady.length > 1 ? "s" : ""}</span>
            )}
          </div>
          <button
            type="button"
            className="kb-sound-btn"
            onClick={alarm.testSound}
            title="Tester le son"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.8-1-3.3-2.5-4v8c1.5-.7 2.5-2.2 2.5-4zM14 3.2v2.1c2.9.9 5 3.5 5 6.7s-2.1 5.8-5 6.7v2.1c4-.9 7-4.5 7-8.8s-3-7.9-7-8.8z"/>
            </svg>
            Test
          </button>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={alarm.volume}
            onChange={(e) => alarm.updateVolume(parseFloat(e.target.value))}
            className="kb-volume-slider"
            title={`Volume : ${Math.round(alarm.volume * 100)}%`}
          />
          <button
            type="button"
            className="kb-theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Basculer clair / sombre"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 16V5a7 7 0 1 1 0 14z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Drink stock panel */}
      <DrinkStockPanel staffHeaders={staffHeaders} />

      {/* Mobile/portrait tabs */}
      <div className="kb-tabs">
        <button
          type="button"
          className={`kb-tab ${activeTab === "new" ? "active" : ""}`}
          onClick={() => setActiveTab("new")}
        >
          Nouvelles {colNew.length > 0 && <span className="kb-tab-count" style={{ background: "var(--kb-status-new)" }}>{colNew.length}</span>}
        </button>
        <button
          type="button"
          className={`kb-tab ${activeTab === "prep" ? "active" : ""}`}
          onClick={() => setActiveTab("prep")}
        >
          En prépa {colPrep.length > 0 && <span className="kb-tab-count" style={{ background: "var(--kb-status-preparing)" }}>{colPrep.length}</span>}
        </button>
        <button
          type="button"
          className={`kb-tab ${activeTab === "ready" ? "active" : ""}`}
          onClick={() => setActiveTab("ready")}
        >
          Prêtes {colReady.length > 0 && <span className="kb-tab-count" style={{ background: "var(--kb-status-ready)" }}>{colReady.length}</span>}
        </button>
      </div>

      {/* Kanban columns */}
      {loading ? (
        <div className="staff-loading">Chargement des commandes...</div>
      ) : (
        <div className="kb-columns">
          {/* Column 1: Nouvelles */}
          <div className="kb-column" data-col="new" data-active-tab={activeTab}>
            <div className="kb-column-header">
              <div className="kb-column-stripe" style={{ background: "var(--kb-status-new)" }} />
              <span className="kb-column-title">Nouvelles</span>
              <span className="kb-column-count" style={{ background: "var(--kb-status-new)" }}>{colNew.length}</span>
            </div>
            <div className="kb-column-body">
              {colNew.length === 0 ? (
                <div className="kb-column-empty">Aucune commande</div>
              ) : (
                colNew.map((order) => (
                  <OrderCard key={order.id} order={order} onAdvance={advanceOrder} onCancel={cancelOrder} onMarkPaid={markPaid} onRefuse={refuseOrder} />
                ))
              )}
            </div>
          </div>

          {/* Column 2: En préparation */}
          <div className="kb-column" data-col="prep" data-active-tab={activeTab}>
            <div className="kb-column-header">
              <div className="kb-column-stripe" style={{ background: "var(--kb-status-preparing)" }} />
              <span className="kb-column-title">En préparation</span>
              <span className="kb-column-count" style={{ background: "var(--kb-status-preparing)" }}>{colPrep.length}</span>
            </div>
            <div className="kb-column-body">
              {colPrep.length === 0 ? (
                <div className="kb-column-empty">Aucune commande</div>
              ) : (
                colPrep.map((order) => (
                  <OrderCard key={order.id} order={order} onAdvance={advanceOrder} onCancel={cancelOrder} onMarkPaid={markPaid} onRefuse={refuseOrder} />
                ))
              )}
            </div>
          </div>

          {/* Column 3: Prêtes */}
          <div className="kb-column" data-col="ready" data-active-tab={activeTab}>
            <div className="kb-column-header">
              <div className="kb-column-stripe" style={{ background: "var(--kb-status-ready)" }} />
              <span className="kb-column-title">Prêtes</span>
              <span className="kb-column-count" style={{ background: "var(--kb-status-ready)" }}>{colReady.length}</span>
            </div>
            <div className="kb-column-body">
              {colReady.length === 0 ? (
                <div className="kb-column-empty">Aucune commande</div>
              ) : (
                colReady.map((order) => (
                  <OrderCard key={order.id} order={order} onAdvance={advanceOrder} onCancel={cancelOrder} onMarkPaid={markPaid} onRefuse={refuseOrder} />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
