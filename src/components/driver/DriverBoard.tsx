"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface DriverSession {
  id: string;
  name: string;
}

interface OrderItem {
  name: string;
  variant_label: string | null;
  doneness_label: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
}

interface DeliveryOrder {
  id: string;
  order_number: string;
  status: string;
  mode: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string | null;
  house_number: string | null;
  delivery_postal: string | null;
  delivery_city: string | null;
  payment_method: string;
  payment_status: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  discount_amount: number;
  notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  prepared_at: string | null;
  estimated_delivery_at: string | null;
  assigned_driver_id: string | null;
  driver_picked_up_at: string | null;
  driver_issue: string | null;
  driver_issue_at: string | null;
  is_test: boolean;
  locale: string | null;
  order_items: OrderItem[];
}

function formatPrice(n: number) {
  return n.toFixed(2).replace(".", ",").replace(",00", "") + " €";
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
}

function minutesAgo(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

const ISSUE_OPTIONS = [
  "Client absent",
  "Mauvaise adresse",
  "Client injoignable",
  "Problème d'accès",
  "Autre problème",
];

const DRIVER_QUICK_MESSAGES = [
  "J'arrive",
  "Je suis en route",
  "Livraison terminée",
  "J'ai un souci, rappelle-moi",
];

const ETA_OPTIONS = [5, 10, 15, 20, 30];

interface DriverMessage {
  id: string;
  driver_id: string;
  sender: "driver" | "staff";
  message: string;
  is_quick: boolean;
  read_at: string | null;
  created_at: string;
}

export default function DriverBoard() {
  const [driver, setDriver] = useState<DriverSession | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [issueModal, setIssueModal] = useState<string | null>(null);
  const [customIssue, setCustomIssue] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<DriverMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{ orders: any[]; stats: { totalDelivered: number; totalAmount: number } } | null>(null);
  const [msgFlash, setMsgFlash] = useState(false);
  const [pushDenied, setPushDenied] = useState(false);
  const [showEtaPicker, setShowEtaPicker] = useState(false);

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevMsgCountRef = useRef(0);
  const pushAskedRef = useRef(false);

  const verifySession = useCallback(async (driverId: string) => {
    try {
      const res = await fetch("/api/driver/auth", {
        headers: { "x-driver-id": driverId },
      });
      if (res.ok) {
        const data = await res.json();
        setDriver(data.driver);
      } else {
        localStorage.removeItem("gdf-driver-session");
      }
    } catch {
      // offline — keep local session
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("gdf-driver-session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id) {
          verifySession(parsed.id);
          return;
        }
      }
    } catch {}
    setLoading(false);
  }, [verifySession]);

  // ── Push notification subscription ─────────────────────
  const subscribePush = useCallback(async (driverId: string): Promise<boolean> => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window)) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await fetch("/api/driver/push", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-driver-id": driverId },
          body: JSON.stringify({ subscription: existing.toJSON() }),
        });
        return true;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushDenied(true);
        return false;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await fetch("/api/driver/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-driver-id": driverId },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      return true;
    } catch {
      setPushDenied(true);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!driver || pushAskedRef.current) return;
    pushAskedRef.current = true;
    const timer = setTimeout(() => subscribePush(driver.id), 2000);
    return () => clearTimeout(timer);
  }, [driver, subscribePush]);

  // ── Orders ─────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!driver) return;
    try {
      const res = await fetch(`/api/driver/orders?t=${Date.now()}`, {
        headers: { "x-driver-id": driver.id },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {}
  }, [driver]);

  useEffect(() => {
    if (!driver) return;
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [driver, fetchOrders]);

  // Supabase Realtime for orders
  useEffect(() => {
    if (!driver || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let channel: ReturnType<typeof import("@supabase/supabase-js").SupabaseClient.prototype.channel> | undefined;
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        channel = supabase
          .channel(`driver-orders-${driver.id}`)
          .on(
            "postgres_changes" as any,
            { event: "*", schema: "public", table: "orders" },
            () => fetchOrders()
          )
          .subscribe();
      } catch {}
    })();
    return () => { (channel as any)?.unsubscribe(); };
  }, [driver, fetchOrders]);

  // ── Wake Lock ──────────────────────────────────────────
  useEffect(() => {
    if (!driver) return;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch {}
    };
    requestWakeLock();
    const reacquire = () => {
      if (document.visibilityState === "visible") requestWakeLock();
    };
    document.addEventListener("visibilitychange", reacquire);
    return () => {
      document.removeEventListener("visibilitychange", reacquire);
      wakeLockRef.current?.release();
    };
  }, [driver]);

  // ── Messaging ──────────────────────────────────────────
  const playMsgSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 600;
      gain.gain.value = 0.4;
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 900;
        gain2.gain.value = 0.4;
        osc2.start();
        osc2.stop(ctx.currentTime + 0.12);
      }, 150);
    } catch {}
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!driver) return;
    try {
      const res = await fetch(`/api/driver/messages?t=${Date.now()}`, {
        headers: { "x-driver-id": driver.id },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const msgs = (data.messages || []) as DriverMessage[];
        setMessages(msgs);
        const staffUnread = msgs.filter(
          (m) => m.sender === "staff" && !m.read_at
        ).length;

        if (staffUnread > prevMsgCountRef.current && prevMsgCountRef.current >= 0) {
          playMsgSound();
          setMsgFlash(true);
          setTimeout(() => setMsgFlash(false), 2000);
        }
        prevMsgCountRef.current = staffUnread;
        setUnreadCount(staffUnread);
      }
    } catch {}
  }, [driver, playMsgSound]);

  useEffect(() => {
    if (!driver) return;
    prevMsgCountRef.current = -1;
    fetchMessages();
    const interval = setInterval(fetchMessages, 8000);
    return () => clearInterval(interval);
  }, [driver, fetchMessages]);

  // Realtime for messages
  useEffect(() => {
    if (!driver || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let channel: any;
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        channel = supabase
          .channel(`driver-msgs-${driver.id}`)
          .on(
            "postgres_changes" as any,
            { event: "INSERT", schema: "public", table: "driver_messages", filter: `driver_id=eq.${driver.id}` },
            () => fetchMessages()
          )
          .subscribe();
      } catch {}
    })();
    return () => { channel?.unsubscribe(); };
  }, [driver, fetchMessages]);

  useEffect(() => {
    if (showChat) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showChat]);

  const sendMessage = async (text: string, isQuick: boolean) => {
    if (!driver || sendingMsg || !text.trim()) return;
    setSendingMsg(true);
    try {
      await fetch("/api/driver/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-driver-id": driver.id,
        },
        body: JSON.stringify({ message: text.trim(), is_quick: isQuick }),
      });
      setChatText("");
      await fetchMessages();
    } catch {}
    setSendingMsg(false);
  };

  // ── History ────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!driver) return;
    try {
      const res = await fetch(`/api/driver/history?t=${Date.now()}`, {
        headers: { "x-driver-id": driver.id },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch {}
  }, [driver]);

  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory, fetchHistory]);

  // ── Login ──────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/driver/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.driver) {
        localStorage.setItem("gdf-driver-session", JSON.stringify(data.driver));
        setDriver(data.driver);
        setPin("");
      } else {
        setError(data.error || "Erreur de connexion");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("gdf-driver-session");
    setDriver(null);
    setPin("");
    setOrders([]);
    setSelectedOrder(null);
    pushAskedRef.current = false;
  };

  const handleAction = async (orderId: string, action: string, issue?: string) => {
    if (!driver || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/driver/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-driver-id": driver.id,
        },
        body: JSON.stringify({ order_id: orderId, action, issue }),
      });
      if (res.ok) {
        await fetchOrders();
        if (action === "delivered") {
          setSelectedOrder(null);
        }
        setIssueModal(null);
        setCustomIssue("");
      }
    } catch {}
    setActionLoading(false);
  };

  const handleSetEta = async (orderId: string, minutes: number) => {
    if (!driver || actionLoading) return;
    setActionLoading(true);
    try {
      await fetch("/api/driver/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-driver-id": driver.id,
        },
        body: JSON.stringify({ order_id: orderId, action: "set_eta", eta_minutes: minutes }),
      });
      await fetchOrders();
      setShowEtaPicker(false);
    } catch {}
    setActionLoading(false);
  };

  const handleClearEta = async (orderId: string) => {
    if (!driver || actionLoading) return;
    setActionLoading(true);
    try {
      await fetch("/api/driver/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-driver-id": driver.id,
        },
        body: JSON.stringify({ order_id: orderId, action: "clear_eta" }),
      });
      await fetchOrders();
      setShowEtaPicker(false);
    } catch {}
    setActionLoading(false);
  };

  const enablePushNotifications = async () => {
    if (!driver) return;
    if (typeof Notification !== "undefined" && Notification.permission === "denied") {
      alert("Les notifications sont bloquées par votre navigateur.\n\nSur Android Chrome : Menu ⋮ > Paramètres > Notifications du site > autorisez ce site.\n\nSur iPhone : les notifications push ne sont disponibles qu'après avoir installé l'app (Ajouter à l'écran d'accueil).");
      return;
    }
    setPushDenied(false);
    const ok = await subscribePush(driver.id);
    if (!ok) {
      setPushDenied(true);
    }
  };

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="driver-page">
        <div className="drv-loading">Chargement…</div>
      </div>
    );
  }

  // ── Login screen ───────────────────────────────────────
  if (!driver) {
    return (
      <div className="driver-page">
        <div className="drv-login">
          <div className="drv-login-logo">
            <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour" width="100" height="48" />
          </div>
          <h1 className="drv-login-title">Espace Livreur</h1>
          <form onSubmit={handleLogin} className="drv-login-form">
            <label htmlFor="driver-pin" className="drv-label">Code PIN</label>
            <input
              id="driver-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="Entrez votre PIN"
              className="drv-input"
              maxLength={8}
              autoFocus
            />
            {error && <p className="drv-error">{error}</p>}
            <button type="submit" className="drv-btn drv-btn-primary" disabled={!pin.trim() || submitting}>
              {submitting ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const readyOrders = orders.filter((o) => o.status === "ready");
  const myDelivering = orders.filter((o) => o.status === "delivering" && o.assigned_driver_id === driver.id);
  const detail = selectedOrder ? orders.find((o) => o.id === selectedOrder) : null;

  // ── Detail view ──────────────────────────────────────────
  if (detail) {
    const fullAddress = [
      detail.delivery_address,
      detail.house_number,
      detail.delivery_postal,
      detail.delivery_city,
    ].filter(Boolean).join(", ");

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    const phoneUrl = `tel:${detail.customer_phone}`;
    const isPaid = detail.payment_method === "online" || detail.payment_status === "paid";
    const age = minutesAgo(detail.created_at);

    const etaTime = detail.estimated_delivery_at
      ? new Date(detail.estimated_delivery_at).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })
      : null;
    const etaMinutes = detail.estimated_delivery_at
      ? Math.max(0, Math.round((new Date(detail.estimated_delivery_at).getTime() - Date.now()) / 60000))
      : null;

    return (
      <div className="driver-page">
        <header className="drv-header">
          <button onClick={() => { setSelectedOrder(null); setShowEtaPicker(false); }} className="drv-back-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z" />
            </svg>
            Retour
          </button>
          <span className="drv-driver-name">{driver.name}</span>
          <span className="drv-detail-order">#{detail.order_number}</span>
        </header>

        <main className="drv-main">
          {detail.is_test && <div className="drv-test-badge">TEST</div>}
          {detail.locale === "nl" && <span className="drv-lang-badge">NL</span>}

          <div className="drv-detail-status">
            <span className={`drv-status-tag drv-status-${detail.status}`}>
              {detail.status === "ready" ? "PRÊTE" : "EN LIVRAISON"}
            </span>
            <span className="drv-detail-time">{formatTime(detail.created_at)} ({age} min)</span>
          </div>

          {/* ETA display */}
          {detail.status === "delivering" && detail.assigned_driver_id === driver.id && (
            <div className="drv-eta-section">
              {etaTime ? (
                <div className="drv-eta-display">
                  <span className="drv-eta-label">Arrivée estimée</span>
                  <span className="drv-eta-time">{etaTime}</span>
                  <span className="drv-eta-remaining">dans ~{etaMinutes} min</span>
                  <button
                    onClick={() => setShowEtaPicker(!showEtaPicker)}
                    className="drv-btn drv-btn-eta-edit"
                  >
                    Modifier
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowEtaPicker(!showEtaPicker)}
                  className="drv-btn drv-btn-eta"
                >
                  ⏱ Indiquer un temps d&apos;arrivée
                </button>
              )}

              {showEtaPicker && (
                <div className="drv-eta-picker">
                  {ETA_OPTIONS.map((min) => (
                    <button
                      key={min}
                      onClick={() => handleSetEta(detail.id, min)}
                      className="drv-btn drv-btn-eta-opt"
                      disabled={actionLoading}
                    >
                      {min} min
                    </button>
                  ))}
                  {etaTime && (
                    <button
                      onClick={() => handleClearEta(detail.id)}
                      className="drv-btn drv-btn-eta-clear"
                      disabled={actionLoading}
                    >
                      Retirer
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Address + navigation */}
          <div className="drv-detail-section">
            <h3 className="drv-detail-label">Adresse de livraison</h3>
            <p className="drv-detail-address">{fullAddress}</p>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="drv-btn drv-btn-nav">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
              </svg>
              Ouvrir dans Maps
            </a>
          </div>

          {/* Customer + phone */}
          <div className="drv-detail-section">
            <h3 className="drv-detail-label">Client</h3>
            <p className="drv-detail-customer">{detail.customer_name}</p>
            <a href={phoneUrl} className="drv-btn drv-btn-call">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              Appeler {detail.customer_name.split(" ")[0]}
            </a>
          </div>

          {/* Payment info */}
          <div className="drv-detail-section">
            <h3 className="drv-detail-label">Paiement</h3>
            <div className={`drv-payment-info ${isPaid ? "drv-paid" : "drv-cash"}`}>
              {isPaid ? (
                <span>✓ Déjà payé en ligne</span>
              ) : (
                <span>
                  💶 À encaisser : <strong>{formatPrice(detail.total)}</strong>
                  {detail.payment_method === "cash" ? " (espèces)" : " (carte/Bancontact)"}
                </span>
              )}
            </div>
          </div>

          {/* Order items */}
          <div className="drv-detail-section">
            <h3 className="drv-detail-label">Articles</h3>
            {detail.order_items.map((item, i) => (
              <div className="drv-item" key={i}>
                <span className="drv-item-qty">{item.quantity}x</span>
                <span className="drv-item-name">
                  {item.name}
                  {item.variant_label ? ` (${item.variant_label})` : ""}
                  {item.doneness_label ? ` — ${item.doneness_label}` : ""}
                </span>
                <span className="drv-item-price">{formatPrice(item.total_price)}</span>
              </div>
            ))}
            {detail.discount_amount > 0 && (
              <div className="drv-item drv-item-discount">
                <span></span>
                <span>Remise livraison</span>
                <span>−{formatPrice(detail.discount_amount)}</span>
              </div>
            )}
            <div className="drv-item drv-item-delivery">
              <span></span>
              <span>Frais de livraison</span>
              <span>{detail.delivery_fee > 0 ? formatPrice(detail.delivery_fee) : "Offerts"}</span>
            </div>
            <div className="drv-total">
              <span>Total</span>
              <span>{formatPrice(detail.total)}</span>
            </div>
          </div>

          {/* Customer notes */}
          {detail.notes && (
            <div className="drv-detail-section">
              <h3 className="drv-detail-label">Note du client</h3>
              <p className="drv-note">{detail.notes}</p>
            </div>
          )}

          {/* Driver issue */}
          {detail.driver_issue && (
            <div className="drv-detail-section drv-issue-section">
              <h3 className="drv-detail-label">⚠️ Problème signalé</h3>
              <p className="drv-issue-text">{detail.driver_issue}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="drv-actions">
            {detail.status === "ready" && (
              <button
                onClick={() => handleAction(detail.id, "pickup")}
                className="drv-btn drv-btn-action drv-btn-pickup"
                disabled={actionLoading}
              >
                {actionLoading ? "…" : "J'ai récupéré la commande"}
              </button>
            )}
            {detail.status === "delivering" && detail.assigned_driver_id === driver.id && (
              <>
                <button
                  onClick={() => handleAction(detail.id, "delivered")}
                  className="drv-btn drv-btn-action drv-btn-delivered"
                  disabled={actionLoading}
                >
                  {actionLoading ? "…" : "Livrée ✓"}
                </button>
                <button
                  onClick={() => setIssueModal(detail.id)}
                  className="drv-btn drv-btn-action drv-btn-issue"
                  disabled={actionLoading}
                >
                  Problème
                </button>
              </>
            )}
          </div>
        </main>

        {/* Issue modal */}
        {issueModal && (
          <div className="drv-modal-overlay" onClick={() => setIssueModal(null)}>
            <div className="drv-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="drv-modal-title">Signaler un problème</h3>
              <div className="drv-issue-options">
                {ISSUE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAction(issueModal, "issue", opt)}
                    className="drv-btn drv-btn-issue-opt"
                    disabled={actionLoading}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="drv-issue-custom">
                <input
                  type="text"
                  value={customIssue}
                  onChange={(e) => setCustomIssue(e.target.value)}
                  placeholder="Autre (décrire)…"
                  className="drv-input drv-input-sm"
                />
                <button
                  onClick={() => customIssue.trim() && handleAction(issueModal, "issue", customIssue.trim())}
                  className="drv-btn drv-btn-primary drv-btn-sm"
                  disabled={!customIssue.trim() || actionLoading}
                >
                  Envoyer
                </button>
              </div>
              <button onClick={() => setIssueModal(null)} className="drv-btn drv-btn-cancel">
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────
  return (
    <div className="driver-page">
      {/* Message flash notification */}
      {msgFlash && (
        <div className="drv-msg-flash">
          Nouveau message de la cuisine
        </div>
      )}

      <header className="drv-header">
        <div className="drv-header-left">
          <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour" width="60" height="29" />
        </div>
        <div className="drv-header-center">
          <span className="drv-driver-name">{driver.name}</span>
        </div>
        <button onClick={() => setShowChat(!showChat)} className={`drv-btn-chat-toggle ${unreadCount > 0 ? "drv-has-unread" : ""} ${msgFlash ? "drv-flash-pulse" : ""}`}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z" />
          </svg>
          {unreadCount > 0 && <span className="drv-unread-badge">{unreadCount}</span>}
        </button>
        <button onClick={handleLogout} className="drv-btn-logout">Déconnexion</button>
      </header>

      {/* Push notification banner */}
      {pushDenied && (
        <div className="drv-push-banner">
          <span>Activez les notifications pour être alerté des nouvelles commandes et messages.</span>
          <button onClick={enablePushNotifications} className="drv-btn drv-btn-push">Activer</button>
          <button onClick={() => setPushDenied(false)} className="drv-push-dismiss">✕</button>
        </div>
      )}

      {/* Chat panel */}
      {showChat && (
        <div className="drv-chat-panel">
          <div className="drv-chat-header">
            <h3>Messages — Cuisine</h3>
            <button onClick={() => setShowChat(false)} className="drv-chat-close">✕</button>
          </div>
          <div className="drv-chat-quick">
            {DRIVER_QUICK_MESSAGES.map((msg) => (
              <button
                key={msg}
                onClick={() => sendMessage(msg, true)}
                className="drv-btn drv-btn-quick"
                disabled={sendingMsg}
              >
                {msg}
              </button>
            ))}
          </div>
          <div className="drv-chat-messages">
            {[...messages].reverse().map((msg) => (
              <div key={msg.id} className={`drv-msg ${msg.sender === "driver" ? "drv-msg-mine" : "drv-msg-staff"}`}>
                <span className="drv-msg-text">{msg.message}</span>
                <span className="drv-msg-time">{formatTime(msg.created_at)}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form className="drv-chat-input" onSubmit={(e) => { e.preventDefault(); sendMessage(chatText, false); }}>
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Écrire un message…"
              className="drv-input drv-input-sm"
              maxLength={500}
            />
            <button type="submit" className="drv-btn drv-btn-primary drv-btn-sm" disabled={!chatText.trim() || sendingMsg}>
              {sendingMsg ? "…" : "→"}
            </button>
          </form>
        </div>
      )}

      {/* Tab bar */}
      <div className="drv-tabs">
        <button className={`drv-tab ${!showHistory ? "drv-tab-active" : ""}`} onClick={() => setShowHistory(false)}>
          Livraisons {orders.length > 0 ? `(${orders.length})` : ""}
        </button>
        <button className={`drv-tab ${showHistory ? "drv-tab-active" : ""}`} onClick={() => setShowHistory(true)}>
          Historique
        </button>
      </div>

      <main className="drv-main">
        {showHistory ? (
          <div className="drv-history">
            {history && (
              <div className="drv-history-stats">
                <div className="drv-stat-card">
                  <span className="drv-stat-value">{history.stats.totalDelivered}</span>
                  <span className="drv-stat-label">livrées aujourd&apos;hui</span>
                </div>
                <div className="drv-stat-card">
                  <span className="drv-stat-value">{formatPrice(history.stats.totalAmount)}</span>
                  <span className="drv-stat-label">montant total</span>
                </div>
              </div>
            )}
            {history?.orders.map((o: any) => {
              const addr = [o.delivery_address, o.house_number, o.delivery_postal, o.delivery_city].filter(Boolean).join(", ");
              return (
                <div key={o.id} className="drv-history-card">
                  <div className="drv-history-top">
                    <span className="drv-card-number">#{o.order_number}</span>
                    <span className={`drv-status-tag drv-status-${o.status}`}>
                      {o.status === "delivered" ? "Livrée" : o.status === "delivering" ? "En cours" : o.status}
                    </span>
                    <span className="drv-card-time">{formatTime(o.created_at)}</span>
                  </div>
                  <div className="drv-history-body">
                    <span>{o.customer_name}</span>
                    <span className="drv-card-address">{addr}</span>
                    <span className="drv-history-total">{formatPrice(o.total)}</span>
                  </div>
                </div>
              );
            })}
            {(!history || history.orders.length === 0) && (
              <div className="drv-empty">
                <p>Aucune livraison aujourd&apos;hui.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* My active deliveries */}
            {myDelivering.length > 0 && (
              <section className="drv-section">
                <h2 className="drv-section-title drv-section-delivering">
                  <span className="drv-pulse"></span>
                  En livraison ({myDelivering.length})
                </h2>
                {myDelivering.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onSelect={() => setSelectedOrder(order.id)}
                    onQuickAction={(action) => handleAction(order.id, action)}
                    actionLoading={actionLoading}
                    isMyDelivery
                  />
                ))}
              </section>
            )}

            {/* Ready for pickup */}
            {readyOrders.length > 0 && (
              <section className="drv-section">
                <h2 className="drv-section-title drv-section-ready">
                  Prêtes à récupérer ({readyOrders.length})
                </h2>
                {readyOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onSelect={() => setSelectedOrder(order.id)}
                    onQuickAction={(action) => handleAction(order.id, action)}
                    actionLoading={actionLoading}
                  />
                ))}
              </section>
            )}

            {orders.length === 0 && (
              <div className="drv-empty">
                <p>Aucune livraison pour le moment.</p>
                <p className="drv-empty-sub">Les commandes prêtes apparaîtront ici automatiquement.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function OrderCard({
  order,
  onSelect,
  onQuickAction,
  actionLoading,
  isMyDelivery,
}: {
  order: DeliveryOrder;
  onSelect: () => void;
  onQuickAction: (action: string) => void;
  actionLoading: boolean;
  isMyDelivery?: boolean;
}) {
  const fullAddress = [
    order.delivery_address,
    order.house_number,
    order.delivery_postal,
    order.delivery_city,
  ].filter(Boolean).join(", ");

  const isPaid = order.payment_method === "online" || order.payment_status === "paid";
  const age = minutesAgo(order.created_at);

  const etaTime = order.estimated_delivery_at
    ? new Date(order.estimated_delivery_at).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={`drv-card ${isMyDelivery ? "drv-card-active" : ""}`} onClick={onSelect}>
      <div className="drv-card-top">
        <span className="drv-card-number">#{order.order_number}</span>
        <span className="drv-card-time">{formatTime(order.created_at)}</span>
        {order.is_test && <span className="drv-test-badge-sm">TEST</span>}
        {order.locale === "nl" && <span className="drv-lang-badge-sm">NL</span>}
      </div>

      <div className="drv-card-body">
        <div className="drv-card-customer">{order.customer_name}</div>
        <div className="drv-card-address">{fullAddress}</div>
        <div className="drv-card-meta">
          <span className={isPaid ? "drv-meta-paid" : "drv-meta-cash"}>
            {isPaid ? "✓ Payé" : `💶 ${formatPrice(order.total)}`}
          </span>
          <span className={`drv-meta-age ${age > 15 ? "drv-meta-late" : ""}`}>
            {age} min
          </span>
          {order.order_items.length > 0 && (
            <span className="drv-meta-items">{order.order_items.reduce((s, i) => s + i.quantity, 0)} art.</span>
          )}
          {etaTime && isMyDelivery && (
            <span className="drv-meta-eta">⏱ {etaTime}</span>
          )}
        </div>
      </div>

      {/* Quick action button on card */}
      <div className="drv-card-action" onClick={(e) => e.stopPropagation()}>
        {order.status === "ready" && !isMyDelivery && (
          <button
            onClick={() => onQuickAction("pickup")}
            className="drv-btn drv-btn-sm drv-btn-pickup"
            disabled={actionLoading}
          >
            Récupérer
          </button>
        )}
        {isMyDelivery && (
          <button
            onClick={() => onQuickAction("delivered")}
            className="drv-btn drv-btn-sm drv-btn-delivered"
            disabled={actionLoading}
          >
            Livrée ✓
          </button>
        )}
      </div>
    </div>
  );
}
