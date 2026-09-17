"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, Component } from "react";
import { getLevelByKey, type CookingLevel } from "@/data/cookingData";
import DailySpecialsManager from "@/components/admin/DailySpecialsManager";

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

// ── Haptic feedback (tap sound via Web Audio API) ──────────
function useTapSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(() => {
    try {
      if (!ctxRef.current) ctxRef.current = new AudioContext();
      const ctx = ctxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 600;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.onended = () => { gain.disconnect(); osc.disconnect(); };
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }, []);

  return play;
}

// ── Audio alarm system ──────────────────────────────────────
function useAlarmSystem() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loopIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUnlockedRef = useRef(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("gdf-alarm-volume");
        return saved ? parseFloat(saved) : 1.0;
      } catch { return 1.0; }
    }
    return 1.0;
  });
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
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
      audio.volume = volumeRef.current;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };

    playOnce();
    loopIntervalRef.current = setInterval(playOnce, 2500);
  }, []);

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

// ── Wake Lock (persistent) ──────────────────────────────────
function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function acquire() {
      try {
        if (!("wakeLock" in navigator)) return;
        if (wakeLockRef.current && !wakeLockRef.current.released) return;
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        if (mounted) setActive(true);
        wakeLockRef.current.addEventListener("release", () => {
          if (mounted) setActive(false);
        });
      } catch {
        if (mounted) setActive(false);
      }
    }
    acquire();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const keepAlive = setInterval(() => {
      if (!wakeLockRef.current || wakeLockRef.current.released) acquire();
    }, 60000);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(keepAlive);
      wakeLockRef.current?.release();
    };
  }, []);

  return active;
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
let timerListeners = new Set<() => void>();
let timerInterval: ReturnType<typeof setInterval> | null = null;
function subscribeTimer(cb: () => void) {
  timerListeners.add(cb);
  if (!timerInterval) {
    timerInterval = setInterval(() => timerListeners.forEach((fn) => fn()), 30000);
  }
  return () => {
    timerListeners.delete(cb);
    if (timerListeners.size === 0 && timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };
}

function TimerBadge({ createdAt }: { createdAt: string }) {
  const [, setTick] = useState(0);
  useEffect(() => subscribeTimer(() => setTick((t) => t + 1)), []);
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
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
);
const PrintIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
);
const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
);

// ── Undo bar ───────────────────────────────────────────────
interface UndoAction {
  id: string;
  label: string;
  undo: () => void;
  timeout: ReturnType<typeof setTimeout>;
}

function UndoBar({ actions, onDismiss }: { actions: UndoAction[]; onDismiss: (id: string) => void }) {
  if (actions.length === 0) return null;
  return (
    <div className="kb-undo-container">
      {actions.map((a) => (
        <div key={a.id} className="kb-undo-bar">
          <span className="kb-undo-label">{a.label}</span>
          <button
            type="button"
            className="kb-undo-btn"
            onClick={() => {
              clearTimeout(a.timeout);
              a.undo();
              onDismiss(a.id);
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            className="kb-undo-close"
            onClick={() => onDismiss(a.id)}
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Delay picker for accepting orders ─────────────────────
function DelayPicker({
  orderId,
  orderNumber,
  onConfirm,
  onCancel,
}: {
  orderId: string;
  orderNumber: string;
  onConfirm: (id: string, delay: number) => void;
  onCancel: () => void;
}) {
  const delays = [20, 30, 45, 60];
  return (
    <div className="kb-delay-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="kb-delay-panel">
        <div className="kb-delay-title">Commande {orderNumber}</div>
        <div className="kb-delay-subtitle">Temps de préparation estimé</div>
        <div className="kb-delay-grid">
          {delays.map((d) => (
            <button
              key={d}
              type="button"
              className="kb-delay-btn"
              onClick={() => onConfirm(orderId, d)}
            >
              <span className="kb-delay-num">{d}</span>
              <span className="kb-delay-unit">min</span>
            </button>
          ))}
        </div>
        <button type="button" className="kb-delay-cancel" onClick={onCancel}>
          Retour
        </button>
      </div>
    </div>
  );
}

// ── Refuse confirm dialog ──────────────────────────────────
function RefuseConfirm({
  orderNumber,
  onConfirm,
  onCancel,
}: {
  orderNumber: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const reasons = ["Rupture de stock", "Fermé", "Trop de commandes", "Zone non desservie"];
  return (
    <div className="kb-delay-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="kb-delay-panel">
        <div className="kb-delay-title kb-refuse-title">Refuser {orderNumber} ?</div>
        <div className="kb-delay-subtitle">Choisissez un motif</div>
        <div className="kb-refuse-reasons">
          {reasons.map((r) => (
            <button
              key={r}
              type="button"
              className={`kb-refuse-reason-btn ${reason === r ? "selected" : ""}`}
              onClick={() => setReason(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="kb-refuse-actions">
          <button type="button" className="kb-delay-cancel" onClick={onCancel}>
            Retour
          </button>
          <button
            type="button"
            className="kb-btn kb-btn-refuse-confirm"
            disabled={!reason}
            onClick={() => onConfirm(reason)}
          >
            Confirmer le refus
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Search panel ───────────────────────────────────────────
function SearchPanel({
  allOrders,
  onClose,
  onReopen,
  staffHeaders,
}: {
  allOrders: Order[];
  onClose: () => void;
  onReopen: (id: string) => void;
  staffHeaders: () => Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"search" | "history">("search");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (tab === "history") {
      (async () => {
        try {
          const res = await fetch("/api/staff/orders?include_done=true", { headers: staffHeaders() });
          if (res.ok) {
            const data = await res.json();
            setHistoryOrders(
              (data.orders || []).filter(
                (o: Order) => o.status === "delivered" || o.status === "cancelled"
              )
            );
          }
        } catch {}
      })();
    }
  }, [tab, staffHeaders]);

  const q = query.trim().toLowerCase();
  const searchResults = q
    ? allOrders.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
          o.customer_name.toLowerCase().includes(q)
      )
    : [];

  const historyResults = q
    ? historyOrders.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
          o.customer_name.toLowerCase().includes(q)
      )
    : historyOrders.slice(0, 20);

  const displayOrders = tab === "search" ? searchResults : historyResults;

  return (
    <div className="kb-search-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="kb-search-panel">
        <div className="kb-search-header">
          <div className="kb-search-input-wrap">
            <SearchIcon />
            <input
              ref={inputRef}
              type="text"
              className="kb-search-input"
              placeholder="N° commande, téléphone, nom..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              inputMode="search"
            />
            {query && (
              <button type="button" className="kb-search-clear" onClick={() => setQuery("")}>
                &times;
              </button>
            )}
          </div>
          <button type="button" className="kb-search-close-btn" onClick={onClose}>
            Fermer
          </button>
        </div>
        <div className="kb-search-tabs">
          <button
            type="button"
            className={`kb-search-tab ${tab === "search" ? "active" : ""}`}
            onClick={() => setTab("search")}
          >
            Recherche
          </button>
          <button
            type="button"
            className={`kb-search-tab ${tab === "history" ? "active" : ""}`}
            onClick={() => setTab("history")}
          >
            Historique du jour
          </button>
        </div>
        <div className="kb-search-results">
          {displayOrders.length === 0 ? (
            <div className="kb-search-empty">
              {tab === "search" && !q ? "Tapez un numéro, téléphone ou nom" : "Aucun résultat"}
            </div>
          ) : (
            displayOrders.map((o) => (
              <div key={o.id} className="kb-search-result">
                <div className="kb-search-result-left">
                  <span className="kb-search-result-num">{o.order_number}</span>
                  <span className="kb-search-result-name">{o.customer_name}</span>
                  <span className="kb-search-result-phone">{o.customer_phone}</span>
                </div>
                <div className="kb-search-result-right">
                  <span className={`kb-search-result-status ${o.status}`}>
                    {STATUS_LABELS[o.status]}
                  </span>
                  <span className="kb-search-result-total">{formatPrice(o.total)}</span>
                  {(o.status === "delivered" || o.status === "cancelled") && (
                    <button
                      type="button"
                      className="kb-btn kb-btn-reopen"
                      onClick={() => onReopen(o.id)}
                    >
                      Rouvrir
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Placeholder tab content ────────────────────────────────
function PlaceholderTab({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="kb-placeholder-tab">
      <div className="kb-placeholder-icon">{icon}</div>
      <h2 className="kb-placeholder-title">{title}</h2>
      <p className="kb-placeholder-text">Cette section sera disponible prochainement.</p>
    </div>
  );
}

// ── Quick actions bar ──────────────────────────────────────
function QuickActionsBar({
  rushMode,
  onToggleRush,
  onToggleClosed,
  isClosed,
  onOutOfStock,
}: {
  rushMode: boolean;
  onToggleRush: () => void;
  onToggleClosed: () => void;
  isClosed: boolean;
  onOutOfStock: () => void;
}) {
  return (
    <div className="kb-quick-actions">
      <button
        type="button"
        className={`kb-quick-btn ${rushMode ? "active" : ""}`}
        onClick={onToggleRush}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 1.62-.48 3.12-1.3 4.38l1.46 1.46A9.94 9.94 0 0 0 22 12c0-5.18-3.95-9.45-9-9.95zM12 6a6 6 0 0 0-6 6c0 1.64.66 3.13 1.73 4.21l1.42-1.42A3.93 3.93 0 0 1 8 12a4 4 0 0 1 4-4V6zm-8.27 5h-2c.18-1.67.74-3.22 1.6-4.56l1.46 1.42A7.92 7.92 0 0 0 3.73 11zM6.27 5.56 4.81 4.1A9.9 9.9 0 0 1 11 2.05v2.02a7.94 7.94 0 0 0-4.73 1.49zM19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"/></svg>
        {rushMode ? "Rush ON" : "Rush"}
      </button>
      <button
        type="button"
        className={`kb-quick-btn ${isClosed ? "active-danger" : ""}`}
        onClick={onToggleClosed}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        {isClosed ? "Fermé" : "Fermer"}
      </button>
      <button type="button" className="kb-quick-btn" onClick={onOutOfStock}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
        Rupture
      </button>
    </div>
  );
}

// ── Order card (Kanban) ─────────────────────────────────────
function OrderCard({
  order,
  onAdvance,
  onAcceptWithDelay,
  onCancel,
  onMarkPaid,
  onRefuse,
  onPrint,
  rushMode,
  playTap,
}: {
  order: Order;
  onAdvance: (id: string, next: OrderStatus) => void;
  onAcceptWithDelay: (id: string) => void;
  onCancel: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onRefuse: (id: string) => void;
  onPrint: (order: Order) => void;
  rushMode: boolean;
  playTap: () => void;
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

  const handleAction = (fn: () => void) => {
    playTap();
    fn();
  };

  return (
    <div className={`kb-card ${rushMode ? "kb-card-rush" : ""}`} data-status={order.status === "pending" ? "pending" : undefined}>
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

      {/* Items — in rush mode, hide options/supplements for brevity */}
      <div className="kb-card-items">
        {plats.map((item) => {
          const donenessLevel = item.doneness_key ? getLevelByKey(item.doneness_key) : null;
          return (
            <div className="kb-item" key={item.id}>
              <span className="kb-item-qty">{item.quantity}x</span>
              <div className="kb-item-body">
                <span className="kb-item-name">{item.name}</span>
                {!rushMode && item.variant_label && <span className="kb-item-variant">{item.variant_label}</span>}
                {!rushMode && ((item.order_item_supplements && item.order_item_supplements.length > 0) || (item.option_selections && item.option_selections.length > 0)) && (
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
                )}
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
                  {!rushMode && item.variant_label && <span className="kb-item-variant">{item.variant_label}</span>}
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
      {!rushMode && (
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
      )}

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
          {/* Print */}
          <button
            type="button"
            className="kb-btn kb-btn-icon"
            onClick={() => handleAction(() => onPrint(order))}
            title="Imprimer"
          >
            <PrintIcon />
          </button>

          {order.status === "pending" && (
            <>
              <button type="button" className="kb-btn kb-btn-refuse" onClick={() => handleAction(() => onRefuse(order.id))}>
                Refuser
              </button>
              <button type="button" className="kb-btn kb-btn-accept" onClick={() => handleAction(() => onAcceptWithDelay(order.id))}>
                Accepter
              </button>
            </>
          )}
          {order.status !== "pending" && order.status !== "cancelled" && order.status !== "delivered" && (
            <button type="button" className="kb-btn kb-btn-cancel" onClick={() => handleAction(() => onCancel(order.id))}>
              Annuler
            </button>
          )}
          {order.payment_status !== "paid" && order.status !== "cancelled" && order.status !== "pending" && (
            <button type="button" className="kb-btn kb-btn-paid" onClick={() => handleAction(() => onMarkPaid(order.id))}>
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
              onClick={() => handleAction(() => onAdvance(order.id, nextStatus))}
            >
              {STATUS_LABELS[nextStatus]}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stock manager panel ───────────────────────────────────
interface StockCategory {
  id: string;
  label: string;
  slug: string;
  items: { id: string; name: string; is_out_of_stock: boolean }[];
}

function StockManagerPanel({
  staffHeaders,
  onClose,
}: {
  staffHeaders: () => Record<string, string>;
  onClose: () => void;
}) {
  const [categories, setCategories] = useState<StockCategory[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/menu", { headers: staffHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setCategories(
        (data.categories || [])
          .filter((c: any) => c.is_active)
          .map((c: any) => ({
            id: c.id,
            label: c.label,
            slug: c.slug,
            items: (c.menu_items || [])
              .filter((i: any) => i.is_active)
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((i: any) => ({
                id: i.id,
                name: i.name,
                is_out_of_stock: i.is_out_of_stock,
              })),
          }))
          .filter((c: StockCategory) => c.items.length > 0)
      );
    } catch {} finally {
      setLoading(false);
    }
  }, [staffHeaders]);

  useEffect(() => {
    fetchMenu();
    searchRef.current?.focus();
  }, [fetchMenu]);

  const toggleItem = async (id: string, outOfStock: boolean) => {
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        items: c.items.map((i) =>
          i.id === id ? { ...i, is_out_of_stock: outOfStock } : i
        ),
      }))
    );
    try {
      const res = await fetch("/api/admin/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...staffHeaders() },
        body: JSON.stringify({ table: "menu_items", id, data: { is_out_of_stock: outOfStock } }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          items: c.items.map((i) =>
            i.id === id ? { ...i, is_out_of_stock: !outOfStock } : i
          ),
        }))
      );
    }
  };

  const toggleCategory = async (categoryId: string, outOfStock: boolean) => {
    const prevItems = categories.find((c) => c.id === categoryId)?.items.map((i) => ({
      id: i.id, was: i.is_out_of_stock,
    }));
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? { ...c, items: c.items.map((i) => ({ ...i, is_out_of_stock: outOfStock })) }
          : c
      )
    );
    try {
      const res = await fetch("/api/admin/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...staffHeaders() },
        body: JSON.stringify({ action: "toggle_category_stock", category_id: categoryId, out_of_stock: outOfStock }),
      });
      if (!res.ok) throw new Error();
    } catch {
      if (prevItems) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === categoryId
              ? { ...c, items: c.items.map((i) => {
                  const pi = prevItems.find((p) => p.id === i.id);
                  return pi ? { ...i, is_out_of_stock: pi.was } : i;
                })}
              : c
          )
        );
      }
    }
  };

  const resetAll = async () => {
    const snapshot = categories.map((c) => ({
      id: c.id,
      items: c.items.map((i) => ({ id: i.id, was: i.is_out_of_stock })),
    }));
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        items: c.items.map((i) => ({ ...i, is_out_of_stock: false })),
      }))
    );
    try {
      const res = await fetch("/api/admin/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...staffHeaders() },
        body: JSON.stringify({ action: "reset_all_stock" }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setCategories((prev) =>
        prev.map((c) => {
          const sc = snapshot.find((s) => s.id === c.id);
          if (!sc) return c;
          return { ...c, items: c.items.map((i) => {
            const si = sc.items.find((s) => s.id === i.id);
            return si ? { ...i, is_out_of_stock: si.was } : i;
          })};
        })
      );
    }
  };

  const outCount = categories.reduce(
    (sum, c) => sum + c.items.filter((i) => i.is_out_of_stock).length,
    0
  );

  const normalizedSearch = search.toLowerCase().trim();
  const filteredCategories = normalizedSearch
    ? categories
        .map((c) => ({
          ...c,
          items: c.items.filter((i) =>
            i.name.toLowerCase().includes(normalizedSearch)
          ),
        }))
        .filter((c) => c.items.length > 0)
    : categories;

  return (
    <div className="kb-stock-overlay">
      <div className="kb-stock-panel">
        <div className="kb-stock-header">
          <h2 className="kb-stock-title">Gestion des ruptures</h2>
          <button type="button" className="kb-stock-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        <div className="kb-stock-toolbar">
          <div className="kb-stock-search-wrap">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="kb-stock-search-icon"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <input
              ref={searchRef}
              type="text"
              className="kb-stock-search"
              placeholder="Chercher un plat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="kb-stock-search-clear" onClick={() => setSearch("")}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            )}
          </div>
          {outCount > 0 && (
            <button type="button" className="kb-stock-reset-btn" onClick={resetAll}>
              Tout remettre en stock ({outCount})
            </button>
          )}
        </div>

        {loading ? (
          <div className="kb-stock-loading">Chargement...</div>
        ) : (
          <div className="kb-stock-body">
            {filteredCategories.length === 0 && normalizedSearch ? (
              <div className="kb-stock-empty">Aucun résultat pour « {search} »</div>
            ) : (
              filteredCategories.map((cat) => {
                const catOutCount = cat.items.filter((i) => i.is_out_of_stock).length;
                const allOut = catOutCount === cat.items.length;
                return (
                  <div key={cat.id} className="kb-stock-category">
                    <div className="kb-stock-cat-header">
                      <span className="kb-stock-cat-label">
                        {cat.label}
                        {catOutCount > 0 && (
                          <span className="kb-stock-cat-count">{catOutCount} en rupture</span>
                        )}
                      </span>
                      <button
                        type="button"
                        className={`kb-stock-cat-toggle ${allOut ? "all-out" : ""}`}
                        onClick={() => toggleCategory(cat.id, !allOut)}
                      >
                        {allOut ? "Tout remettre" : "Tout en rupture"}
                      </button>
                    </div>
                    <div className="kb-stock-items">
                      {cat.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`kb-stock-chip ${item.is_out_of_stock ? "out" : ""}`}
                          onClick={() => toggleItem(item.id, !item.is_out_of_stock)}
                        >
                          <span className="kb-stock-chip-name">{item.name}</span>
                          <span className="kb-stock-chip-status">
                            {item.is_out_of_stock ? "✗" : "✓"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StockBanner({
  staffHeaders,
  onOpen,
}: {
  staffHeaders: () => Record<string, string>;
  onOpen: () => void;
}) {
  const [outCount, setOutCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/menu", { headers: staffHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const count = (data.categories || []).reduce(
        (sum: number, c: any) =>
          sum +
          (c.menu_items || []).filter(
            (i: any) => i.is_active && i.is_out_of_stock
          ).length,
        0
      );
      setOutCount(count);
    } catch {}
  }, [staffHeaders]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  if (outCount === 0) return null;

  return (
    <button type="button" className="kb-stock-banner" onClick={onOpen}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
      {outCount} plat{outCount > 1 ? "s" : ""} en rupture aujourd&apos;hui
    </button>
  );
}

// ── New order alert overlay ─────────────────────────────────
function NewOrderOverlay({
  pendingOrders,
  onAccept,
  onAcceptAll,
}: {
  pendingOrders: Order[];
  onAccept: (id: string) => void;
  onAcceptAll: (ids: string[]) => void;
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
            onClick={() => onAcceptAll(pendingOrders.map((o) => o.id))}
          >
            Tout accepter
          </button>
        )}
      </div>
    </div>
  );
}

// ── Bottom nav tab type ────────────────────────────────────
type NavTab = "commandes" | "carte" | "plats" | "reglages";

// ── Kanban column type ──────────────────────────────────────
type KanbanCol = "new" | "prep" | "ready";

// ── Print helper ───────────────────────────────────────────
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function printOrder(order: Order, onError?: () => void) {
  const win = window.open("", "_blank", "width=400,height=600");
  if (!win) {
    onError?.();
    return;
  }
  const items = order.order_items
    .map((i) => {
      let line = `${i.quantity}x ${escapeHtml(i.name)}`;
      if (i.variant_label) line += ` (${escapeHtml(i.variant_label)})`;
      if (i.doneness_label) line += ` — ${escapeHtml(i.doneness_label)}`;
      if (i.item_note || i.notes) line += `\n   Note: ${escapeHtml(i.item_note || i.notes || "")}`;
      return line;
    })
    .join("\n");

  win.document.write(`<!DOCTYPE html>
<html><head><title>Commande ${order.order_number}</title>
<style>
body{font-family:monospace;font-size:14px;padding:16px;max-width:350px;margin:0 auto}
h1{font-size:20px;text-align:center;margin:0 0 4px}
.sep{border-top:1px dashed #000;margin:8px 0}
.mode{text-align:center;font-weight:bold;font-size:16px}
.items{white-space:pre-wrap}
.total{font-size:18px;font-weight:bold;text-align:right}
.customer{font-size:12px}
@media print{body{padding:0}}
</style></head><body>
<h1>GRILL DUFOUR</h1>
<div class="sep"></div>
<div class="mode">${order.mode === "delivery" ? "LIVRAISON" : "À EMPORTER"}</div>
<p style="text-align:center;font-size:24px;font-weight:bold">${escapeHtml(order.order_number)}</p>
<div class="sep"></div>
<div class="items">${items}</div>
<div class="sep"></div>
<div class="total">${formatPrice(order.total)}</div>
<p>${order.payment_method === "cash" ? "Espèces" : "Carte"} — ${order.payment_status === "paid" ? "Payé" : "À encaisser"}</p>
<div class="sep"></div>
<div class="customer">
${escapeHtml(order.customer_name)}<br>
${escapeHtml(order.customer_phone)}<br>
${order.mode === "delivery" && order.delivery_address ? `${escapeHtml(order.delivery_address)}, ${escapeHtml(order.delivery_postal || "")} ${escapeHtml(order.delivery_city || "")}` : ""}
</div>
<div class="sep"></div>
<p style="text-align:center;font-size:11px">${escapeHtml(new Date(order.created_at).toLocaleString("fr-BE"))}</p>
</body></html>`);
  win.document.close();
  win.print();
}

// ── Main board ──────────────────────────────────────────────
function KitchenBoardInner() {
  const [pin, setPin] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try { return sessionStorage.getItem("gdf-staff-pin"); } catch { return null; }
    }
    return null;
  });
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(true);
  const [activeTab, setActiveTab] = useState<KanbanCol>("new");
  const [navTab, setNavTab] = useState<NavTab>("commandes");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("gdf-kitchen-theme");
        return saved === "light" ? "light" : "dark";
      } catch { return "dark"; }
    }
    return "dark";
  });
  const [rushMode, setRushMode] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showStockManager, setShowStockManager] = useState(false);
  const [delayPickerOrder, setDelayPickerOrder] = useState<{ id: string; number: string } | null>(null);
  const [batchAcceptIds, setBatchAcceptIds] = useState<string[] | null>(null);
  const [refuseOrder, setRefuseOrderState] = useState<{ id: string; number: string } | null>(null);
  const [undoActions, setUndoActions] = useState<UndoAction[]>([]);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);

  const knownOrderIds = useRef(new Set<string>());
  const originalTitle = useRef("Cuisine | Grill Dufour");
  const titleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchTimeRef = useRef<number>(Date.now());

  const alarm = useAlarmSystem();
  const alarmRef = useRef(alarm);
  alarmRef.current = alarm;
  const { permission: notifPerm, requestPermission, notify } = useNotifications();
  const notifyRef = useRef(notify);
  notifyRef.current = notify;
  const playTap = useTapSound();

  const wakeLockActive = useWakeLock();
  const [lastOrderAt, setLastOrderAt] = useState<string | null>(null);
  const [lastFetchOk, setLastFetchOk] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const sessionStartRef = useRef(new Date().toISOString());
  const fetchCountRef = useRef(0);
  const inFlightRef = useRef(new Set<string>());

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

  // ── Undo system ───────────────────────────────────────────
  const pushUndo = useCallback((label: string, undoFn: () => void) => {
    const id = Math.random().toString(36).slice(2);
    const timeout = setTimeout(() => {
      setUndoActions((prev) => prev.filter((a) => a.id !== id));
    }, 5000);
    setUndoActions((prev) => [...prev, { id, label, undo: undoFn, timeout }]);
  }, []);

  const dismissUndo = useCallback((id: string) => {
    setUndoActions((prev) => {
      const action = prev.find((a) => a.id === id);
      if (action) clearTimeout(action.timeout);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

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

      const newConfirmed = newOrders.filter(
        (o) => o.status === "confirmed" && !knownOrderIds.current.has(o.id)
      );

      if (newConfirmed.length > 0 && knownOrderIds.current.size > 0) {
        if (alarmRef.current.isUnlocked) alarmRef.current.startRinging();
        setLastOrderAt(new Date().toISOString());
        setNewOrderIds(new Set(newConfirmed.map((o) => o.id)));

        for (const o of newConfirmed) {
          notifyRef.current(
            `Commande ${o.order_number}`,
            `${o.mode === "delivery" ? "Livraison" : "À emporter"} — ${formatPrice(o.total)} — ${o.customer_name}`
          );
        }
      }

      knownOrderIds.current = newIds;
      setOrders(newOrders);
      setConnectionError(null);
      setIsOnline(true);
      setLastFetchOk(new Date().toISOString());
      fetchCountRef.current++;
      lastFetchTimeRef.current = Date.now();
    } catch {
      setConnectionError("Connexion perdue — reconnexion en cours...");
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  }, [staffHeaders]);

  // ── Polling interval ──────────────────────────────────────
  useEffect(() => {
    if (!pin) return;
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders, pin]);

  // ── Supabase Realtime subscription (auto-reconnect) ──────
  const realtimeChannelRef = useRef<any>(null);
  const rtConnectCount = useRef(0);

  const connectRealtime = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !pin) return;
    try {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
        realtimeChannelRef.current = null;
      }
      const { supabase } = await import("@/lib/supabase");
      const channelName = `orders-rt-${++rtConnectCount.current}`;
      const channel = supabase
        .channel(channelName)
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
      realtimeChannelRef.current = channel;
    } catch {
      setRealtimeConnected(false);
    }
  }, [fetchOrders, pin]);

  useEffect(() => {
    connectRealtime();
    return () => {
      realtimeChannelRef.current?.unsubscribe();
      realtimeChannelRef.current = null;
    };
  }, [connectRealtime]);

  useEffect(() => {
    if (realtimeConnected || !pin) return;
    const timeout = setTimeout(connectRealtime, 5000);
    return () => clearTimeout(timeout);
  }, [realtimeConnected, pin, connectRealtime]);

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

  // ── Visibility: re-fetch on focus + detect long sleep ─────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const elapsed = Date.now() - lastFetchTimeRef.current;
        fetchOrders();
        if (elapsed > 120000) {
          setRealtimeConnected(false);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchOrders]);

  // ── Alarm + title blink for new orders ─────────────────────
  const unacknowledgedOrders = orders.filter((o) => newOrderIds.has(o.id) && o.status === "confirmed");

  useEffect(() => {
    if (unacknowledgedOrders.length > 0) {
      startTitleBlink(unacknowledgedOrders.length);
    } else {
      alarm.stopRinging();
      stopTitleBlink();
    }
  }, [unacknowledgedOrders.length, alarm.stopRinging, startTitleBlink, stopTitleBlink]);

  const acknowledgeOrder = useCallback((id: string) => {
    setNewOrderIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const acknowledgeAll = useCallback(() => {
    setNewOrderIds(new Set());
  }, []);

  // ── Order actions ─────────────────────────────────────────
  const showActionError = useCallback((msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 4000);
  }, []);

  const advanceOrder = async (id: string, nextStatus: OrderStatus) => {
    if (inFlightRef.current.has(id)) return;
    const prev = orders.find((o) => o.id === id);
    if (!prev) return;
    const prevStatus = prev.status;

    acknowledgeOrder(id);
    inFlightRef.current.add(id);
    setOrders((p) => p.map((o) => (o.id === id ? { ...o, status: nextStatus } : o)));

    try {
      const res = await fetch("/api/staff/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...staffHeaders() },
        body: JSON.stringify({ orderId: id, status: nextStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setOrders((p) => p.map((o) => (o.id === id ? { ...o, status: prevStatus } : o)));
      inFlightRef.current.delete(id);
      showActionError(`Erreur : impossible de modifier ${prev.order_number}`);
      return;
    }

    inFlightRef.current.delete(id);
    pushUndo(
      `${prev.order_number} → ${STATUS_LABELS[nextStatus]}`,
      async () => {
        setOrders((p) => p.map((o) => (o.id === id ? { ...o, status: prevStatus } : o)));
        await fetch("/api/staff/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...staffHeaders() },
          body: JSON.stringify({ orderId: id, status: prevStatus }),
        }).catch(() => {});
      }
    );
  };

  const acceptOrderWithDelay = useCallback((id: string) => {
    const order = ordersRef.current.find((o) => o.id === id);
    if (!order) return;
    setDelayPickerOrder({ id, number: order.order_number });
  }, []);

  const confirmAcceptWithDelay = async (id: string, delay: number) => {
    setDelayPickerOrder(null);
    if (inFlightRef.current.has(id)) return;
    const prev = orders.find((o) => o.id === id);
    if (!prev) return;

    acknowledgeOrder(id);
    inFlightRef.current.add(id);
    setOrders((p) => p.map((o) => (o.id === id ? { ...o, status: "preparing" as OrderStatus } : o)));

    try {
      const res = await fetch("/api/staff/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...staffHeaders() },
        body: JSON.stringify({ orderId: id, status: "preparing", estimated_time: `${delay} min` }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setOrders((p) => p.map((o) => (o.id === id ? { ...o, status: prev.status } : o)));
      inFlightRef.current.delete(id);
      showActionError(`Erreur : impossible d'accepter ${prev.order_number}`);
      return;
    }

    inFlightRef.current.delete(id);
    pushUndo(
      `${prev.order_number} acceptée (${delay} min)`,
      async () => {
        setOrders((p) => p.map((o) => (o.id === id ? { ...o, status: prev.status } : o)));
        await fetch("/api/staff/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...staffHeaders() },
          body: JSON.stringify({ orderId: id, status: prev.status }),
        }).catch(() => {});
      }
    );
  };

  const acceptOrder = useCallback((id: string) => {
    acceptOrderWithDelay(id);
  }, [acceptOrderWithDelay]);

  const acceptAllOrders = useCallback((ids: string[]) => {
    setBatchAcceptIds(ids);
    setDelayPickerOrder({ id: "batch", number: `${ids.length} commandes` });
  }, []);

  const confirmBatchAccept = async (delay: number) => {
    const ids = batchAcceptIds;
    if (!ids) return;
    setDelayPickerOrder(null);
    setBatchAcceptIds(null);
    for (const id of ids) {
      await confirmAcceptWithDelay(id, delay);
    }
  };

  const cancelOrder = async (id: string) => {
    if (inFlightRef.current.has(id)) return;
    const prev = orders.find((o) => o.id === id);
    if (!prev) return;
    const prevStatus = prev.status;

    inFlightRef.current.add(id);
    setOrders((p) => p.map((o) => (o.id === id ? { ...o, status: "cancelled" as OrderStatus } : o)));

    try {
      const res = await fetch("/api/staff/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...staffHeaders() },
        body: JSON.stringify({ orderId: id, status: "cancelled" }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setOrders((p) => p.map((o) => (o.id === id ? { ...o, status: prevStatus } : o)));
      inFlightRef.current.delete(id);
      showActionError(`Erreur : impossible d'annuler ${prev.order_number}`);
      return;
    }

    inFlightRef.current.delete(id);
    pushUndo(
      `${prev.order_number} annulée`,
      async () => {
        setOrders((p) => p.map((o) => (o.id === id ? { ...o, status: prevStatus } : o)));
        await fetch("/api/staff/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...staffHeaders() },
          body: JSON.stringify({ orderId: id, status: prevStatus }),
        }).catch(() => {});
      }
    );
  };

  const markPaid = async (id: string) => {
    if (inFlightRef.current.has(id)) return;
    const prev = orders.find((o) => o.id === id);
    if (!prev) return;

    inFlightRef.current.add(id);
    setOrders((p) => p.map((o) => (o.id === id ? { ...o, payment_status: "paid" } : o)));

    try {
      const res = await fetch("/api/staff/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...staffHeaders() },
        body: JSON.stringify({ orderId: id, paymentStatus: "paid" }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setOrders((p) => p.map((o) => (o.id === id ? { ...o, payment_status: prev.payment_status } : o)));
      inFlightRef.current.delete(id);
      showActionError(`Erreur : impossible d'encaisser ${prev.order_number}`);
      return;
    }

    inFlightRef.current.delete(id);
    pushUndo(
      `${prev.order_number} encaissée`,
      async () => {
        setOrders((p) => p.map((o) => (o.id === id ? { ...o, payment_status: prev.payment_status } : o)));
        await fetch("/api/staff/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...staffHeaders() },
          body: JSON.stringify({ orderId: id, paymentStatus: prev.payment_status }),
        }).catch(() => {});
      }
    );
  };

  const handleRefuseOrder = (id: string) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    setRefuseOrderState({ id, number: order.order_number });
  };

  const confirmRefuseOrder = async (reason: string) => {
    if (!refuseOrder) return;
    const { id, number: orderNum } = refuseOrder;
    if (inFlightRef.current.has(id)) return;
    const prev = orders.find((o) => o.id === id);
    const prevStatus = prev?.status || ("confirmed" as OrderStatus);
    setRefuseOrderState(null);

    acknowledgeOrder(id);
    inFlightRef.current.add(id);
    setOrders((p) => p.map((o) => (o.id === id ? { ...o, status: "cancelled" as OrderStatus } : o)));

    try {
      const res = await fetch("/api/staff/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...staffHeaders() },
        body: JSON.stringify({ orderId: id, status: "cancelled", refused: true, reason }),
      });
      if (!res.ok) {
        setOrders((p) => p.map((o) => (o.id === id ? { ...o, status: prevStatus } : o)));
        inFlightRef.current.delete(id);
        showActionError(`Erreur : impossible de refuser ${orderNum}`);
        return;
      }
    } catch {
      setOrders((p) => p.map((o) => (o.id === id ? { ...o, status: prevStatus } : o)));
      inFlightRef.current.delete(id);
      showActionError(`Erreur : impossible de refuser ${orderNum}`);
      return;
    }

    inFlightRef.current.delete(id);

    pushUndo(
      `${orderNum} refusée`,
      async () => {
        setOrders((p) => p.map((o) => (o.id === id ? { ...o, status: prevStatus } : o)));
        await fetch("/api/staff/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...staffHeaders() },
          body: JSON.stringify({ orderId: id, status: prevStatus }),
        }).catch(() => {});
      }
    );
  };

  const reopenOrder = async (id: string) => {
    if (inFlightRef.current.has(id)) return;
    inFlightRef.current.add(id);
    try {
      const res = await fetch("/api/staff/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...staffHeaders() },
        body: JSON.stringify({ orderId: id, status: "pending" }),
      });
      if (res.ok) fetchOrders();
    } catch {}
    inFlightRef.current.delete(id);
  };

  const handlePrint = useCallback((order: Order) => {
    printOrder(order, () => showActionError("Impossible d'ouvrir la fenêtre d'impression. Vérifiez les pop-ups."));
  }, [showActionError]);

  // ── Sync isClosed from server on mount ─────────────────────
  useEffect(() => {
    if (!pin) return;
    (async () => {
      try {
        const res = await fetch("/api/admin/settings", {
          headers: staffHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.delivery?.is_closed === "boolean") {
            setIsClosed(data.delivery.is_closed);
          }
        }
      } catch {}
    })();
  }, [pin, staffHeaders]);

  // ── Toggle shop closed ────────────────────────────────────
  const toggleShopClosed = async () => {
    const newClosed = !isClosed;
    setIsClosed(newClosed);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...staffHeaders() },
        body: JSON.stringify({ is_closed: newClosed }),
      });
      if (!res.ok) setIsClosed(!newClosed);
    } catch {
      setIsClosed(!newClosed);
    }
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
    <div className={`staff-page kb-page ${unacknowledgedOrders.length > 0 ? "staff-page-alert" : ""}`}>
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

      {/* Shop closed banner */}
      {isClosed && (
        <div className="kb-closed-banner">
          Boutique fermée — les nouvelles commandes sont bloquées
          <button type="button" className="kb-closed-reopen" onClick={toggleShopClosed}>Rouvrir</button>
        </div>
      )}

      {/* Rush mode banner */}
      {rushMode && (
        <div className="kb-rush-banner">
          MODE RUSH — Vue simplifiée activée
        </div>
      )}

      {/* Action error banner */}
      {actionError && (
        <div className="kb-action-error-banner">
          {actionError}
          <button type="button" onClick={() => setActionError(null)} style={{ marginLeft: "0.5rem", background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "1rem" }}>&times;</button>
        </div>
      )}

      {/* Full-screen alert overlay for new orders */}
      {unacknowledgedOrders.length > 0 && (
        <NewOrderOverlay
          pendingOrders={unacknowledgedOrders}
          onAccept={(id) => { acknowledgeOrder(id); advanceOrder(id, "preparing"); }}
          onAcceptAll={(ids) => { acknowledgeAll(); acceptAllOrders(ids); }}
        />
      )}

      {/* Delay picker overlay */}
      {delayPickerOrder && (
        <DelayPicker
          orderId={delayPickerOrder.id}
          orderNumber={delayPickerOrder.number}
          onConfirm={batchAcceptIds
            ? (_id: string, delay: number) => confirmBatchAccept(delay)
            : confirmAcceptWithDelay}
          onCancel={() => { setDelayPickerOrder(null); setBatchAcceptIds(null); }}
        />
      )}

      {/* Refuse confirm overlay */}
      {refuseOrder && (
        <RefuseConfirm
          orderNumber={refuseOrder.number}
          onConfirm={confirmRefuseOrder}
          onCancel={() => setRefuseOrderState(null)}
        />
      )}

      {/* Search overlay */}
      {showSearch && (
        <SearchPanel
          allOrders={orders}
          onClose={() => setShowSearch(false)}
          onReopen={reopenOrder}
          staffHeaders={staffHeaders}
        />
      )}

      {/* Undo bar */}
      <UndoBar actions={undoActions} onDismiss={dismissUndo} />

      {/* Header */}
      <header className="kb-header">
        <div className="kb-header-left">
          <span className="kb-brand">Grill Dufour</span>
          <span className="kb-header-title">Cuisine</span>
          <span
            className="kb-conn-dot"
            data-status={!isOnline ? "offline" : !realtimeConnected ? "degraded" : "ok"}
            title={!isOnline ? "Hors ligne" : !realtimeConnected ? "Temps réel déconnecté" : "Connecté"}
          />
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
            className="kb-header-icon-btn"
            onClick={() => setShowSearch(true)}
            title="Rechercher"
          >
            <SearchIcon />
          </button>
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

      {/* Quick actions bar */}
      <QuickActionsBar
        rushMode={rushMode}
        onToggleRush={() => setRushMode(!rushMode)}
        onToggleClosed={toggleShopClosed}
        isClosed={isClosed}
        onOutOfStock={() => setShowStockManager(true)}
      />

      {/* Stock banner */}
      <StockBanner staffHeaders={staffHeaders} onOpen={() => setShowStockManager(true)} />

      {/* Stock manager overlay */}
      {showStockManager && (
        <StockManagerPanel staffHeaders={staffHeaders} onClose={() => setShowStockManager(false)} />
      )}

      {/* Main content: depends on navTab */}
      {navTab === "commandes" && (
        <>
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
                      <OrderCard key={order.id} order={order} onAdvance={advanceOrder} onAcceptWithDelay={acceptOrderWithDelay} onCancel={cancelOrder} onMarkPaid={markPaid} onRefuse={handleRefuseOrder} onPrint={handlePrint} rushMode={rushMode} playTap={playTap} />
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
                      <OrderCard key={order.id} order={order} onAdvance={advanceOrder} onAcceptWithDelay={acceptOrderWithDelay} onCancel={cancelOrder} onMarkPaid={markPaid} onRefuse={handleRefuseOrder} onPrint={handlePrint} rushMode={rushMode} playTap={playTap} />
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
                      <OrderCard key={order.id} order={order} onAdvance={advanceOrder} onAcceptWithDelay={acceptOrderWithDelay} onCancel={cancelOrder} onMarkPaid={markPaid} onRefuse={handleRefuseOrder} onPrint={handlePrint} rushMode={rushMode} playTap={playTap} />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {navTab === "carte" && (
        <PlaceholderTab
          title="Carte"
          icon={<svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M8.1 13.34l2.83-2.83L3.91 3.5a4.008 4.008 0 0 0 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/></svg>}
        />
      )}

      {navTab === "plats" && (
        <div className="kb-plats-tab">
          <DailySpecialsManager pin={pin || ""} authHeaders={staffHeaders} />
        </div>
      )}

      {navTab === "reglages" && (
        <div className="kb-settings-tab">
          <h2 className="kb-settings-title">Réglages</h2>
          <div className="kb-settings-section">
            <h3 className="kb-settings-section-title">Son &amp; alarme</h3>
            <div className="kb-settings-row">
              <span>Volume alarme</span>
              <div className="kb-settings-control">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={alarm.volume}
                  onChange={(e) => alarm.updateVolume(parseFloat(e.target.value))}
                  className="kb-volume-slider kb-volume-slider-lg"
                />
                <span className="kb-settings-value">{Math.round(alarm.volume * 100)}%</span>
              </div>
            </div>
            <div className="kb-settings-row">
              <span>Tester le son</span>
              <button type="button" className="kb-btn kb-btn-advance" onClick={alarm.testSound}>Test</button>
            </div>
          </div>
          <div className="kb-settings-section">
            <h3 className="kb-settings-section-title">Affichage</h3>
            <div className="kb-settings-row">
              <span>Thème</span>
              <button
                type="button"
                className="kb-btn kb-btn-advance"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? "Sombre" : "Clair"}
              </button>
            </div>
          </div>
          <div className="kb-settings-section">
            <h3 className="kb-settings-section-title">Diagnostic</h3>
            <div className="kb-settings-row">
              <span>Voir le diagnostic</span>
              <button
                type="button"
                className="kb-btn kb-btn-advance"
                onClick={() => setShowDiagnostics(!showDiagnostics)}
              >
                {showDiagnostics ? "Masquer" : "Afficher"}
              </button>
            </div>
            {showDiagnostics && (
              <div className="kb-diag-panel">
                <div className="kb-diag-row">
                  <span className="kb-diag-label">Connexion</span>
                  <span className={`kb-diag-value ${isOnline ? "ok" : "bad"}`}>
                    {isOnline ? "En ligne" : "Hors ligne"}
                  </span>
                </div>
                <div className="kb-diag-row">
                  <span className="kb-diag-label">Temps réel</span>
                  <span className={`kb-diag-value ${realtimeConnected ? "ok" : "bad"}`}>
                    {realtimeConnected ? "Connecté" : "Déconnecté"}
                  </span>
                </div>
                <div className="kb-diag-row">
                  <span className="kb-diag-label">Son</span>
                  <span className={`kb-diag-value ${alarm.isUnlocked ? "ok" : "bad"}`}>
                    {alarm.isUnlocked ? `Activé (${Math.round(alarm.volume * 100)}%)` : "Désactivé"}
                  </span>
                </div>
                <div className="kb-diag-row">
                  <span className="kb-diag-label">Notifications</span>
                  <span className={`kb-diag-value ${notifPerm === "granted" ? "ok" : "bad"}`}>
                    {notifPerm === "granted" ? "Autorisées" : notifPerm === "denied" ? "Refusées" : "Non demandées"}
                  </span>
                </div>
                <div className="kb-diag-row">
                  <span className="kb-diag-label">Veille écran</span>
                  <span className={`kb-diag-value ${wakeLockActive ? "ok" : "bad"}`}>
                    {wakeLockActive ? "Bloquée" : "Non bloquée"}
                  </span>
                </div>
                <div className="kb-diag-row">
                  <span className="kb-diag-label">Dernière commande</span>
                  <span className="kb-diag-value">{lastOrderAt ? timeSince(lastOrderAt) : "Aucune"}</span>
                </div>
                <div className="kb-diag-row">
                  <span className="kb-diag-label">Dernier sync réussi</span>
                  <span className="kb-diag-value">{lastFetchOk ? timeSince(lastFetchOk) : "Jamais"}</span>
                </div>
                <div className="kb-diag-row">
                  <span className="kb-diag-label">Session démarrée</span>
                  <span className="kb-diag-value">{timeSince(sessionStartRef.current)}</span>
                </div>
                <div className="kb-diag-row">
                  <span className="kb-diag-label">Syncs effectués</span>
                  <span className="kb-diag-value">{fetchCountRef.current}</span>
                </div>
                <div className="kb-diag-row">
                  <span className="kb-diag-label">Commandes actives</span>
                  <span className="kb-diag-value">{orders.length}</span>
                </div>
                <button
                  type="button"
                  className="kb-btn kb-btn-advance kb-diag-reload"
                  onClick={() => window.location.reload()}
                >
                  Recharger la page
                </button>
              </div>
            )}
          </div>
          <div className="kb-settings-section">
            <h3 className="kb-settings-section-title">Session</h3>
            <div className="kb-settings-row">
              <span>Déconnexion</span>
              <button
                type="button"
                className="kb-btn kb-btn-refuse"
                onClick={() => {
                  sessionStorage.removeItem("gdf-staff-pin");
                  setPin(null);
                }}
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="kb-bottom-nav">
        <button
          type="button"
          className={`kb-nav-item ${navTab === "commandes" ? "active" : ""}`}
          onClick={() => setNavTab("commandes")}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
          <span>Commandes</span>
          {unacknowledgedOrders.length > 0 && <span className="kb-nav-badge">{unacknowledgedOrders.length}</span>}
        </button>
        <button
          type="button"
          className={`kb-nav-item ${navTab === "carte" ? "active" : ""}`}
          onClick={() => setNavTab("carte")}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8.1 13.34l2.83-2.83L3.91 3.5a4.008 4.008 0 0 0 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/></svg>
          <span>Carte</span>
        </button>
        <button
          type="button"
          className={`kb-nav-item ${navTab === "plats" ? "active" : ""}`}
          onClick={() => setNavTab("plats")}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>
          <span>Plats du jour</span>
        </button>
        <button
          type="button"
          className={`kb-nav-item ${navTab === "reglages" ? "active" : ""}`}
          onClick={() => setNavTab("reglages")}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/></svg>
          <span>Réglages</span>
        </button>
      </nav>
    </div>
  );
}

// ── Error boundary with auto-reload ──────────────────────────
class KitchenErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; countdown: number }
> {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, countdown: 10 };
  }

  static getDerivedStateFromError() {
    return { hasError: true, countdown: 10 };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[KitchenBoard] crash:", error, info.componentStack);
  }

  componentDidUpdate(_: any, prevState: { hasError: boolean }) {
    if (this.state.hasError && !prevState.hasError) {
      this.timer = setInterval(() => {
        this.setState((s) => {
          if (s.countdown <= 1) {
            window.location.reload();
            return s;
          }
          return { ...s, countdown: s.countdown - 1 };
        });
      }, 1000);
    }
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="staff-page">
          <div className="staff-login">
            <h1>Oups — un problème est survenu</h1>
            <p>
              Rechargement automatique dans {this.state.countdown} seconde
              {this.state.countdown > 1 ? "s" : ""}...
            </p>
            <button
              type="button"
              className="staff-login-btn"
              onClick={() => window.location.reload()}
            >
              Recharger maintenant
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function KitchenBoard() {
  return (
    <KitchenErrorBoundary>
      <KitchenBoardInner />
    </KitchenErrorBoundary>
  );
}
