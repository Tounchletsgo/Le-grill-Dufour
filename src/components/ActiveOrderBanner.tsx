"use client";

import { useState, useEffect } from "react";

interface ActiveOrder {
  id: string;
  number: string;
  status: string;
  ts: number;
}

export default function ActiveOrderBanner() {
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gdf-active-order");
      if (!raw) return;
      const parsed: ActiveOrder = JSON.parse(raw);
      if (Date.now() - parsed.ts > 4 * 60 * 60 * 1000) {
        localStorage.removeItem("gdf-active-order");
        return;
      }
      if (parsed.status === "delivered" || parsed.status === "cancelled") {
        localStorage.removeItem("gdf-active-order");
        return;
      }
      setOrder(parsed);
    } catch {}
  }, []);

  if (!order || dismissed) return null;

  const isTrackingPage = typeof window !== "undefined" && window.location.pathname.includes("/commande/");
  if (isTrackingPage) return null;

  return (
    <a
      href={`/commande/${order.id}`}
      className="active-order-banner"
      onClick={() => setDismissed(true)}
    >
      <span className="active-order-dot" />
      <span className="active-order-text">
        Suivre ma commande{order.number ? ` ${order.number}` : ""}
      </span>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
      </svg>
    </a>
  );
}
