"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CartProvider, useCart } from "./CartProvider";
import CartDrawer from "./CartDrawer";
import type {
  CategoryWithItems,
  DeliveryConfig,
  MenuItemWithRelations,
  ItemVariant,
  ItemSupplement,
} from "@/types/database";

function formatPrice(price: number): string {
  return price.toFixed(2).replace(".", ",").replace(",00", "") + " €";
}

// ── Status banner (open/closed) ──────────────────────────────
function StatusBanner({ config }: { config: DeliveryConfig }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const day = now.getDay();
      const hhmm = now.getHours() * 100 + now.getMinutes();
      const closed = day === 3 || day === 4;
      const inService =
        (hhmm >= 1145 && hhmm <= 1500) || (hhmm >= 1845 && hhmm <= 2200);
      setIsOpen(!closed && inService);
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`cmd-status-banner ${isOpen ? "is-open" : "is-closed"}`}>
      <span className="cmd-status-dot" />
      {isOpen
        ? `Ouvert — livraison en ${config.estimated_time}`
        : "Fermé — précommandez pour ce soir"}
    </div>
  );
}

// ── Delivery banner ──────────────────────────────────────────
function DeliveryBanner({ config }: { config: DeliveryConfig }) {
  const { state, setMode } = useCart();
  return (
    <div className="cmd-delivery-banner">
      <div className="cmd-mode-toggle">
        <button
          type="button"
          className={`cmd-mode-btn ${state.mode === "delivery" ? "active" : ""}`}
          onClick={() => setMode("delivery")}
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1.5-9H17V12h4.46L19.5 9.5zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM20 8l3 4v5h-2a3 3 0 0 1-6 0H9a3 3 0 0 1-6 0H1V6c0-1.1.9-2 2-2h14v4h3z" />
          </svg>
          Livraison
        </button>
        <button
          type="button"
          className={`cmd-mode-btn ${state.mode === "pickup" ? "active" : ""}`}
          onClick={() => setMode("pickup")}
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
          À emporter
        </button>
      </div>
      <div className="cmd-delivery-details">
        {state.mode === "delivery" ? (
          <>
            <div className="cmd-delivery-detail-row">
              <span className="cmd-detail-label">Zone</span>
              <span>{config.zone_description}</span>
            </div>
            <div className="cmd-delivery-detail-row">
              <span className="cmd-detail-label">Frais</span>
              <span>{formatPrice(config.fee)} · Gratuite dès {formatPrice(config.free_from)}</span>
            </div>
            <div className="cmd-delivery-detail-row">
              <span className="cmd-detail-label">Minimum</span>
              <span>{formatPrice(config.min_order)}</span>
            </div>
            <div className="cmd-delivery-detail-row">
              <span className="cmd-detail-label">Délai</span>
              <span>~{config.estimated_time}</span>
            </div>
          </>
        ) : (
          <>
            <div className="cmd-delivery-detail-row">
              <span className="cmd-detail-label">Mode</span>
              <span>À emporter — Gratuit</span>
            </div>
            <div className="cmd-delivery-detail-row">
              <span className="cmd-detail-label">Prêt en</span>
              <span>~{config.pickup_time}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Item customization modal ─────────────────────────────────
function ItemModal({
  item,
  onClose,
}: {
  item: MenuItemWithRelations;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const hasVariants = item.variants.length > 0;
  const hasSupplements = item.supplements.length > 0;
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(
    hasVariants ? item.variants[0] : null
  );
  const [selectedSupplements, setSelectedSupplements] = useState<ItemSupplement[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  const toggleSupplement = (sup: ItemSupplement) => {
    setSelectedSupplements((prev) =>
      prev.find((s) => s.id === sup.id)
        ? prev.filter((s) => s.id !== sup.id)
        : [...prev, sup]
    );
  };

  const basePrice = selectedVariant ? selectedVariant.price : item.price!;
  const totalSupplements = selectedSupplements.reduce((s, sup) => s + sup.price, 0);
  const displayPrice = basePrice + totalSupplements;

  const handleAdd = () => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      variantId: selectedVariant?.id,
      variantLabel: selectedVariant?.label,
      basePrice,
      supplements: selectedSupplements.map((s) => ({
        id: s.id,
        label: s.label,
        price: s.price,
      })),
    });
    onClose();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="cmd-modal-overlay" onClick={onClose}>
      <div
        className="cmd-modal"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Personnaliser ${item.name}`}
      >
        <button
          className="cmd-modal-close"
          onClick={onClose}
          type="button"
          aria-label="Fermer"
        >
          &times;
        </button>
        <h3 className="cmd-modal-title">{item.name}</h3>
        {item.description && (
          <p className="cmd-modal-desc">{item.description}</p>
        )}

        {hasVariants && (
          <div className="cmd-modal-section">
            <h4>Choisir une option</h4>
            <div className="cmd-variant-list">
              {item.variants.map((v) => (
                <label
                  key={v.id}
                  className={`cmd-variant-option ${selectedVariant?.id === v.id ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="variant"
                    checked={selectedVariant?.id === v.id}
                    onChange={() => setSelectedVariant(v)}
                  />
                  <span className="cmd-variant-label">{v.label}</span>
                  <span className="cmd-variant-price">{formatPrice(v.price)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {hasSupplements && (
          <div className="cmd-modal-section">
            <h4>Suppléments</h4>
            <div className="cmd-supplement-list">
              {item.supplements.map((s) => (
                <label
                  key={s.id}
                  className={`cmd-supplement-option ${selectedSupplements.find((x) => x.id === s.id) ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={!!selectedSupplements.find((x) => x.id === s.id)}
                    onChange={() => toggleSupplement(s)}
                  />
                  <span className="cmd-supplement-label">{s.label}</span>
                  <span className="cmd-supplement-price">+{formatPrice(s.price)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button type="button" className="cmd-btn cmd-btn-primary cmd-btn-full" onClick={handleAdd}>
          Ajouter — {formatPrice(displayPrice)}
        </button>
      </div>
    </div>
  );
}

// ── Menu item card ───────────────────────────────────────────
function MenuItemCard({
  item,
  onCustomize,
}: {
  item: MenuItemWithRelations;
  onCustomize: (item: MenuItemWithRelations) => void;
}) {
  const { addItem } = useCart();
  const hasVariants = item.variants.length > 0;
  const hasSupplements = item.supplements.length > 0;
  const needsModal = hasVariants || hasSupplements;

  const handleAdd = () => {
    if (needsModal) {
      onCustomize(item);
      return;
    }
    addItem({
      menuItemId: item.id,
      name: item.name,
      basePrice: item.price!,
      supplements: [],
    });
  };

  const displayPrice = hasVariants
    ? `Dès ${formatPrice(Math.min(...item.variants.map((v) => v.price)))}`
    : item.price !== null
      ? formatPrice(item.price)
      : item.price_label || "Prix sur demande";

  return (
    <div className={`cmd-item-card ${!item.is_orderable ? "cmd-item-display" : ""}`}>
      <div className="cmd-item-info">
        <div className="cmd-item-header">
          <span className="cmd-item-name">{item.name}</span>
          {item.weight && <span className="cmd-item-badge">{item.weight}</span>}
          {item.volume && <span className="cmd-item-badge">{item.volume}</span>}
        </div>
        {item.description && (
          <p className="cmd-item-desc">{item.description}</p>
        )}
      </div>
      <div className="cmd-item-right">
        <span className="cmd-item-price">{displayPrice}</span>
        {item.is_orderable && (
          <button
            type="button"
            className="cmd-add-btn"
            onClick={handleAdd}
            aria-label={`Ajouter ${item.name}`}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Category tabs ────────────────────────────────────────────
function CategoryTabs({
  categories,
  activeSlug,
  onSelect,
}: {
  categories: CategoryWithItems[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const active = tabsRef.current?.querySelector(".active");
    if (active) {
      active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeSlug]);

  return (
    <div className="cmd-tabs" ref={tabsRef} role="tablist">
      {categories.map((cat) => (
        <button
          key={cat.slug}
          type="button"
          role="tab"
          className={`cmd-tab ${activeSlug === cat.slug ? "active" : ""}`}
          aria-selected={activeSlug === cat.slug}
          onClick={() => onSelect(cat.slug)}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

// ── Cart bottom bar (mobile) / FAB (desktop) ────────────────
function CartBar() {
  const { toggleCart, itemCount, subtotal } = useCart();
  if (itemCount === 0) return null;
  return (
    <div className="cmd-cart-bar">
      <button type="button" className="cmd-cart-bar-inner" onClick={toggleCart}>
        <div className="cmd-cart-bar-left">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.6L5.2 14c-.1.3-.2.6-.2 1 0 1.1.9 2 2 2h12v-2H7.4c-.1 0-.2-.1-.2-.2v-.1l.9-1.6h7.4c.8 0 1.4-.4 1.7-1l3.6-6.5c.2-.3 0-.6-.3-.6H5.2L4.3 2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
          <span className="cmd-cart-bar-count">{itemCount} article{itemCount > 1 ? "s" : ""}</span>
        </div>
        <div className="cmd-cart-bar-right">
          <span className="cmd-cart-bar-total">{formatPrice(subtotal)}</span>
          <span className="cmd-cart-bar-label">Commander</span>
        </div>
      </button>
    </div>
  );
}

// ── Main order page content ──────────────────────────────────
function OrderContent({
  categories,
  deliveryConfig,
}: {
  categories: CategoryWithItems[];
  deliveryConfig: DeliveryConfig;
}) {
  const orderableCategories = categories.filter(
    (c) => c.menu_items.some((i) => i.is_orderable)
  );

  const [activeSlug, setActiveSlug] = useState(
    orderableCategories[0]?.slug || ""
  );
  const [modalItem, setModalItem] = useState<MenuItemWithRelations | null>(null);

  const activeCategory = orderableCategories.find((c) => c.slug === activeSlug);

  return (
    <>
      <header className="cmd-header">
        <a href="/" className="cmd-back">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z" />
          </svg>
          Retour au site
        </a>
        <div className="cmd-logo">
          <img src="/logo-grill-du-four.webp" alt="Le Grill du Four" width="36" height="36" />
          <span>Commander &amp; Livraison</span>
        </div>
      </header>

      <StatusBanner config={deliveryConfig} />

      <DeliveryBanner config={deliveryConfig} />

      <div className="cmd-crosslink">
        Vous consultez la carte livraison.{" "}
        <a href="/carte">Voir la carte complète du restaurant &rarr;</a>
      </div>

      <CategoryTabs
        categories={orderableCategories}
        activeSlug={activeSlug}
        onSelect={setActiveSlug}
      />

      <section className="cmd-menu-section">
        {activeCategory && (
          <>
            {activeCategory.intro && (
              <p className="cmd-category-intro">{activeCategory.intro}</p>
            )}
            <div className="cmd-items-list">
              {activeCategory.menu_items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onCustomize={setModalItem}
                />
              ))}
            </div>
            {activeCategory.note && (
              <p className="cmd-category-note">{activeCategory.note}</p>
            )}
          </>
        )}
      </section>

      <CartBar />

      <CartDrawer
        deliveryFee={deliveryConfig.fee}
        freeFrom={deliveryConfig.free_from}
        minOrder={deliveryConfig.min_order}
      />

      {modalItem && (
        <ItemModal item={modalItem} onClose={() => setModalItem(null)} />
      )}
    </>
  );
}

// ── Exported wrapper with CartProvider ───────────────────────
export default function OrderPage({
  categories,
  deliveryConfig,
}: {
  categories: CategoryWithItems[];
  deliveryConfig: DeliveryConfig;
}) {
  return (
    <CartProvider>
      <div className="cmd-page">
        <OrderContent categories={categories} deliveryConfig={deliveryConfig} />
      </div>
    </CartProvider>
  );
}
