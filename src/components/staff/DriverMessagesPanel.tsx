"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Driver {
  id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
}

interface Message {
  id: string;
  driver_id: string;
  sender: "driver" | "staff";
  message: string;
  is_quick: boolean;
  read_at: string | null;
  created_at: string;
}

interface DriverAlert {
  driverName: string;
  driverId: string;
  messagePreview: string;
}

const STAFF_QUICK_MESSAGES = [
  "Prêt dans 5 min",
  "Prêt maintenant",
  "Retard",
  "Rappelle-moi",
];

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
}

function DriverMessageAlert({
  alert,
  onDismiss,
  onOpen,
}: {
  alert: DriverAlert;
  onDismiss: () => void;
  onOpen: () => void;
}) {
  const [flash, setFlash] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setFlash((f) => !f), 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try { navigator.vibrate?.([200, 100, 200, 100, 400]); } catch {}
  }, []);

  return (
    <div className={`kb-driver-alert-overlay ${flash ? "kb-driver-alert-flash" : ""}`}>
      <div className="kb-driver-alert-content">
        <div className="kb-driver-alert-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z" />
          </svg>
        </div>
        <div className="kb-driver-alert-title">Message de {alert.driverName}</div>
        {alert.messagePreview && (
          <div className="kb-driver-alert-preview">&ldquo;{alert.messagePreview}&rdquo;</div>
        )}
        <div className="kb-driver-alert-actions">
          <button type="button" className="kb-driver-alert-open" onClick={onOpen}>
            Ouvrir
          </button>
          <button type="button" className="kb-driver-alert-dismiss" onClick={onDismiss}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DriverMessagesPanel({
  staffPin,
}: {
  staffPin: string;
}) {
  const [open, setOpen] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [chatText, setChatText] = useState("");
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState<DriverAlert | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const chimeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const driversRef = useRef<Driver[]>([]);
  const prevUnreadRef = useRef(-1);
  const readDriversRef = useRef<Set<string>>(new Set());
  driversRef.current = drivers;

  useEffect(() => {
    const unlock = () => {
      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new AudioContext();
        }
        if (audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume();
        }
      } catch {}
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
    document.addEventListener("click", unlock);
    document.addEventListener("touchstart", unlock);
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
  }, []);

  const hdrs = useCallback(() => ({
    "Content-Type": "application/json",
    "x-admin-pin": staffPin,
  }), [staffPin]);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/drivers", { headers: hdrs() });
      if (res.ok) {
        const data = await res.json();
        setDrivers((data.drivers || []).filter((d: Driver) => d.is_active));
      }
    } catch {}
  }, [hdrs]);

  const playMsgPing = useCallback(() => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 600;
      gain.gain.value = 0.5;
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 900;
          gain2.gain.value = 0.5;
          osc2.start();
          osc2.stop(ctx.currentTime + 0.12);
        } catch {}
      }, 150);
    } catch {}
  }, []);

  const stopChime = useCallback(() => {
    if (chimeIntervalRef.current) {
      clearInterval(chimeIntervalRef.current);
      chimeIntervalRef.current = null;
    }
  }, []);

  const playMessageChime = useCallback(() => {
    stopChime();
    const playOnce = () => {
      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") ctx.resume();
        const now = ctx.currentTime;

        const notes = [523, 659, 784];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.9, now + i * 0.2);
          gain.gain.linearRampToValueAtTime(0, now + i * 0.2 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.2);
          osc.stop(now + i * 0.2 + 0.35);
        });

        const notes2 = [784, 659, 523];
        notes2.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.9, now + 0.8 + i * 0.2);
          gain.gain.linearRampToValueAtTime(0, now + 0.8 + i * 0.2 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + 0.8 + i * 0.2);
          osc.stop(now + 0.8 + i * 0.2 + 0.35);
        });
      } catch {}
    };

    playOnce();
    chimeIntervalRef.current = setInterval(playOnce, 3000);
  }, [stopChime]);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/messages?t=${Date.now()}`, {
        headers: hdrs(),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const allUnread: { id: string; driver_id: string; message: string }[] = data.messages || [];
        const filtered = allUnread.filter((m) => !readDriversRef.current.has(m.driver_id));
        const displayCount = filtered.length;
        const prev = prevUnreadRef.current;
        if (displayCount > prev && prev >= 0 && filtered.length > 0) {
          const newest = filtered[0];
          const driverName = driversRef.current.find((d) => d.id === newest.driver_id)?.name || "Livreur";
          setAlert({
            driverName,
            driverId: newest.driver_id,
            messagePreview: (newest.message || "").slice(0, 80),
          });
          playMessageChime();
        }
        prevUnreadRef.current = displayCount;
        setUnreadTotal(displayCount);
      }
    } catch {}
  }, [hdrs, playMessageChime]);

  const fetchConversation = useCallback(async (driverId: string) => {
    try {
      const res = await fetch(`/api/staff/messages?driver_id=${driverId}&t=${Date.now()}`, {
        headers: hdrs(),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {}
  }, [hdrs]);

  const markRead = useCallback(async (driverId: string) => {
    readDriversRef.current.add(driverId);
    prevUnreadRef.current = -1;
    try {
      await fetch("/api/staff/messages", {
        method: "PATCH",
        headers: hdrs(),
        body: JSON.stringify({ driver_id: driverId }),
      });
    } catch {}
    await fetchUnread();
  }, [hdrs, fetchUnread]);

  useEffect(() => {
    fetchDrivers();
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [fetchDrivers, fetchUnread]);

  // Global Realtime for all driver messages (triggers fetchUnread instantly)
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let channel: any;
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        channel = supabase
          .channel("staff-all-driver-msgs")
          .on(
            "postgres_changes" as any,
            { event: "INSERT", schema: "public", table: "driver_messages" },
            (payload: any) => {
              if (payload?.new?.sender === "driver") {
                fetchUnread();
              }
            }
          )
          .subscribe();
      } catch {}
    })();
    return () => { channel?.unsubscribe(); };
  }, [fetchUnread]);

  useEffect(() => {
    if (!selectedDriver) return;
    readDriversRef.current.add(selectedDriver);
    fetchConversation(selectedDriver);
    markRead(selectedDriver);
    const interval = setInterval(() => fetchConversation(selectedDriver), 5000);
    return () => clearInterval(interval);
  }, [selectedDriver, fetchConversation, markRead]);

  // Realtime for messages
  useEffect(() => {
    if (!selectedDriver || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let channel: any;
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        channel = supabase
          .channel(`staff-msgs-${selectedDriver}`)
          .on(
            "postgres_changes" as any,
            { event: "INSERT", schema: "public", table: "driver_messages", filter: `driver_id=eq.${selectedDriver}` },
            (payload: any) => {
              if (payload?.new?.sender === "driver") {
                playMsgPing();
              }
              fetchConversation(selectedDriver);
              markRead(selectedDriver);
            }
          )
          .subscribe();
      } catch {}
    })();
    return () => { channel?.unsubscribe(); };
  }, [selectedDriver, fetchConversation, markRead, playMsgPing]);

  useEffect(() => {
    if (open && selectedDriver) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, selectedDriver]);

  const dismissAlert = useCallback(() => {
    setAlert(null);
    stopChime();
  }, [stopChime]);

  useEffect(() => {
    return () => stopChime();
  }, [stopChime]);

  const handleSelectDriver = useCallback((driverId: string) => {
    setSelectedDriver(driverId);
    readDriversRef.current.add(driverId);
    setUnreadTotal((prev) => {
      const immediate = Math.max(0, prev);
      return immediate;
    });
    fetchUnread();
  }, [fetchUnread]);

  const handleClosePanel = useCallback(() => {
    setOpen(false);
    setSelectedDriver(null);
  }, []);

  const sendMessage = async (text: string, isQuick: boolean) => {
    if (!selectedDriver || sending || !text.trim()) return;
    setSending(true);
    try {
      await fetch("/api/staff/messages", {
        method: "POST",
        headers: hdrs(),
        body: JSON.stringify({
          driver_id: selectedDriver,
          message: text.trim(),
          is_quick: isQuick,
        }),
      });
      setChatText("");
      await fetchConversation(selectedDriver);
    } catch {}
    setSending(false);
  };

  if (!open) {
    return (
      <>
        {alert && <DriverMessageAlert alert={alert} onDismiss={dismissAlert} onOpen={() => {
          setOpen(true);
          handleSelectDriver(alert.driverId);
          dismissAlert();
          fetchDrivers();
        }} />}
        <button
          type="button"
          onClick={() => { setOpen(true); fetchDrivers(); }}
          className={`kb-driver-msg-toggle ${unreadTotal > 0 ? "kb-driver-msg-unread" : ""}`}
          title="Messages livreurs"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z" />
          </svg>
          {unreadTotal > 0 && <span className="kb-driver-msg-badge">{unreadTotal}</span>}
        </button>
      </>
    );
  }

  return (
    <div className="kb-driver-panel">
      {alert && <DriverMessageAlert alert={alert} onDismiss={dismissAlert} onOpen={() => {
        handleSelectDriver(alert.driverId);
        dismissAlert();
      }} />}
      <div className="kb-driver-panel-header">
        <h3>Messages livreurs</h3>
        <button onClick={handleClosePanel} className="kb-driver-panel-close">✕</button>
      </div>

      {!selectedDriver ? (
        <div className="kb-driver-list">
          {drivers.length === 0 ? (
            <p className="kb-driver-empty">Aucun livreur actif</p>
          ) : (
            drivers.map((d) => (
              <button
                key={d.id}
                onClick={() => handleSelectDriver(d.id)}
                className="kb-driver-item"
              >
                <span className="kb-driver-item-name">{d.name}</span>
                {d.phone && <span className="kb-driver-item-phone">{d.phone}</span>}
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="kb-driver-chat">
          <button onClick={() => setSelectedDriver(null)} className="kb-driver-back">
            ← Livreurs
          </button>
          <div className="kb-driver-quick">
            {STAFF_QUICK_MESSAGES.map((msg) => (
              <button
                key={msg}
                onClick={() => sendMessage(msg, true)}
                className="kb-driver-quick-btn"
                disabled={sending}
              >
                {msg}
              </button>
            ))}
          </div>
          <div className="kb-driver-messages">
            {[...messages].reverse().map((msg) => (
              <div key={msg.id} className={`kb-driver-msg ${msg.sender === "staff" ? "kb-driver-msg-mine" : "kb-driver-msg-driver"}`}>
                <span>{msg.message}</span>
                <span className="kb-driver-msg-time">{formatTime(msg.created_at)}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form className="kb-driver-input" onSubmit={(e) => { e.preventDefault(); sendMessage(chatText, false); }}>
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Message…"
              className="kb-driver-text-input"
              maxLength={500}
            />
            <button type="submit" className="kb-driver-send-btn" disabled={!chatText.trim() || sending}>
              →
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
