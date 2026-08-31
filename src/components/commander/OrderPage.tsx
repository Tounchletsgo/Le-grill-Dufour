"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CartProvider, useCart, type ModeConflict } from "./CartProvider";
import CartDrawer from "./CartDrawer";
import type {
  CategoryWithItems,
  DeliveryConfig,
  MenuItemWithRelations,
  ItemVariant,
  ItemSupplement,
} from "@/types/database";
import CookingSelector from "./CookingSelector";
import { getGroupLevels, isLockedGroup, cookingGroups } from "@/data/cookingData";
import { getVisibleGroups, type OptionGroup } from "@/data/optionGroups";
import type { CartOptionSelection, CartOptionChoice } from "./cart-logic";

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

// ── Mode conflict dialog ────────────────────────────────────
function ModeConflictDialog({
  conflict,
  onRemoveAndSwitch,
  onCancel,
}: {
  conflict: ModeConflict;
  onRemoveAndSwitch: () => void;
  onCancel: () => void;
}) {
  const isToDelivery = conflict.mode === "delivery";
  return (
    <div className="cmd-modal-overlay" onClick={onCancel}>
      <div className="cmd-modal cmd-conflict-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="cmd-modal-title">
          {isToDelivery ? "Articles non livrables" : "Articles livraison uniquement"}
        </h3>
        <p className="cmd-conflict-desc">
          {isToDelivery
            ? "Certains articles de votre panier ne sont pas disponibles en livraison :"
            : "Certains articles de votre panier sont disponibles uniquement en livraison :"}
        </p>
        <ul className="cmd-conflict-list">
          {conflict.conflictItems.map((item) => (
            <li key={item.id}>{item.name}{item.variantLabel ? ` — ${item.variantLabel}` : ""}</li>
          ))}
        </ul>
        <div className="cmd-conflict-actions">
          <button
            type="button"
            className="cmd-btn cmd-btn-primary"
            onClick={onRemoveAndSwitch}
          >
            Retirer et basculer en {isToDelivery ? "livraison" : "retrait"}
          </button>
          <button
            type="button"
            className="cmd-btn cmd-btn-ghost"
            onClick={onCancel}
          >
            Rester en {isToDelivery ? "retrait" : "livraison"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delivery banner ──────────────────────────────────────────
function DeliveryBanner({
  config,
  onModeConflict,
}: {
  config: DeliveryConfig;
  onModeConflict: (conflict: ModeConflict) => void;
}) {
  const { state, setMode, checkModeConflict } = useCart();

  const handleModeChange = (newMode: "delivery" | "pickup") => {
    if (newMode === state.mode) return;
    const conflict = checkModeConflict(newMode);
    if (conflict) {
      onModeConflict(conflict);
    } else {
      setMode(newMode);
    }
  };

  return (
    <div className="cmd-delivery-banner">
      <div className="cmd-mode-toggle">
        <button
          type="button"
          className={`cmd-mode-btn ${state.mode === "delivery" ? "active" : ""}`}
          onClick={() => handleModeChange("delivery")}
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1.5-9H17V12h4.46L19.5 9.5zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM20 8l3 4v5h-2a3 3 0 0 1-6 0H9a3 3 0 0 1-6 0H1V6c0-1.1.9-2 2-2h14v4h3z" />
          </svg>
          Livraison
        </button>
        <button
          type="button"
          className={`cmd-mode-btn ${state.mode === "pickup" ? "active" : ""}`}
          onClick={() => handleModeChange("pickup")}
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
              <span>{formatPrice(config.fee)}</span>
            </div>
            <div className="cmd-delivery-detail-row">
              <span className="cmd-detail-label">Minimum</span>
              <span>{formatPrice(config.min_order)}</span>
            </div>
            <div className="cmd-delivery-detail-row">
              <span className="cmd-detail-label">Délai</span>
              <span>~{config.estimated_time}</span>
            </div>
            {config.discount_active && config.discount_percentage > 0 && (
              <div className="cmd-delivery-detail-row cmd-discount-row">
                <span className="cmd-detail-label">Remise</span>
                <span>-{config.discount_percentage.toString().replace(".", ",")}% sur les plats en livraison</span>
              </div>
            )}
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

// ── Option group selector ────────────────────────────────────
function OptionGroupSection({
  group,
  selections,
  onChange,
}: {
  group: OptionGroup;
  selections: CartOptionChoice[];
  onChange: (choices: CartOptionChoice[]) => void;
}) {
  if (group.type === "single") {
    return (
      <div className="cmd-modal-section">
        <h4>
          {group.label}
          {group.required && <span className="cmd-required"> *</span>}
        </h4>
        {group.subtitle && <p className="cmd-group-subtitle">{group.subtitle}</p>}
        <div className="cmd-option-list">
          {group.options.map((opt) => {
            const isSelected = selections.some((s) => s.key === opt.key);
            return (
              <label
                key={opt.key}
                className={`cmd-variant-option ${isSelected ? "selected" : ""} ${opt.is_decline ? "cmd-option-decline" : ""}`}
              >
                <input
                  type="radio"
                  name={`og-${group.key}`}
                  checked={isSelected}
                  onChange={() =>
                    onChange([{ key: opt.key, label: opt.label, price: opt.price, quantity: 1 }])
                  }
                />
                <span className="cmd-variant-label">{opt.label}</span>
                {opt.price > 0 && (
                  <span className="cmd-variant-price">+{formatPrice(opt.price)}</span>
                )}
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="cmd-modal-section">
      <h4>{group.label}</h4>
      {group.subtitle && <p className="cmd-group-subtitle">{group.subtitle}</p>}
      <div className="cmd-option-list">
        {group.options.map((opt) => {
          const sel = selections.find((s) => s.key === opt.key);
          const isSelected = !!sel;
          return (
            <div
              key={opt.key}
              className={`cmd-supplement-option ${isSelected ? "selected" : ""}`}
            >
              <label className="cmd-supplement-row">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    if (isSelected) {
                      onChange(selections.filter((s) => s.key !== opt.key));
                    } else {
                      onChange([...selections, { key: opt.key, label: opt.label, price: opt.price, quantity: 1 }]);
                    }
                  }}
                />
                <span className="cmd-supplement-label">{opt.label}</span>
                <span className="cmd-supplement-price">+{formatPrice(opt.price)}</span>
              </label>
              {group.allow_quantity && isSelected && (
                <div className="cmd-qty-control" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="cmd-qty-btn"
                    onClick={() => {
                      const q = (sel?.quantity || 1) - 1;
                      if (q <= 0) onChange(selections.filter((s) => s.key !== opt.key));
                      else onChange(selections.map((s) => s.key === opt.key ? { ...s, quantity: q } : s));
                    }}
                    aria-label="Moins"
                  >
                    &minus;
                  </button>
                  <span className="cmd-qty-value">{sel?.quantity || 1}</span>
                  <button
                    type="button"
                    className="cmd-qty-btn"
                    onClick={() =>
                      onChange(selections.map((s) => s.key === opt.key ? { ...s, quantity: (s.quantity || 1) + 1 } : s))
                    }
                    aria-label="Plus"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Item customization modal ─────────────────────────────────
function ItemModal({
  item,
  categorySlug,
  onClose,
}: {
  item: MenuItemWithRelations;
  categorySlug: string;
  onClose: () => void;
}) {
  const { addItem, state } = useCart();
  const isDelivery = state.mode === "delivery";
  const effectivePrice = isDelivery && item.delivery_price != null
    ? item.delivery_price
    : item.price;

  const hasVariants = item.variants.length > 0;
  const itemOptionGroupKeys: string[] = (item as any).option_groups || [];
  const hasOptionGroups = itemOptionGroupKeys.length > 0;
  const hasOldSupplements = item.supplements.length > 0 && !hasOptionGroups;

  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(
    hasVariants ? item.variants[0] : null
  );
  const [selectedSupplements, setSelectedSupplements] = useState<ItemSupplement[]>([]);
  const [optionSelections, setOptionSelections] = useState<Record<string, CartOptionChoice[]>>(() => {
    const init: Record<string, CartOptionChoice[]> = {};
    if (itemOptionGroupKeys.includes("entree_en_plat")) {
      const grp = getVisibleGroups(["entree_en_plat"], false)[0];
      if (grp) {
        const first = grp.options[0];
        init["entree_en_plat"] = [{ key: first.key, label: first.label, price: first.price, quantity: 1 }];
      }
    }
    return init;
  });
  const [itemNote, setItemNote] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  const cookingGroup = item.cooking_group;
  const hasCooking = !!cookingGroup;
  const cookingGroupKey = cookingGroup?.key || "";
  const cookingGroupLabel = cookingGroup?.label || "";
  const groupLevels = hasCooking ? getGroupLevels(cookingGroupKey) : [];
  const defaultLevel = groupLevels.find((l) => l.is_default) || groupLevels[0];
  const [selectedDoneness, setSelectedDoneness] = useState<{ key: string; label: string }>(
    defaultLevel ? { key: defaultLevel.key, label: defaultLevel.label } : { key: "", label: "" }
  );

  const showAccompagnements = (() => {
    if (!itemOptionGroupKeys.includes("accompagnement_feculent")) return true;
    if (itemOptionGroupKeys.includes("entree_en_plat")) {
      const fmt = optionSelections["entree_en_plat"];
      return fmt?.some((c) => c.key === "version_plat") ?? false;
    }
    if (hasVariants && selectedVariant) {
      return /plat/i.test(selectedVariant.label);
    }
    return true;
  })();

  useEffect(() => {
    if (!showAccompagnements) {
      setOptionSelections((prev) => {
        const next = { ...prev };
        delete next["accompagnement_feculent"];
        delete next["accompagnement_legumes"];
        return next;
      });
    }
  }, [showAccompagnements]);

  const visibleGroups = (() => {
    let groups = getVisibleGroups(itemOptionGroupKeys, isDelivery);
    if (!showAccompagnements) {
      groups = groups.filter(
        (g) => g.key !== "accompagnement_feculent" && g.key !== "accompagnement_legumes"
      );
    }
    return groups;
  })();

  const toggleSupplement = (sup: ItemSupplement) => {
    setSelectedSupplements((prev) =>
      prev.find((s) => s.id === sup.id)
        ? prev.filter((s) => s.id !== sup.id)
        : [...prev, sup]
    );
  };

  const basePrice = selectedVariant ? selectedVariant.price : effectivePrice!;
  const oldSupTotal = selectedSupplements.reduce((s, sup) => s + sup.price, 0);
  const optTotal = Object.values(optionSelections).reduce(
    (s, choices) => s + choices.reduce((cs, c) => cs + c.price * c.quantity, 0),
    0
  );
  const displayPrice = basePrice + oldSupTotal + optTotal;

  const missingRequired = visibleGroups.filter((g) => {
    if (!g.required) return false;
    const sel = optionSelections[g.key];
    return !sel || sel.length === 0;
  });
  const canAdd = missingRequired.length === 0;

  const handleAdd = () => {
    if (!canAdd) return;
    const finalSelections: CartOptionSelection[] = Object.entries(optionSelections)
      .filter(([, choices]) => choices.length > 0)
      .map(([groupKey, choices]) => {
        const grp = visibleGroups.find((g) => g.key === groupKey);
        return {
          groupKey,
          groupLabel: grp?.label || groupKey,
          choices,
        };
      });

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
      optionSelections: finalSelections,
      itemNote: itemNote.trim() || undefined,
      isDeliverable: item.is_deliverable,
      isDeliveryOnly: item.is_delivery_only,
      donenessKey: hasCooking ? selectedDoneness.key : undefined,
      donenessLabel: hasCooking ? selectedDoneness.label : undefined,
      cookingGroupKey: hasCooking ? cookingGroupKey : undefined,
      categorySlug,
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
        className="cmd-modal cmd-modal-options"
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
        <div className="cmd-modal-scroll">
          <h3 className="cmd-modal-title">{item.name}</h3>
          {(isDelivery && item.delivery_description
            ? item.delivery_description
            : item.description
          ) && (
            <p className="cmd-modal-desc">
              {isDelivery && item.delivery_description
                ? item.delivery_description
                : item.description}
            </p>
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

          {hasCooking && (
            <div className="cmd-modal-section">
              <CookingSelector
                groupKey={cookingGroupKey}
                groupLabel={cookingGroupLabel}
                selectedKey={selectedDoneness.key}
                onSelect={(key, label) => setSelectedDoneness({ key, label })}
                isDelivery={isDelivery}
              />
            </div>
          )}

          {visibleGroups.map((group) => (
            <OptionGroupSection
              key={group.key}
              group={group}
              selections={optionSelections[group.key] || []}
              onChange={(choices) =>
                setOptionSelections((prev) => ({ ...prev, [group.key]: choices }))
              }
            />
          ))}

          {hasOldSupplements && (
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

          {hasOptionGroups && (
            <div className="cmd-modal-section cmd-note-section">
              <h4>Remarque</h4>
              <textarea
                className="cmd-note-input"
                placeholder="Allergie, demande spéciale..."
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                maxLength={200}
                rows={2}
              />
            </div>
          )}
        </div>

        <div className="cmd-modal-footer">
          {missingRequired.length > 0 && (
            <p className="cmd-missing-hint">
              Veuillez choisir : {missingRequired.map((g) => g.label).join(", ")}
            </p>
          )}
          <button
            type="button"
            className="cmd-btn cmd-btn-primary cmd-btn-full"
            onClick={handleAdd}
            disabled={!canAdd}
          >
            Ajouter — {formatPrice(displayPrice)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Menu item card ───────────────────────────────────────────
function MenuItemCard({
  item,
  categorySlug,
  onCustomize,
}: {
  item: MenuItemWithRelations;
  categorySlug: string;
  onCustomize: (item: MenuItemWithRelations, categorySlug: string) => void;
}) {
  const { addItem, state } = useCart();
  const hasVariants = item.variants.length > 0;
  const hasSupplements = item.supplements.length > 0;
  const hasCooking = !!item.cooking_group;
  const hasOptions = ((item as any).option_groups?.length ?? 0) > 0;
  const needsModal = hasVariants || hasSupplements || hasCooking || hasOptions;
  const effectivePrice = state.mode === "delivery" && item.delivery_price != null
    ? item.delivery_price
    : item.price;

  const handleAdd = () => {
    if (needsModal) {
      onCustomize(item, categorySlug);
      return;
    }
    addItem({
      menuItemId: item.id,
      name: item.name,
      basePrice: effectivePrice!,
      supplements: [],
      optionSelections: [],
      isDeliverable: item.is_deliverable,
      isDeliveryOnly: item.is_delivery_only,
      categorySlug,
    });
  };

  const effectiveDesc = state.mode === "delivery" && item.delivery_description
    ? item.delivery_description
    : item.description;

  const displayPrice = hasVariants
    ? `Dès ${formatPrice(Math.min(...item.variants.map((v) => v.price)))}`
    : effectivePrice !== null
      ? formatPrice(effectivePrice)
      : item.price_label || "Prix sur demande";

  return (
    <div className={`cmd-item-card ${!item.is_orderable ? "cmd-item-display" : ""}`}>
      <div className="cmd-item-info">
        <div className="cmd-item-header">
          <span className="cmd-item-name">{item.name}</span>
          {item.weight && <span className="cmd-item-badge">{item.weight}</span>}
          {item.volume && <span className="cmd-item-badge">{item.volume}</span>}
        </div>
        {effectiveDesc && (
          <p className="cmd-item-desc">{effectiveDesc}</p>
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
  const { state, removeConflictItems } = useCart();
  const [modeConflict, setModeConflict] = useState<ModeConflict | null>(null);

  const filteredCategories = categories
    .filter((cat) => {
      if (state.mode === "delivery" && cat.slug === "desserts") return false;
      return true;
    })
    .map((cat) => ({
      ...cat,
      menu_items: cat.menu_items
        .filter((item) => {
          if (!item.is_orderable) return false;
          if (state.mode === "delivery") return item.is_deliverable;
          return !item.is_delivery_only;
        })
        .sort((a, b) => {
          if (state.mode === "delivery") {
            return (a.delivery_sort_order ?? a.sort_order) - (b.delivery_sort_order ?? b.sort_order);
          }
          return a.sort_order - b.sort_order;
        }),
    }))
    .filter((c) => c.menu_items.length > 0);

  const [activeSlug, setActiveSlug] = useState(
    filteredCategories[0]?.slug || ""
  );
  const [modalItem, setModalItem] = useState<{ item: MenuItemWithRelations; categorySlug: string } | null>(null);

  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.find((c) => c.slug === activeSlug)) {
      setActiveSlug(filteredCategories[0].slug);
    }
  }, [state.mode]);

  const activeCategory = filteredCategories.find((c) => c.slug === activeSlug);

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
          <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour — Restaurant" width="75" height="36" />
          <span>Commander &amp; Livraison</span>
        </div>
      </header>

      <StatusBanner config={deliveryConfig} />

      <DeliveryBanner config={deliveryConfig} onModeConflict={setModeConflict} />

      <div className="cmd-crosslink">
        Vous consultez la carte livraison.{" "}
        <a href="/carte">Voir la carte complète du restaurant &rarr;</a>
      </div>

      <CategoryTabs
        categories={filteredCategories}
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
                  categorySlug={activeCategory.slug}
                  onCustomize={(it, slug) => setModalItem({ item: it, categorySlug: slug })}
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
        minOrder={deliveryConfig.min_order}
        discountActive={deliveryConfig.discount_active}
        discountPercentage={deliveryConfig.discount_percentage}
      />

      {modalItem && (
        <ItemModal
          item={modalItem.item}
          categorySlug={modalItem.categorySlug}
          onClose={() => setModalItem(null)}
        />
      )}

      {modeConflict && (
        <ModeConflictDialog
          conflict={modeConflict}
          onRemoveAndSwitch={() => {
            removeConflictItems(modeConflict);
            setModeConflict(null);
          }}
          onCancel={() => setModeConflict(null)}
        />
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
