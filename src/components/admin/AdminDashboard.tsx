"use client";

import { useState, useEffect, useCallback } from "react";
import ContentEditor from "./ContentEditor";
import StreetsManager from "./StreetsManager";

type Tab = "orders" | "menu" | "delivery-menu" | "cuissons" | "streets" | "avis" | "retours" | "contenu" | "settings";
type AuthMode = "pin" | "supabase";
type UserRole = "admin" | "staff";

interface AuthState {
  mode: AuthMode;
  pin?: string;
  token?: string;
  role: UserRole;
  userEmail?: string;
}

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
  discount_amount: number;
  total: number;
  notes: string | null;
  created_at: string;
  order_items: { name: string; variant_label: string | null; quantity: number; total_price: number; doneness_label?: string | null }[];
}

interface Stats {
  todayCount: number;
  todayRevenue: number;
  todayCancelled: number;
  todayCash: number;
  todayCard: number;
  todayPaid: number;
  todayUnpaid: number;
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
  is_deliverable: boolean;
  delivery_price: number | null;
  delivery_description: string | null;
  delivery_sort_order: number | null;
  is_delivery_only: boolean;
  item_variants: { id: string; label: string; price: number }[];
  item_supplements: { id: string; label: string; price: number }[];
}

interface DeliveryConfig {
  id: string;
  is_enabled: boolean;
  min_order: number;
  fee: number;
  zone_description: string | null;
  zone_radius_km: number;
  zone_center_postal: string;
  estimated_time: string;
  pickup_time: string;
  delivery_min_time: number;
  delivery_max_time: number;
  discount_percentage: number;
  discount_active: boolean;
  feedback_delay_hours: number;
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

const TAB_LABELS: Record<Tab, string> = {
  orders: "Commandes",
  menu: "Menu",
  "delivery-menu": "Carte livraison",
  cuissons: "Cuissons",
  streets: "Rues",
  avis: "Avis Google",
  retours: "Retours",
  contenu: "Contenu",
  settings: "Paramètres",
};

function getVisibleTabs(role: UserRole): Tab[] {
  if (role === "admin") return ["orders", "menu", "delivery-menu", "cuissons", "streets", "avis", "retours", "contenu", "settings"];
  return ["orders"];
}

export default function AdminDashboard() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loginMode, setLoginMode] = useState<"email" | "pin">("email");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("orders");

  useEffect(() => {
    const storedPin = sessionStorage.getItem("gdf-admin-pin");
    if (storedPin) {
      setAuth({ mode: "pin", pin: storedPin, role: "admin" });
      return;
    }
    const storedToken = sessionStorage.getItem("gdf-admin-token");
    const storedRole = sessionStorage.getItem("gdf-admin-role") as UserRole | null;
    if (storedToken && storedRole) {
      setAuth({
        mode: "supabase",
        token: storedToken,
        role: storedRole,
        userEmail: sessionStorage.getItem("gdf-admin-email") || undefined,
      });
    }
  }, []);

  async function handleEmailLogin() {
    if (!emailInput || !passwordInput) { setLoginError("Veuillez remplir tous les champs."); return; }
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      sessionStorage.setItem("gdf-admin-token", data.session.access_token);
      sessionStorage.setItem("gdf-admin-role", data.user.role);
      sessionStorage.setItem("gdf-admin-email", data.user.email);
      setAuth({
        mode: "supabase",
        token: data.session.access_token,
        role: data.user.role,
        userEmail: data.user.email,
      });
    } catch (e: any) {
      setLoginError(e.message || "Erreur de connexion");
    } finally {
      setLoginLoading(false);
    }
  }

  function handlePinLogin() {
    if (pinInput.length >= 4) {
      sessionStorage.setItem("gdf-admin-pin", pinInput);
      setAuth({ mode: "pin", pin: pinInput, role: "admin" });
      setLoginError(null);
    } else {
      setLoginError("PIN trop court (min 4 caractères)");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("gdf-admin-pin");
    sessionStorage.removeItem("gdf-admin-token");
    sessionStorage.removeItem("gdf-admin-role");
    sessionStorage.removeItem("gdf-admin-email");
    setAuth(null);
    setTab("orders");
    setEmailInput("");
    setPasswordInput("");
    setPinInput("");
  }

  const authHeaders = useCallback((): Record<string, string> => {
    if (!auth) return {};
    if (auth.mode === "supabase" && auth.token) {
      return { authorization: `Bearer ${auth.token}` };
    }
    return { "x-admin-pin": auth.pin || "" };
  }, [auth]);

  const pin = auth?.pin || "";

  if (!auth) {
    return (
      <div className="adm-page">
        <div className="adm-login">
          <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour — Restaurant" width="120" height="58" />
          <h1>Administration</h1>

          <div className="adm-login-toggle">
            <button
              className={`adm-login-mode ${loginMode === "email" ? "active" : ""}`}
              onClick={() => { setLoginMode("email"); setLoginError(null); }}
            >
              E-mail
            </button>
            <button
              className={`adm-login-mode ${loginMode === "pin" ? "active" : ""}`}
              onClick={() => { setLoginMode("pin"); setLoginError(null); }}
            >
              PIN
            </button>
          </div>

          {loginMode === "email" ? (
            <>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => { setEmailInput(e.target.value); setLoginError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
                placeholder="Adresse e-mail"
                className="adm-input"
                autoFocus
              />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setLoginError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
                placeholder="Mot de passe"
                className="adm-input"
              />
              <button
                onClick={handleEmailLogin}
                className="adm-btn adm-btn-primary"
                disabled={loginLoading}
              >
                {loginLoading ? "Connexion…" : "Se connecter"}
              </button>
            </>
          ) : (
            <>
              <p>Entrez le code PIN pour accéder au back-office.</p>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setLoginError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handlePinLogin()}
                placeholder="Code PIN"
                className="adm-input"
                autoFocus
              />
              <button onClick={handlePinLogin} className="adm-btn adm-btn-primary">Connexion</button>
            </>
          )}

          {loginError && <p className="adm-error">{loginError}</p>}
        </div>
      </div>
    );
  }

  const visibleTabs = getVisibleTabs(auth.role);

  return (
    <div className="adm-page">
      <header className="adm-header">
        <div className="adm-header-left">
          <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour — Restaurant" width="66" height="32" />
          <h1>Back-office</h1>
          {auth.userEmail && <span className="adm-user-email">{auth.userEmail}</span>}
          {auth.role === "staff" && <span className="adm-tag">Staff</span>}
        </div>
        <button className="adm-btn adm-btn-ghost" onClick={handleLogout}>
          Déconnexion
        </button>
      </header>

      <nav className="adm-tabs">
        {visibleTabs.map((t) => (
          <button
            key={t}
            className={`adm-tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </nav>

      <main className="adm-main">
        {tab === "orders" && <OrdersTab pin={pin} authHeaders={authHeaders} />}
        {tab === "menu" && auth.role === "admin" && <MenuTab pin={pin} authHeaders={authHeaders} />}
        {tab === "delivery-menu" && auth.role === "admin" && <DeliveryMenuTab pin={pin} authHeaders={authHeaders} />}
        {tab === "cuissons" && auth.role === "admin" && <CuissonsTab authHeaders={authHeaders} />}
        {tab === "streets" && auth.role === "admin" && <StreetsManager authHeaders={authHeaders} />}
        {tab === "avis" && auth.role === "admin" && <ReviewsTab authHeaders={authHeaders} />}
        {tab === "retours" && auth.role === "admin" && <FeedbackTab authHeaders={authHeaders} />}
        {tab === "contenu" && auth.role === "admin" && <ContentEditor authHeaders={authHeaders} />}
        {tab === "settings" && auth.role === "admin" && <SettingsTab pin={pin} authHeaders={authHeaders} />}
      </main>
    </div>
  );
}

/* ───────────── Orders Tab ───────────── */

function OrdersTab({ pin, authHeaders }: { pin: string; authHeaders: () => Record<string, string> }) {
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
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders);
        setTotal(data.total);
        setStats(data.stats);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [authHeaders, page, statusFilter]);

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
          <div className="adm-stat">
            <span className="adm-stat-value">{formatPrice(stats.todayCash)}</span>
            <span className="adm-stat-label">Espèces</span>
          </div>
          <div className="adm-stat">
            <span className="adm-stat-value">{formatPrice(stats.todayCard)}</span>
            <span className="adm-stat-label">Carte / Bancontact</span>
          </div>
          <div className="adm-stat">
            <span className="adm-stat-value">{formatPrice(stats.todayPaid)}</span>
            <span className="adm-stat-label">Encaissé</span>
          </div>
          <div className="adm-stat">
            <span className="adm-stat-value">{formatPrice(stats.todayUnpaid)}</span>
            <span className="adm-stat-label">À encaisser</span>
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
                      <p><strong>Paiement :</strong> {order.payment_method === "cash" ? "Espèces" : "Carte / Bancontact"} ({order.payment_status === "paid" ? "encaissé" : "à encaisser"})</p>
                      {order.notes && <p><strong>Notes :</strong> {order.notes}</p>}
                    </div>
                    <div>
                      <p className="adm-detail-title">Articles</p>
                      {order.order_items?.map((item, i) => (
                        <p key={i} className="adm-detail-item">
                          {item.quantity}x {item.name}
                          {item.variant_label ? ` (${item.variant_label})` : ""}
                          {item.doneness_label ? ` — ${item.doneness_label}` : ""}
                          <span>{formatPrice(item.total_price)}</span>
                        </p>
                      ))}
                      {order.discount_amount > 0 && (
                        <p className="adm-detail-item adm-detail-discount">
                          Remise livraison <span>−{formatPrice(order.discount_amount)}</span>
                        </p>
                      )}
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

function MenuTab({ pin, authHeaders }: { pin: string; authHeaders: () => Record<string, string> }) {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string | number | boolean>>({});
  const [saving, setSaving] = useState(false);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/menu", { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setCategories(data.categories);
    } catch { /* ignore */ }
    setLoading(false);
  }, [authHeaders]);

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
      headers: { "Content-Type": "application/json", ...authHeaders() },
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
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ table: "categories", id: catId, data: { is_active: active } }),
    });
    fetchMenu();
  }

  async function toggleItem(itemId: string, active: boolean) {
    await fetch("/api/admin/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ table: "menu_items", id: itemId, data: { is_active: active } }),
    });
    fetchMenu();
  }

  async function toggleOutOfStock(itemId: string, outOfStock: boolean) {
    await fetch("/api/admin/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ table: "menu_items", id: itemId, data: { is_out_of_stock: outOfStock } }),
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
                          {(item as any).is_out_of_stock && <span className="adm-tag adm-tag-rupture">En rupture</span>}
                        </div>
                        <div className="adm-item-actions">
                          <button
                            className={`adm-btn adm-btn-sm ${(item as any).is_out_of_stock ? "adm-btn-danger" : "adm-btn-ghost"}`}
                            onClick={() => toggleOutOfStock(item.id, !(item as any).is_out_of_stock)}
                            title={(item as any).is_out_of_stock ? "Remettre en stock" : "Marquer en rupture"}
                          >
                            {(item as any).is_out_of_stock ? "Remettre" : "Rupture"}
                          </button>
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

/* ───────────── Delivery Menu Tab ───────────── */

function DeliveryMenuTab({ pin, authHeaders }: { pin: string; authHeaders: () => Record<string, string> }) {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string | number | null>>({});
  const [saving, setSaving] = useState(false);
  const [dragItem, setDragItem] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/menu", { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setCategories(data.categories);
    } catch { /* ignore */ }
    setLoading(false);
  }, [authHeaders]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  async function toggleDeliverable(itemId: string, deliverable: boolean) {
    await fetch("/api/admin/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ table: "menu_items", id: itemId, data: { is_deliverable: deliverable } }),
    });
    fetchMenu();
  }

  async function toggleDeliveryOnly(itemId: string, deliveryOnly: boolean) {
    await fetch("/api/admin/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ table: "menu_items", id: itemId, data: { is_delivery_only: deliveryOnly } }),
    });
    fetchMenu();
  }

  async function bulkToggleCategory(catId: string, deliverable: boolean) {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    setSaving(true);
    await Promise.all(
      cat.menu_items
        .filter((i) => i.is_active && i.is_orderable)
        .map((item) =>
          fetch("/api/admin/menu", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ table: "menu_items", id: item.id, data: { is_deliverable: deliverable } }),
          })
        )
    );
    setSaving(false);
    fetchMenu();
  }

  function startEdit(item: AdminMenuItem) {
    setEditingItem(item.id);
    setEditData({
      delivery_price: item.delivery_price,
      delivery_description: item.delivery_description || "",
    });
  }

  async function saveEdit(itemId: string) {
    setSaving(true);
    const price = editData.delivery_price !== null && editData.delivery_price !== ""
      ? parseFloat(String(editData.delivery_price))
      : null;
    await fetch("/api/admin/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        table: "menu_items",
        id: itemId,
        data: {
          delivery_price: price,
          delivery_description: editData.delivery_description || null,
        },
      }),
    });
    setEditingItem(null);
    setSaving(false);
    fetchMenu();
  }

  async function handleDrop(catId: string, draggedId: string, targetId: string) {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    const items = cat.menu_items
      .filter((i) => i.is_active)
      .sort((a, b) => (a.delivery_sort_order ?? a.sort_order) - (b.delivery_sort_order ?? b.sort_order));
    const dragIdx = items.findIndex((i) => i.id === draggedId);
    const targetIdx = items.findIndex((i) => i.id === targetId);
    if (dragIdx === -1 || targetIdx === -1 || dragIdx === targetIdx) return;

    const reordered = [...items];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);

    setSaving(true);
    await Promise.all(
      reordered.map((item, i) =>
        fetch("/api/admin/menu", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ table: "menu_items", id: item.id, data: { delivery_sort_order: i } }),
        })
      )
    );
    setSaving(false);
    fetchMenu();
  }

  if (loading) return <div className="adm-loading">Chargement...</div>;

  const allDeliverable = (cat: AdminCategory) =>
    cat.menu_items.filter((i) => i.is_active && i.is_orderable).every((i) => i.is_deliverable);

  return (
    <div>
      <p className="adm-info">
        Activez ou désactivez la livraison pour chaque article. Glissez-déposez pour réordonner la carte livraison.
      </p>
      {saving && <div className="adm-saving-bar">Enregistrement...</div>}
      <div className="adm-menu-list">
        {categories.map((cat) => {
          const orderableItems = cat.menu_items
            .filter((i) => i.is_active)
            .sort((a, b) => (a.delivery_sort_order ?? a.sort_order) - (b.delivery_sort_order ?? b.sort_order));
          if (orderableItems.length === 0) return null;
          return (
            <div key={cat.id} className="adm-menu-cat">
              <div
                className="adm-menu-cat-header"
                onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
              >
                <div className="adm-menu-cat-info">
                  <strong>{cat.label}</strong>
                  <span className="adm-menu-cat-count">
                    {cat.menu_items.filter((i) => i.is_deliverable).length}/{cat.menu_items.filter((i) => i.is_active).length} livrables
                  </span>
                </div>
                <div className="adm-menu-cat-actions">
                  <button
                    className={`adm-toggle ${allDeliverable(cat) ? "on" : ""}`}
                    onClick={(e) => { e.stopPropagation(); bulkToggleCategory(cat.id, !allDeliverable(cat)); }}
                    title={allDeliverable(cat) ? "Tout désactiver livraison" : "Tout activer livraison"}
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
                  {orderableItems.map((item) => (
                    <div
                      key={item.id}
                      className={`adm-menu-item adm-dlv-item ${!item.is_deliverable ? "inactive" : ""}`}
                      draggable
                      onDragStart={() => setDragItem(item.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragItem && dragItem !== item.id) handleDrop(cat.id, dragItem, item.id);
                        setDragItem(null);
                      }}
                      onDragEnd={() => setDragItem(null)}
                    >
                      {editingItem === item.id ? (
                        <div className="adm-edit-form">
                          <label className="adm-field">
                            <span>Prix livraison (vide = prix normal)</span>
                            <input
                              className="adm-input"
                              type="number"
                              step="0.01"
                              value={editData.delivery_price ?? ""}
                              onChange={(e) => setEditData({ ...editData, delivery_price: e.target.value || null })}
                              placeholder={item.price ? String(item.price) : ""}
                            />
                          </label>
                          <label className="adm-field">
                            <span>Description livraison (vide = description normale)</span>
                            <input
                              className="adm-input"
                              value={editData.delivery_description as string}
                              onChange={(e) => setEditData({ ...editData, delivery_description: e.target.value })}
                              placeholder={item.description || ""}
                            />
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
                          <div className="adm-dlv-drag-handle" title="Glisser pour réordonner">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                            </svg>
                          </div>
                          <div className="adm-item-info">
                            <span className="adm-item-name">{item.name}</span>
                            {item.price && <span className="adm-item-price">{formatPrice(item.delivery_price ?? item.price)}</span>}
                            {item.delivery_price && item.delivery_price !== item.price && (
                              <span className="adm-tag">Prix livraison</span>
                            )}
                            {item.delivery_description && (
                              <span className="adm-tag">Desc. livraison</span>
                            )}
                            {item.is_delivery_only && <span className="adm-tag adm-tag-blue">Livraison uniquement</span>}
                          </div>
                          <div className="adm-item-actions">
                            <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => startEdit(item)}>
                              Modifier
                            </button>
                            <label className="adm-checkbox adm-checkbox-sm" title="Livraison uniquement">
                              <input
                                type="checkbox"
                                checked={item.is_delivery_only}
                                onChange={(e) => toggleDeliveryOnly(item.id, e.target.checked)}
                              />
                              <span className="adm-checkbox-label-sm">Exclusif</span>
                            </label>
                            <button
                              className={`adm-toggle ${item.is_deliverable ? "on" : ""}`}
                              onClick={() => toggleDeliverable(item.id, !item.is_deliverable)}
                              title={item.is_deliverable ? "Désactiver livraison" : "Activer livraison"}
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
          );
        })}
      </div>
    </div>
  );
}

/* ───────────── Cuissons Tab ───────────── */

interface CookingGroupAdmin {
  id: string;
  key: string;
  label: string;
  delivery_offset: number;
  sort_order: number;
}

interface CookingLevelAdmin {
  id: string;
  key: string;
  label: string;
  description: string | null;
  temperature: string | null;
  color: string;
  sort_order: number;
}

interface CookingGroupLevelAdmin {
  id: string;
  group_id: string;
  level_id: string;
  is_default: boolean;
  is_recommended: boolean;
  available_delivery: boolean;
}

interface MenuItemCooking {
  id: string;
  name: string;
  cooking_group_id: string | null;
  cooking_required: boolean;
  category_label?: string;
}

function CuissonsTab({ authHeaders }: { authHeaders: () => Record<string, string> }) {
  const [groups, setGroups] = useState<CookingGroupAdmin[]>([]);
  const [levels, setLevels] = useState<CookingLevelAdmin[]>([]);
  const [groupLevels, setGroupLevels] = useState<CookingGroupLevelAdmin[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemCooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [assignMode, setAssignMode] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cooking", { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
        setLevels(data.levels || []);
        setGroupLevels(data.groupLevels || []);
        setMenuItems(data.menuItems || []);
      }
    } catch {}
    setLoading(false);
  }, [authHeaders]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function toggleGroupLevel(groupId: string, levelId: string, field: string, value: boolean) {
    setSaving(true);
    const gl = groupLevels.find((x) => x.group_id === groupId && x.level_id === levelId);
    if (gl) {
      await fetch("/api/admin/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ table: "cooking_group_levels", id: gl.id, data: { [field]: value } }),
      });
    }
    setSaving(false);
    fetchAll();
  }

  async function assignCookingGroup(itemId: string, groupId: string | null) {
    setSaving(true);
    await fetch("/api/admin/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        table: "menu_items",
        id: itemId,
        data: { cooking_group_id: groupId, cooking_required: !!groupId },
      }),
    });
    setSaving(false);
    fetchAll();
  }

  async function updateDeliveryOffset(groupId: string, offset: number) {
    setSaving(true);
    await fetch("/api/admin/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ table: "cooking_groups", id: groupId, data: { delivery_offset: offset } }),
    });
    setSaving(false);
    fetchAll();
  }

  if (loading) return <div className="adm-loading">Chargement des cuissons...</div>;

  return (
    <div>
      <div className="adm-section-header">
        <h2>Gestion des cuissons</h2>
        <button
          className={`adm-btn ${assignMode ? "adm-btn-primary" : "adm-btn-ghost"}`}
          onClick={() => setAssignMode(!assignMode)}
        >
          {assignMode ? "Voir les groupes" : "Assigner aux plats"}
        </button>
      </div>

      {saving && <div className="adm-saving-bar">Enregistrement...</div>}

      {assignMode ? (
        <div className="adm-section">
          <p className="adm-info">
            Choisissez le groupe de cuisson pour chaque viande. Les articles sans groupe n'auront pas de sélection de cuisson.
          </p>
          <div className="adm-cooking-assign-list">
            {menuItems.map((item) => (
              <div key={item.id} className="adm-cooking-assign-row">
                <div className="adm-cooking-assign-info">
                  <span className="adm-item-name">{item.name}</span>
                  {item.category_label && <small>{item.category_label}</small>}
                </div>
                <select
                  className="adm-select adm-select-sm"
                  value={item.cooking_group_id || ""}
                  onChange={(e) => assignCookingGroup(item.id, e.target.value || null)}
                >
                  <option value="">Aucune cuisson</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="adm-menu-list">
          {groups.sort((a, b) => a.sort_order - b.sort_order).map((group) => {
            const gls = groupLevels
              .filter((gl) => gl.group_id === group.id)
              .map((gl) => {
                const level = levels.find((l) => l.id === gl.level_id);
                return level ? { ...gl, level } : null;
              })
              .filter(Boolean)
              .sort((a: any, b: any) => a.level.sort_order - b.level.sort_order) as (CookingGroupLevelAdmin & { level: CookingLevelAdmin })[];

            const assignedItems = menuItems.filter((i) => i.cooking_group_id === group.id);

            return (
              <div key={group.id} className="adm-menu-cat">
                <div
                  className="adm-menu-cat-header"
                  onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                >
                  <div className="adm-menu-cat-info">
                    <strong>{group.label}</strong>
                    <span className="adm-menu-cat-count">
                      {gls.length} niveaux · {assignedItems.length} plat{assignedItems.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="adm-menu-cat-actions">
                    <span className="adm-tag">Offset: -{group.delivery_offset}</span>
                    <svg viewBox="0 0 24 24" width="16" height="16" className={`adm-chevron ${expandedGroup === group.id ? "open" : ""}`}>
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </div>
                </div>

                {expandedGroup === group.id && (
                  <div className="adm-menu-items">
                    <div className="adm-cooking-offset-row">
                      <label className="adm-field">
                        <span>Offset livraison (crans en dessous)</span>
                        <select
                          className="adm-select adm-select-sm"
                          value={group.delivery_offset}
                          onChange={(e) => updateDeliveryOffset(group.id, parseInt(e.target.value))}
                        >
                          <option value="0">0 (pas de décalage)</option>
                          <option value="1">1 cran</option>
                          <option value="2">2 crans</option>
                        </select>
                      </label>
                    </div>

                    {gls.map(({ level, ...gl }) => (
                      <div key={gl.id} className="adm-cooking-level-row">
                        <span className="adm-cooking-dot" style={{ background: level.color }} />
                        <div className="adm-cooking-level-info">
                          <strong>{level.label}</strong>
                          <small>{level.temperature}</small>
                        </div>
                        <label className="adm-checkbox adm-checkbox-sm">
                          <input
                            type="checkbox"
                            checked={gl.is_default}
                            onChange={(e) => toggleGroupLevel(group.id, level.id, "is_default", e.target.checked)}
                          />
                          <span className="adm-checkbox-label-sm">Défaut</span>
                        </label>
                        <label className="adm-checkbox adm-checkbox-sm">
                          <input
                            type="checkbox"
                            checked={gl.is_recommended}
                            onChange={(e) => toggleGroupLevel(group.id, level.id, "is_recommended", e.target.checked)}
                          />
                          <span className="adm-checkbox-label-sm">Recommandé</span>
                        </label>
                        <label className="adm-checkbox adm-checkbox-sm">
                          <input
                            type="checkbox"
                            checked={gl.available_delivery}
                            onChange={(e) => toggleGroupLevel(group.id, level.id, "available_delivery", e.target.checked)}
                          />
                          <span className="adm-checkbox-label-sm">Livraison</span>
                        </label>
                      </div>
                    ))}

                    {assignedItems.length > 0 && (
                      <div className="adm-cooking-assigned">
                        <p className="adm-detail-title">Plats associés</p>
                        {assignedItems.map((item) => (
                          <span key={item.id} className="adm-tag">{item.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────────── Reviews Tab ───────────── */

interface ReviewConfig {
  id: string;
  average_rating: number;
  total_count: number;
  google_maps_url: string;
}

interface Review {
  id: string;
  author_name: string;
  rating: number;
  review_date: string;
  review_text: string;
  sort_order: number;
  is_active: boolean;
}

function ReviewsTab({ authHeaders }: { authHeaders: () => Record<string, string> }) {
  const [config, setConfig] = useState<ReviewConfig | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ author_name: "", rating: 5, review_date: "", review_text: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reviews", { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setConfig(data.config);
        setReviews(data.reviews || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ config }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function addReview() {
    if (!form.author_name || !form.review_date) return;
    await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ ...form, sort_order: reviews.length }),
    });
    setForm({ author_name: "", rating: 5, review_date: "", review_text: "" });
    setShowForm(false);
    load();
  }

  async function toggleActive(review: Review) {
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ review: { id: review.id, is_active: !review.is_active } }),
    });
    load();
  }

  async function deleteReview(id: string) {
    if (!confirm("Supprimer cet avis ?")) return;
    await fetch("/api/admin/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ id }),
    });
    load();
  }

  if (loading) return <div className="adm-loading">Chargement...</div>;

  return (
    <div>
      <section className="adm-section">
        <h2>Configuration avis Google</h2>
        {config && (
          <div className="adm-form-grid">
            <label className="adm-field">
              <span>Note moyenne</span>
              <input
                type="number" className="adm-input" step="0.1" min="1" max="5"
                value={config.average_rating}
                onChange={(e) => setConfig({ ...config, average_rating: Number(e.target.value) })}
              />
            </label>
            <label className="adm-field">
              <span>Nombre total d&apos;avis</span>
              <input
                type="number" className="adm-input" min="0"
                value={config.total_count}
                onChange={(e) => setConfig({ ...config, total_count: Number(e.target.value) })}
              />
            </label>
            <label className="adm-field adm-field-wide">
              <span>Lien fiche Google Maps</span>
              <input
                className="adm-input"
                value={config.google_maps_url}
                onChange={(e) => setConfig({ ...config, google_maps_url: e.target.value })}
              />
            </label>
          </div>
        )}
        <div className="adm-actions" style={{ marginTop: "1rem" }}>
          <button className="adm-btn adm-btn-primary" onClick={saveConfig} disabled={saving}>
            {saving ? "Enregistrement..." : saved ? "Enregistré !" : "Enregistrer la config"}
          </button>
        </div>
      </section>

      <section className="adm-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>Avis ({reviews.length})</h2>
          <button className="adm-btn adm-btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Annuler" : "+ Ajouter un avis"}
          </button>
        </div>

        {showForm && (
          <div className="adm-form-grid" style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--adm-bg-alt, #f9f9f9)", borderRadius: "8px" }}>
            <label className="adm-field">
              <span>Nom de l&apos;auteur *</span>
              <input
                className="adm-input"
                value={form.author_name}
                onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                placeholder="Jean Dupont"
              />
            </label>
            <label className="adm-field">
              <span>Note (1-5) *</span>
              <select
                className="adm-input"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              >
                <option value={5}>5 étoiles</option>
                <option value={4}>4 étoiles</option>
                <option value={3}>3 étoiles</option>
                <option value={2}>2 étoiles</option>
                <option value={1}>1 étoile</option>
              </select>
            </label>
            <label className="adm-field">
              <span>Date *</span>
              <input
                className="adm-input"
                value={form.review_date}
                onChange={(e) => setForm({ ...form, review_date: e.target.value })}
                placeholder="Il y a 2 semaines"
              />
            </label>
            <label className="adm-field adm-field-wide">
              <span>Texte de l&apos;avis</span>
              <textarea
                className="adm-input"
                rows={3}
                value={form.review_text}
                onChange={(e) => setForm({ ...form, review_text: e.target.value })}
                placeholder="Copiez le texte de l'avis Google ici..."
              />
            </label>
            <div className="adm-actions">
              <button className="adm-btn adm-btn-primary" onClick={addReview} disabled={!form.author_name || !form.review_date}>
                Ajouter
              </button>
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <p style={{ color: "#999" }}>Aucun avis ajouté. Cliquez sur &quot;+ Ajouter un avis&quot; pour copier un avis depuis votre fiche Google.</p>
        ) : (
          <div className="adm-reviews-list">
            {reviews.map((r) => (
              <div key={r.id} className="adm-review-card" style={{ opacity: r.is_active ? 1 : 0.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div>
                    <strong>{r.author_name}</strong>
                    <span style={{ marginLeft: "0.5rem", color: "#F59E0B" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    <span style={{ marginLeft: "0.5rem", color: "#999", fontSize: "0.85rem" }}>{r.review_date}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <button className="adm-btn" onClick={() => toggleActive(r)} title={r.is_active ? "Masquer" : "Afficher"}>
                      {r.is_active ? "Masquer" : "Afficher"}
                    </button>
                    <button className="adm-btn" onClick={() => deleteReview(r.id)} style={{ color: "#ef4444" }}>
                      Supprimer
                    </button>
                  </div>
                </div>
                {r.review_text && <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem", color: "#555" }}>{r.review_text}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ───────────── Feedback Tab ───────────── */

interface FeedbackEntry {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivered_at: string | null;
}

function FeedbackTab({ authHeaders }: { authHeaders: () => Record<string, string> }) {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/feedback", { headers: authHeaders() });
        const data = await res.json();
        if (res.ok) setFeedback(data.feedback || []);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [authHeaders]);

  if (loading) return <div className="adm-loading">Chargement...</div>;

  const avgRating = feedback.length > 0
    ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
    : "—";

  return (
    <div>
      <section className="adm-section">
        <h2>Retours clients</h2>

        {feedback.length > 0 && (
          <div className="adm-feedback-avg">
            <div className="adm-feedback-avg-item">
              <div className="adm-feedback-avg-value">{avgRating}</div>
              <div className="adm-feedback-avg-label">Note moyenne</div>
            </div>
            <div className="adm-feedback-avg-item">
              <div className="adm-feedback-avg-value">{feedback.length}</div>
              <div className="adm-feedback-avg-label">Retours reçus</div>
            </div>
          </div>
        )}

        {feedback.length === 0 ? (
          <p className="adm-feedback-empty">Aucun retour client pour le moment.</p>
        ) : (
          <div className="adm-feedback-list">
            {feedback.map((f) => (
              <div key={f.id} className="adm-feedback-card">
                <div className="adm-feedback-header">
                  <div>
                    <span className="adm-feedback-stars">
                      {"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}
                    </span>
                    <strong style={{ marginLeft: "0.5rem" }}>{f.customer_name}</strong>
                  </div>
                  <span className="adm-feedback-meta">{formatDate(f.created_at)}</span>
                </div>
                {f.comment && <p className="adm-feedback-comment">{f.comment}</p>}
                <p className="adm-feedback-order">
                  Commande {f.order_number}
                  {f.delivered_at && ` · livrée le ${formatDate(f.delivered_at)}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ───────────── Settings Tab ───────────── */

function SettingsTab({ pin, authHeaders }: { pin: string; authHeaders: () => Record<string, string> }) {
  const [delivery, setDelivery] = useState<DeliveryConfig | null>(null);
  const [hours, setHours] = useState<OpeningHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings", { headers: authHeaders() });
        const data = await res.json();
        if (res.ok) {
          setDelivery(data.delivery);
          setHours(data.hours);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [authHeaders]);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ delivery, hours }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="adm-loading">Chargement...</div>;

  return (
    <div>
      {delivery && (<>
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
              <span>Délai livraison min (minutes)</span>
              <input
                type="number" className="adm-input" min="5" max="120" step="5"
                value={delivery.delivery_min_time}
                onChange={(e) => setDelivery({ ...delivery, delivery_min_time: Number(e.target.value) })}
              />
            </label>
            <label className="adm-field">
              <span>Délai livraison max (minutes)</span>
              <input
                type="number" className="adm-input" min="10" max="180" step="5"
                value={delivery.delivery_max_time}
                onChange={(e) => setDelivery({ ...delivery, delivery_max_time: Number(e.target.value) })}
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

        <section className="adm-section">
          <h2>Remise livraison</h2>
          <div className="adm-form-grid">
            <label className="adm-field">
              <span>Remise activée</span>
              <button
                className={`adm-toggle ${delivery.discount_active ? "on" : ""}`}
                onClick={() => setDelivery({ ...delivery, discount_active: !delivery.discount_active })}
              >
                <span className="adm-toggle-dot" />
              </button>
            </label>
            <label className="adm-field">
              <span>Pourcentage (%)</span>
              <input
                type="number" className="adm-input" step="0.5" min="0" max="100"
                value={delivery.discount_percentage}
                onChange={(e) => setDelivery({ ...delivery, discount_percentage: parseFloat(e.target.value) || 0 })}
              />
            </label>
          </div>
          <p className="adm-info">
            La remise s'applique à tous les plats commandés en livraison (hors boissons et desserts).
            Chaque prix est arrondi au 0,05 € le plus proche.
          </p>
        </section>

        <section className="adm-section">
          <h2>E-mail de retour client</h2>
          <div className="adm-form-grid">
            <label className="adm-field">
              <span>Délai avant envoi (heures)</span>
              <input
                type="number" className="adm-input" min="1" max="48" step="1"
                value={delivery.feedback_delay_hours}
                onChange={(e) => setDelivery({ ...delivery, feedback_delay_hours: Number(e.target.value) || 2 })}
              />
            </label>
          </div>
          <p className="adm-info">
            L'e-mail de demande de retour est envoyé ce nombre d'heures après le passage au statut « Livrée ».
          </p>
        </section>
      </>)}

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
