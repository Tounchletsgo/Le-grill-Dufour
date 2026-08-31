"use client";

import { useState, useEffect } from "react";
import { CartProvider, useCart, calculateDeliveryDiscount, type CartItem } from "./CartProvider";
import { getLevelByKey } from "@/data/cookingData";
import AddressAutocomplete from "./AddressAutocomplete";
import type { DeliveryConfig } from "@/types/database";

function formatPrice(price: number): string {
  return price.toFixed(2).replace(".", ",").replace(",00", "") + " €";
}

function CheckoutForm({ deliveryConfig }: { deliveryConfig: DeliveryConfig }) {
  const { state, itemCount, subtotal, getUnitPrice, clearCart } = useCart();

  const DELIVERY_FEE = deliveryConfig.fee;
  const FREE_FROM = deliveryConfig.free_from;
  const MIN_ORDER = deliveryConfig.min_order;
  const discountActive = deliveryConfig.discount_active;
  const discountPercentage = deliveryConfig.discount_percentage;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<{ orderNumber: string; total: number } | null>(null);

  const discount =
    state.mode === "delivery" && discountActive && discountPercentage > 0
      ? calculateDeliveryDiscount(state.items, discountPercentage)
      : 0;
  const fee = state.mode === "delivery" && subtotal < FREE_FROM ? DELIVERY_FEE : 0;
  const total = subtotal - discount + fee;
  const canSubmit = itemCount > 0 && subtotal >= MIN_ORDER;

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    paymentMethod: "cash" as "cash" | "card",
    cashAmount: "",
    notes: "",
  });

  const [address, setAddress] = useState({
    streetName: "",
    houseNumber: "",
    box: "",
    postalCode: "",
    municipality: "Mouscron",
    addressSource: "autocomplete" as "autocomplete" | "manual",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setErrors([]);

    try {
      const fullAddress = state.mode === "delivery"
        ? `${address.streetName} ${address.houseNumber}${address.box ? ` ${address.box}` : ""}`
        : undefined;

      const payload = {
        mode: state.mode,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail || undefined,
        deliveryAddress: fullAddress,
        deliveryPostal: state.mode === "delivery" ? address.postalCode : undefined,
        deliveryCity: state.mode === "delivery" ? address.municipality : undefined,
        houseNumber: state.mode === "delivery" ? address.houseNumber : undefined,
        addressSource: state.mode === "delivery" ? address.addressSource : undefined,
        paymentMethod: form.paymentMethod,
        notes: [
          form.notes,
          form.paymentMethod === "cash" && form.cashAmount ? `💶 Paie avec ${form.cashAmount} €` : "",
        ].filter(Boolean).join(" — ") || undefined,
        items: state.items.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          variantId: item.variantId,
          variantLabel: item.variantLabel,
          basePrice: item.basePrice,
          quantity: item.quantity,
          supplements: item.supplements,
          optionSelections: item.optionSelections,
          itemNote: item.itemNote,
          donenessKey: item.donenessKey,
          donenessLabel: item.donenessLabel,
          cookingGroupKey: item.cookingGroupKey,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!result.success) {
        setErrors(result.errors || ["Erreur inconnue."]);
        setIsSubmitting(false);
        return;
      }

      setSuccess({ orderNumber: result.orderNumber, total: result.total });
      clearCart();
    } catch {
      setErrors(["Erreur réseau. Vérifiez votre connexion."]);
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="cmd-page">
        <header className="cmd-header">
          <a href="/livraison" className="cmd-back">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z" />
            </svg>
            Nouvelle commande
          </a>
          <div className="cmd-logo">
            <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour — Restaurant" width="75" height="36" />
          </div>
        </header>
        <div className="cmd-checkout-success">
          <div className="cmd-success-icon">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
            </svg>
          </div>
          <h2>Commande confirmée !</h2>
          <p className="cmd-success-number">N° {success.orderNumber}</p>
          <p className="cmd-success-total">Total : {formatPrice(success.total)}</p>
          <p className="cmd-success-info">
            Votre commande est confirmée. Le paiement se fera à la livraison ou au retrait
            (espèces ou carte / Bancontact).
          </p>
          <a href="/" className="cmd-btn cmd-btn-primary">
            Retour au site
          </a>
        </div>
      </div>
    );
  }

  if (itemCount === 0 && !success) {
    return (
      <div className="cmd-page">
        <header className="cmd-header">
          <a href="/livraison" className="cmd-back">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z" />
            </svg>
            Retour à la carte
          </a>
          <div className="cmd-logo">
            <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour — Restaurant" width="75" height="36" />
          </div>
        </header>
        <div className="cmd-checkout-empty">
          <p>Votre panier est vide.</p>
          <a href="/livraison" className="cmd-btn cmd-btn-primary">
            Voir la carte
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="cmd-page">
      <header className="cmd-header">
        <a href="/livraison" className="cmd-back">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z" />
          </svg>
          Retour à la carte
        </a>
        <div className="cmd-logo">
          <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour — Restaurant" width="75" height="36" />
          <span>Checkout</span>
        </div>
      </header>

      <div className="cmd-checkout">
        <form onSubmit={handleSubmit} noValidate>
          {/* Order summary */}
          <section className="cmd-checkout-section">
            <h3 className="cmd-checkout-heading">Récapitulatif</h3>
            <div className="cmd-checkout-items">
              {state.items.map((item) => {
                const unit = getUnitPrice(item);
                return (
                  <div className="cmd-checkout-item" key={item.id}>
                    <span className="cmd-checkout-item-qty">{item.quantity}x</span>
                    <div className="cmd-checkout-item-info">
                      <span>{item.name}</span>
                      {item.variantLabel && <small>{item.variantLabel}</small>}
                      {item.supplements.length > 0 && (
                        <small>+ {item.supplements.map((s) => s.label).join(", ")}</small>
                      )}
                      {item.optionSelections?.length > 0 && item.optionSelections.map((os) => (
                        <small key={os.groupKey}>
                          {os.choices
                            .map((c) => c.quantity > 1 ? `${c.label} x${c.quantity}` : c.label)
                            .join(", ")}
                        </small>
                      ))}
                      {item.itemNote && (
                        <small className="cmd-checkout-note">Note : {item.itemNote}</small>
                      )}
                      {item.donenessLabel && (
                        <small className="cmd-checkout-doneness">
                          <span
                            className="cmd-doneness-dot"
                            style={{ background: getLevelByKey(item.donenessKey || "")?.color || "#888" }}
                          />
                          Cuisson : {item.donenessLabel}
                        </small>
                      )}
                    </div>
                    <span className="cmd-checkout-item-price">
                      {formatPrice(unit * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Mode */}
          <section className="cmd-checkout-section">
            <h3 className="cmd-checkout-heading">
              {state.mode === "delivery" ? "Livraison" : "À emporter"}
            </h3>
            <p className="cmd-checkout-mode-info">
              {state.mode === "delivery"
                ? `Livraison ~25 min · ${fee === 0 ? "Gratuite" : formatPrice(fee)}`
                : "À retirer au restaurant · ~15 min"}
            </p>
          </section>

          {/* Contact info */}
          <section className="cmd-checkout-section">
            <h3 className="cmd-checkout-heading">Vos coordonnées</h3>
            <div className="cmd-form-row">
              <div className="cmd-form-group">
                <label htmlFor="customerName">Nom complet *</label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  required
                  autoComplete="name"
                  placeholder="Jean Dupont"
                  value={form.customerName}
                  onChange={handleChange}
                />
              </div>
              <div className="cmd-form-group">
                <label htmlFor="customerPhone">Téléphone *</label>
                <input
                  type="tel"
                  id="customerPhone"
                  name="customerPhone"
                  required
                  autoComplete="tel"
                  placeholder="+32 470 12 34 56"
                  value={form.customerPhone}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="cmd-form-group">
              <label htmlFor="customerEmail">Email (optionnel)</label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                autoComplete="email"
                placeholder="jean@exemple.be"
                value={form.customerEmail}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* Delivery address */}
          {state.mode === "delivery" && (
            <section className="cmd-checkout-section">
              <h3 className="cmd-checkout-heading">Adresse de livraison</h3>
              <AddressAutocomplete value={address} onChange={setAddress} />
            </section>
          )}

          {/* Payment */}
          <section className="cmd-checkout-section">
            <h3 className="cmd-checkout-heading">Paiement</h3>
            <div className="cmd-payment-options">
              <label className={`cmd-payment-option ${form.paymentMethod === "cash" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={form.paymentMethod === "cash"}
                  onChange={handleChange}
                />
                <span className="cmd-payment-label">
                  <strong>Espèces</strong>
                  <small>À régler à la {state.mode === "delivery" ? "livraison" : "récupération"}</small>
                </span>
              </label>
              <label className={`cmd-payment-option ${form.paymentMethod === "card" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={form.paymentMethod === "card"}
                  onChange={handleChange}
                />
                <span className="cmd-payment-label">
                  <strong>Carte / Bancontact</strong>
                  <small>TPE mobile à la {state.mode === "delivery" ? "livraison" : "récupération"}</small>
                </span>
              </label>
            </div>
            {form.paymentMethod === "cash" && (
              <div className="cmd-form-group" style={{ marginTop: "0.75rem" }}>
                <label htmlFor="cashAmount">Vous payez avec (optionnel)</label>
                <select
                  id="cashAmount"
                  name="cashAmount"
                  className="cmd-select"
                  value={form.cashAmount}
                  onChange={handleChange}
                >
                  <option value="">— Montant exact</option>
                  <option value="20">Billet de 20 €</option>
                  <option value="50">Billet de 50 €</option>
                  <option value="100">Billet de 100 €</option>
                </select>
              </div>
            )}
            <p className="cmd-payment-note">
              Le paiement se fait à la {state.mode === "delivery" ? "livraison" : "récupération"}.
            </p>
          </section>

          {/* Allergy notice */}
          <div className="cmd-allergy-notice">
            En cas d&apos;allergie, pr&eacute;cisez-le dans la remarque de chaque article ou appelez-nous
            au <a href="tel:+3256342870">056 34 28 70</a>.
          </div>

          {/* Notes */}
          <section className="cmd-checkout-section">
            <div className="cmd-form-group">
              <label htmlFor="notes">Notes (optionnel)</label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Allergies, instructions, étage, code d'entrée..."
                value={form.notes}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* Totals */}
          <section className="cmd-checkout-section cmd-checkout-totals">
            <div className="cmd-cart-total-row">
              <span>Sous-total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="cmd-cart-total-row cmd-cart-discount-row">
                <span>Remise livraison −{discountPercentage.toString().replace(".", ",")}%</span>
                <span>−{formatPrice(discount)}</span>
              </div>
            )}
            {state.mode === "delivery" && (
              <div className="cmd-cart-total-row">
                <span>Livraison</span>
                <span>{fee === 0 ? "Gratuite" : formatPrice(fee)}</span>
              </div>
            )}
            <div className="cmd-cart-total-row cmd-cart-total-final">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </section>

          {errors.length > 0 && (
            <div className="cmd-checkout-errors">
              {errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}

          <button
            type="submit"
            className={`cmd-btn cmd-btn-primary cmd-btn-full cmd-btn-lg ${!canSubmit || isSubmitting ? "cmd-btn-disabled" : ""}`}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? "Envoi en cours..." : `Confirmer — ${formatPrice(total)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage({ deliveryConfig }: { deliveryConfig: DeliveryConfig }) {
  return (
    <CartProvider>
      <CheckoutForm deliveryConfig={deliveryConfig} />
    </CartProvider>
  );
}
