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

const STAFF_QUICK_MESSAGES = [
  "Prêt dans 5 min",
  "Prêt maintenant",
  "Retard",
  "Rappelle-moi",
];

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const headers = useCallback(() => ({
    "Content-Type": "application/json",
    "x-admin-pin": staffPin,
  }), [staffPin]);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/drivers", { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setDrivers((data.drivers || []).filter((d: Driver) => d.is_active));
      }
    } catch {}
  }, [headers]);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/messages?t=${Date.now()}`, {
        headers: headers(),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const msgs = data.messages || [];
        const newCount = msgs.length;
        if (newCount > unreadTotal && unreadTotal > 0) {
          playNotification();
        }
        setUnreadTotal(newCount);
      }
    } catch {}
  }, [headers, unreadTotal]);

  const fetchConversation = useCallback(async (driverId: string) => {
    try {
      const res = await fetch(`/api/staff/messages?driver_id=${driverId}&t=${Date.now()}`, {
        headers: headers(),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {}
  }, [headers]);

  const markRead = useCallback(async (driverId: string) => {
    try {
      await fetch("/api/staff/messages", {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ driver_id: driverId }),
      });
      fetchUnread();
    } catch {}
  }, [headers, fetchUnread]);

  useEffect(() => {
    fetchDrivers();
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [fetchDrivers, fetchUnread]);

  useEffect(() => {
    if (!selectedDriver) return;
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
            () => {
              fetchConversation(selectedDriver);
              markRead(selectedDriver);
            }
          )
          .subscribe();
      } catch {}
    })();
    return () => { channel?.unsubscribe(); };
  }, [selectedDriver, fetchConversation, markRead]);

  useEffect(() => {
    if (open && selectedDriver) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, selectedDriver]);

  const playNotification = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1000;
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(ctx.currentTime + 0.15);
      }, 200);
    } catch {}
  };

  const sendMessage = async (text: string, isQuick: boolean) => {
    if (!selectedDriver || sending || !text.trim()) return;
    setSending(true);
    try {
      await fetch("/api/staff/messages", {
        method: "POST",
        headers: headers(),
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
    );
  }

  return (
    <div className="kb-driver-panel">
      <div className="kb-driver-panel-header">
        <h3>Messages livreurs</h3>
        <button onClick={() => { setOpen(false); setSelectedDriver(null); }} className="kb-driver-panel-close">✕</button>
      </div>

      {!selectedDriver ? (
        <div className="kb-driver-list">
          {drivers.length === 0 ? (
            <p className="kb-driver-empty">Aucun livreur actif</p>
          ) : (
            drivers.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDriver(d.id)}
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
