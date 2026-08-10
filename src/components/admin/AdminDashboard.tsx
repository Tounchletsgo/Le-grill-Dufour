"use client";

import { useState, useEffect, useCallback } from "react";

type Tab = "orders" | "menu" | "settings";

interface AdminOrder {
  id: string;
  order_number: string;
  status: string;
  mode: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes: string | null;
  created_at: string;
  order_items: { name: string; variant_label: string | null; quantity: number; total_price: number }[];
}

interface Stats {
  todayCount: number;
  todayRevenue: number;
  todayCancelled: number;
}

interface AdminCategory {
  id: string;
  slug: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  menu_items: AdminMenuItem[];
}

interface AdminMenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number | null;
  is_orderable: boolean;
  is_active: boolean;
  sort_order: number;
  item_variants: { id: string; label: string; price: number }[];
  item_supplements: { id: string; label: string; price: number }[];
}

interface DeliveryConfig {
  id: string;
  is_enabled: boolean;
  min_order: number;
  fee: number;
  free_from: number;
  zone_description: string | null;
  zone_radius_km: number;
  zone_center_postal: string;
  estimated_time: string;
  pickup_time: string;
}

interface OpeningHour {
  id: string;
  day_label: string;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  sort_order: number;
}

function formatPrice(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-BE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  ready: "Prête",
  delivering: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  preparing: "#8b5cf6",
  ready: "#10b981",
  delivering: "#06b6d4",
  delivered: "#6b7280",
  cancelled: "#ef4444",
};

export default function AdminDashboard() {
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [tab, setTab] = useState<Tab>("orders");

  useEffect(() => {
    const stored = sessionStorage.getItem("gdf-admin-pin");
    if (stored) {
      setPin(stored);
      setAuthenticated(true);
    }
  }, []);

  function handleLogin() {
    if (pinInput.length >= 4) {
      setPin(pinInput);
      sessionStorage.setItem("gdf-admin-pin", pinInput);
      setAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  }

  if (!authenticated) {
    return (
      <div className="adm-page">
        <div className="adm-login">
          <img src="/logo-grill-du-four.webp" alt="Le Grill du Four" width="48" height="48" />
          <h1>Administration</h1>
          <p>Entrez le code PIN pour accéder au back-office.</p>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Code PIN"
            className="adm-input"
            autoFocus
          />
          {pinError && <p className="adm-error">PIN trop court (min 4 caractères)</p>}
          <button onClick={handleLogin} className="adm-btn adm-btn-primary">Connexion</button>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-page">
      <header className="adm-header">
        <div className="adm-header-left">
          <img src="/logo-grill-du-four.webp" alt="" width="32" height="32" />
          <h1>Back-office</h1>
        </div>
        <button className="adm-btn adm-btn-ghost" onClick={() => { sessionStorage.removeItem("gdf-admin-pin"); setAuthenticated(false); setPin(""); }}>
          Déconnexion
        </button>
      </header>

      <nav className="adm-tabs">
        {(["orders", "menu", "settings"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`adm-tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "orders" ? "Commandes" : t === "menu" ? "Menu" : "Paramètres"}
          </button>
        ))}
      </nav>

      <main className="adm-main">
        {tab === "orders" && <OrdersTab pin={pin} />}
        {tab === "menu" && <MenuTab pin={pin} />}
        {tab === "settings" && <SettingsTab pin={pin} />}
      </main>
    </div>
  );
}

/* ───────────── Orders Tab ───────────── */

function OrdersTab({ pin }: { pin: string }) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?page=${page}&status=${statusFilter}`, {
        headers: { "x-admin-pin": pin },
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders);
        setTotal(data.total);
        setStats(data.stats);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [pin, page, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function updateStatus(orderId: string, status: string) {
    await fetch("/api/staff/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    fetchOrders();
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      {stats && (
        <div className="adm-stats">
          <div className="adm-stat">
            <span className="adm-stat-value">{stats.todayCount}</span>
            <span className="adm-stat-label">Commandes du jour</span>
          </div>
          <div className="adm-stat">
            <span className="adm-stat-value">{formatPrice(stats.todayRevenue)}</span>
            <span className="adm-stat-label">Chiffre du jour</span>
          </div>
          <div className="adm-stat">
            <span className="adm-stat-value">{stats.todayCancelled}</span>
            <span className="adm-stat-label">Annulées</span>
          </div>
        </div>
      )}

      <div className="adm-filters">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="adm-select"
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="adm-loading">Chargement...</div>
      ) : orders.length === 0 ? (
        <div className="adm-empty">Aucune commande.</div>
      ) : (
        <div className="adm-orders-list">
          {orders.map((order) => (
            <div key={order.id} className="adm-order-card">
              <div className="adm-order-row" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                <div className="adm-order-info">
                  <strong>{order.order_number}</strong>
                  <span className="adm-order-name">{order.customer_name}</span>
                  <span className="adm-order-date">{formatDate(order.created_at)}</span>
                </div>
                <div className="adm-order-meta">
                  <span className="adm-badge" style={{ background: STATUS_COLORS[order.status] || "#666" }}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  <span className="adm-order-total">{formatPrice(order.total)}</span>
                </div>
              </div>

              {expandedId === order.id && (
                <div className="adm-order-detail">
                  <div className="adm-detail-grid">
                    <div>
                      <p><strong>Mode :</strong> {order.mode === "delivery" ? "Livraison" : "À emporter"}</p>
                      <p><strong>Tél :</strong> {order.customer_phone}</p>
                      {order.customer_email && <p><strong>Email :</strong> {order.customer_email}</p>}
                      {order.delivery_address && <p><strong>Adresse :</strong> {order.delivery_address}, {order.delivery_city}</p>}
                      <p><strong>Paiement :</strong> {order.payment_method === "cash" ? "Espèces" : order.payment_method === "online" ? "En ligne" : "Carte"} ({order.payment_status})</p>
                      {order.notes && <p><strong>Notes :</strong> {order.notes}</p>}
                    </div>
                    <div>
                      <p className="adm-detail-title">Articles</p>
                      {order.order_items?.map((item, i) => (
                        <p key={i} className="adm-detail-item">
                          {item.quantity}x {item.name}
                          {item.variant_label ? ` (${item.variant_label})` : ""}
                          <span>{formatPrice(item.total_price)}</span>
                        </p>
                      ))}
                      {order.delivery_fee > 0 && (
                        <p className="adm-detail-item adm-detail-fee">
                          Livraison <span>{formatPrice(order.delivery_fee)}</span>
                        </p>
                      )}
                      <p className="adm-detail-total">Total <span>{formatPrice(order.total)}</span></p>
                    </div>
                  </div>

                  {order.status !== "delivered" && order.status !== "cancelled" && (
                    <div className="adm-order-actions">
                      {order.status === "pending" && (
                        <>
                          <button className="adm-btn adm-btn-success" onClick={() => updateStatus(order.id, "confirmed")}>Confirmer</button>
                          <button className="adm-btn adm-btn-danger" onClick={() => updateStatus(order.id, "cancelled")}>Annuler</button>
                        </>
                      )}
                      {order.status === "confirmed" && (
                        <button className="adm-btn adm-btn-primary" onClick={() => updateStatus(order.id, "preparing")}>En préparation</button>
                      )}
                      {order.status === "preparing" && (
                        <button className="adm-btn adm-btn-success" onClick={() => updateStatus(order.id, "ready")}>Prête</button>
                      )}
                      {order.status === "ready" && order.mode === "delivery" && (
                        <button className="adm-btn adm-btn-primary" onClick={() => updateStatus(order.id, "delivering")}>En livraison</button>
                      )}
                      {(order.status === "ready" || order.status === "delivering") && (
                        <button className="adm-btn adm-btn-success" onClick={() => updateStatus(order.id, "delivered")}>Livrée</button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="adm-pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="adm-btn adm-btn-ghost">Précédent</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="adm-btn adm-btn-ghost">Suivant</button>
        </div>
      )}
    </div>
  );
}

/* ───────────── Menu Tab ───────────── */

function MenuTab({ pin }: { pin: string }) {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string | number | boolean>>({});
  const [saving, setSaving] = useState(false);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/menu", { headers: { "x-admin-pin": pin } });
      const data = await res.json();
      if (res.ok) setCategories(data.categories);
    } catch { /* ignore */ }
    setLoading(false);
  }, [pin]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  function startEdit(item: AdminMenuItem) {
    setEditingItem(item.id);
    setEditData({
      name: item.name,
      description: item.description || "",
      price: item.price || 0,
      is_active: item.is_active,
      is_orderable: item.is_orderable,
    });
  }

  async function saveEdit(itemId: string) {
    setSaving(true);
    await fetch("/api/admin/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify({
        table: "menu_items",
        id: itemId,
        data: {
          name: editData.name,
          description: editData.description || null,
          price: editData.price ? parseFloat(String(editData.price)) : null,
          is_active: editData.is_active,
          is_orderable: editData.is_orderable,
        },
      }),
    });
    setEditingItem(null);
    setSaving(false);
    fetchMenu();
  }

  async function toggleCategory(catId: string, active: boolean) {
    await fetch("/api/admin/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify({ table: "categories", id: catId, data: { is_active: active } }),
    });
    fetchMenu();
  }

  async function toggleItem(itemId: string, active: boolean) {
    await fetch("/api/admin/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify({ table: "menu_items", id: itemId, data: { is_active: active } }),
    });
    fetchMenu();
  }

  if (loading) return <div className="adm-loading">Chargement du menu...</div>;

  return (
    <div>
      <p className="adm-info">Cliquez sur une catégorie pour voir et modifier ses articles.</p>
      <div className="adm-menu-list">
        {categories.map((cat) => (
          <div key={cat.id} className="adm-menu-cat">
            <div
              className="adm-menu-cat-header"
              onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
            >
              <div className="adm-menu-cat-info">
                <strong>{cat.label}</strong>
                <span className="adm-menu-cat-count">{cat.menu_items?.length || 0} articles</span>
              </div>
              <div className="adm-menu-cat-actions">
                <button
                  className={`adm-toggle ${cat.is_active ? "on" : ""}`}
                  onClick={(e) => { e.stopPropagation(); toggleCategory(cat.id, !cat.is_active); }}
                  title={cat.is_active ? "Désactiver" : "Activer"}
                >
                  <span className="adm-toggle-dot" />
                </button>
                <svg viewBox="0 0 24 24" width="16" height="16" className={`adm-chevron ${expandedCat === cat.id ? "open" : ""}`}>
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </div>
            </div>

            {expandedCat === cat.id && (
              <div className="adm-menu-items">
                {cat.menu_items?.sort((a, b) => a.sort_order - b.sort_order).map((item) => (
                  <div key={item.id} className={`adm-menu-item ${!item.is_active ? "inactive" : ""}`}>
                    {editingItem === item.id ? (
                      <div className="adm-edit-form">
                        <input
                          className="adm-input"
                          value={editData.name as string}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          placeholder="Nom"
                        />
                        <input
                          className="adm-input"
                          value={editData.description as string}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          placeholder="Description"
                        />
                        <input
                          className="adm-input"
                          type="number"
                          step="0.01"
                          value={editData.price as number}
                          onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                          placeholder="Prix"
                        />
                        <label className="adm-checkbox">
                          <input
                            type="checkbox"
                            checked={editData.is_orderable as boolean}
                            onChange={(e) => setEditData({ ...editData, is_orderable: e.target.checked })}
                          />
                          Commandable en ligne
                        </label>
                        <div className="adm-edit-actions">
                          <button className="adm-btn adm-btn-success" onClick={() => saveEdit(item.id)} disabled={saving}>
                            {saving ? "..." : "Enregistrer"}
                          </button>
                          <button className="adm-btn adm-btn-ghost" onClick={() => setEditingItem(null)}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <div className="adm-item-row">
                        <div className="adm-item-info">
                          <span className="adm-item-name">{item.name}</span>
                          {item.price && <span className="adm-item-price">{formatPrice(item.price)}</span>}
                          {item.item_variants?.length > 0 && (
                            <span className="adm-item-variants">
                              {item.item_variants.map((v) => `${v.label}: ${formatPrice(v.price)}`).join(" · ")}
                            </span>
                          )}
                          {!item.is_orderable && <span className="adm-tag">Non commandable</span>}
                        </div>
                        <div className="adm-item-actions">
                          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => startEdit(item)}>
                            Modifier
                          </button>
                          <button
                            className={`adm-toggle ${item.is_active ? "on" : ""}`}
                            onClick={() => toggleItem(item.id, !item.is_active)}
                            title={item.is_active ? "Masquer" : "Afficher"}
                          >
                            <span className="adm-toggle-dot" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Settings Tab ───────────── */

function SettingsTab({ pin }: { pin: string }) {
  const [delivery, setDelivery] = useState<DeliveryConfig | null>(null);
  const [hours, setHours] = useState<OpeningHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings", { headers: { "x-admin-pin": pin } });
        const data = await res.json();
        if (res.ok) {
          setDelivery(data.delivery);
          setHours(data.hours);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [pin]);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify({ delivery, hours }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="adm-loading">Chargement...</div>;

  return (
    <div>
      {delivery && (
        <section className="adm-section">
          <h2>Livraison</h2>
          <div className="adm-form-grid">
            <label className="adm-field">
              <span>Livraison activée</span>
              <button
                className={`adm-toggle ${delivery.is_enabled ? "on" : ""}`}
                onClick={() => setDelivery({ ...delivery, is_enabled: !delivery.is_enabled })}
              >
                <span className="adm-toggle-dot" />
              </button>
            </label>
            <label className="adm-field">
              <span>Commande minimum (€)</span>
              <input
                type="number" className="adm-input" step="0.5"
                value={delivery.min_order}
                onChange={(e) => setDelivery({ ...delivery, min_order: parseFloat(e.target.value) })}
              />
            </label>
            <label className="adm-field">
              <span>Frais de livraison (€)</span>
              <input
                type="number" className="adm-input" step="0.5"
                value={delivery.fee}
                onChange={(e) => setDelivery({ ...delivery, fee: parseFloat(e.target.value) })}
              />
            </label>
            <label className="adm-field">
              <span>Gratuit à partir de (€)</span>
              <input
                type="number" className="adm-input" step="0.5"
                value={delivery.free_from}
                onChange={(e) => setDelivery({ ...delivery, free_from: parseFloat(e.target.value) })}
              />
            </label>
            <label className="adm-field">
              <span>Rayon (km)</span>
              <input
                type="number" className="adm-input"
                value={delivery.zone_radius_km}
                onChange={(e) => setDelivery({ ...delivery, zone_radius_km: parseInt(e.target.value) })}
              />
            </label>
            <label className="adm-field">
              <span>Code postal centre</span>
              <input
                className="adm-input"
                value={delivery.zone_center_postal}
                onChange={(e) => setDelivery({ ...delivery, zone_center_postal: e.target.value })}
              />
            </label>
            <label className="adm-field">
              <span>Temps estimé livraison</span>
              <input
                className="adm-input"
                value={delivery.estimated_time}
                onChange={(e) => setDelivery({ ...delivery, estimated_time: e.target.value })}
              />
            </label>
            <label className="adm-field">
              <span>Temps estimé retrait</span>
              <input
                className="adm-input"
                value={delivery.pickup_time}
                onChange={(e) => setDelivery({ ...delivery, pickup_time: e.target.value })}
              />
            </label>
            <label className="adm-field adm-field-wide">
              <span>Description zone</span>
              <input
                className="adm-input"
                value={delivery.zone_description || ""}
                onChange={(e) => setDelivery({ ...delivery, zone_description: e.target.value })}
              />
            </label>
          </div>
        </section>
      )}

      <section className="adm-section">
        <h2>Horaires d'ouverture</h2>
        <div className="adm-hours-list">
          {hours.map((h, i) => (
            <div key={h.id} className="adm-hour-row">
              <span className="adm-hour-day">{h.day_label}</span>
              <button
                className={`adm-toggle ${!h.is_closed ? "on" : ""}`}
                onClick={() => {
                  const updated = [...hours];
                  updated[i] = { ...h, is_closed: !h.is_closed };
                  setHours(updated);
                }}
              >
                <span className="adm-toggle-dot" />
              </button>
              {!h.is_closed ? (
                <div className="adm-hour-times">
                  <input
                    type="time" className="adm-input adm-input-sm"
                    value={h.open_time || ""}
                    onChange={(e) => {
                      const updated = [...hours];
                      updated[i] = { ...h, open_time: e.target.value };
                      setHours(updated);
                    }}
                  />
                  <span>—</span>
                  <input
                    type="time" className="adm-input adm-input-sm"
                    value={h.close_time || ""}
                    onChange={(e) => {
                      const updated = [...hours];
                      updated[i] = { ...h, close_time: e.target.value };
                      setHours(updated);
                    }}
                  />
                </div>
              ) : (
                <span className="adm-hour-closed">Fermé</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="adm-save-bar">
        <button className="adm-btn adm-btn-primary" onClick={save} disabled={saving}>
          {saving ? "Enregistrement..." : saved ? "Enregistré !" : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}
