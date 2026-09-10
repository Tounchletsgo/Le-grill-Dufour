"use client";

import { useState, useEffect, useRef } from "react";
import { CartProvider, useCart, calculateDeliveryDiscount, type CartItem } from "./CartProvider";
import { getLevelByKey } from "@/data/cookingData";
import AddressAutocomplete from "./AddressAutocomplete";
import type { DeliveryConfig } from "@/types/database";

function formatPrice(price: number): string {
  return price.toFixed(2).replace(".", ",").replace(",00", "") + " €";
}

interface SuccessData {
  orderId: string;
  orderNumber: string;
  total: number;
  mode: "delivery" | "pickup";
  customerName: string;
  customerEmail: string;
  paymentMethod: "cash" | "card";
  deliveryAddress: string;
  deliveryCity: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    variantLabel?: string;
    donenessLabel?: string;
    donenessKey?: string;
    supplements: string[];
    optionLabels: string[];
    itemNote?: string;
  }[];
  subtotal: number;
  discount: number;
  discountPercentage: number;
  deliveryFee: number;
  deliveryMinTime: number;
  deliveryMaxTime: number;
  pickupTime: string;
}

function OrderConfirmation({ data, deliveryConfig }: { data: SuccessData; deliveryConfig: DeliveryConfig }) {
  const [copied, setCopied] = useState(false);
  const checkRef = useRef<SVGCircleElement>(null);

  const firstName = data.customerName.split(" ")[0] || "";
  const isDelivery = data.mode === "delivery";
  const trackingUrl = `/commande/${data.orderId}`;

  const copyNumber = () => {
    navigator.clipboard.writeText(data.orderNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const steps = isDelivery
    ? [
        { label: "Commande reçue", icon: "M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" },
        { label: "En préparation", icon: "M8.1 13.34l2.83-2.83L3.91 3.5a4.008 4.008 0 000 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" },
        { label: "En route", icon: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" },
        { label: "Chez vous", icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" },
      ]
    : [
        { label: "Commande reçue", icon: "M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" },
        { label: "En préparation", icon: "M8.1 13.34l2.83-2.83L3.91 3.5a4.008 4.008 0 000 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" },
        { label: "Prête", icon: "M11 15h2v2h-2v-2zm0-8h2v6h-2V7zm1-5C6.47 2 2 6.5 2 12a10 10 0 0010 10 10 10 0 0010-10A10 10 0 0012 2zm0 18a8 8 0 01-8-8 8 8 0 018-8 8 8 0 018 8 8 8 0 01-8 8z" },
        { label: "À récupérer", icon: "M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" },
      ];

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

      <div className="cmd-confirm">

        {/* 1. CONFIRMATION VISUELLE */}
        <div className="cmd-confirm-hero">
          <div className="cmd-confirm-check">
            <svg viewBox="0 0 52 52" width="56" height="56">
              <circle className="cmd-confirm-check-bg" cx="26" cy="26" r="24" fill="none" strokeWidth="2" />
              <circle
                ref={checkRef}
                className="cmd-confirm-check-ring"
                cx="26" cy="26" r="24"
                fill="none" strokeWidth="2.5"
                strokeDasharray="150.8"
                strokeDashoffset="150.8"
              />
              <path className="cmd-confirm-check-mark" d="M15 27l7 7 15-15" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="cmd-confirm-title">
            Merci{firstName ? ` ${firstName}` : ""}, votre commande est bien enregistrée !
          </h2>
        </div>

        {/* 2. NUMÉRO DE COMMANDE */}
        <div className="cmd-confirm-number-box">
          <span className="cmd-confirm-number-label">Commande n°</span>
          <span className="cmd-confirm-number-value">{data.orderNumber}</span>
          <button type="button" className="cmd-confirm-copy" onClick={copyNumber} aria-label="Copier le numéro">
            {copied ? (
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
            )}
            <span className="cmd-confirm-copy-label">{copied ? "Copié" : "Copier"}</span>
          </button>
        </div>

        {/* 3. FRISE D'ÉTAPES */}
        <div className="cmd-confirm-steps">
          {steps.map((step, i) => (
            <div key={i} className={`cmd-confirm-step ${i === 0 ? "cmd-confirm-step-active" : ""}`}>
              <div className="cmd-confirm-step-icon">
                <svg viewBox="0 0 24 24" width="20" height="20"><path d={step.icon} /></svg>
              </div>
              <span className="cmd-confirm-step-label">{step.label}</span>
              {i < steps.length - 1 && <div className="cmd-confirm-step-line" />}
            </div>
          ))}
        </div>
        <p className="cmd-confirm-delay">
          {isDelivery
            ? `Livraison entre ${data.deliveryMinTime} minutes et ${data.deliveryMaxTime === 60 ? "1 heure" : `${data.deliveryMaxTime} minutes`}, selon l'affluence et votre lieu de résidence.`
            : `À retirer au restaurant dans environ ${data.pickupTime}.`}
        </p>

        {/* 4. E-MAIL */}
        {data.customerEmail ? (
          <div className="cmd-confirm-email-block">
            <div className="cmd-confirm-email-icon">
              <svg viewBox="0 0 24 24" width="22" height="22"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
            </div>
            <p className="cmd-confirm-email-main">
              Un e-mail récapitulatif vient de vous être envoyé à <strong>{data.customerEmail}</strong>.
              Vous y retrouverez le détail de votre commande.
            </p>
            <p className="cmd-confirm-email-hint">
              Vous ne le voyez pas ? Pensez à vérifier vos courriers indésirables.
            </p>
          </div>
        ) : (
          <div className="cmd-confirm-email-block cmd-confirm-no-email">
            <p className="cmd-confirm-email-main">
              Notez bien votre numéro de commande <strong>{data.orderNumber}</strong> — il vous sera utile en cas de question.
            </p>
          </div>
        )}

        {/* 5. RÉCAPITULATIF */}
        <div className="cmd-confirm-recap">
          <h3 className="cmd-confirm-section-title">Récapitulatif</h3>
          <div className="cmd-confirm-items">
            {data.items.map((item, i) => (
              <div key={i} className="cmd-confirm-item">
                <span className="cmd-confirm-item-qty">{item.quantity}x</span>
                <div className="cmd-confirm-item-info">
                  <span className="cmd-confirm-item-name">{item.name}</span>
                  {item.variantLabel && <small>{item.variantLabel}</small>}
                  {item.donenessLabel && (
                    <small className="cmd-confirm-item-doneness">
                      <span
                        className="cmd-doneness-dot"
                        style={{ background: getLevelByKey(item.donenessKey || "")?.color || "#888" }}
                      />
                      {item.donenessLabel}
                    </small>
                  )}
                  {item.optionLabels.map((label, j) => (
                    <small key={j}>{label}</small>
                  ))}
                  {item.supplements.length > 0 && (
                    <small>+ {item.supplements.join(", ")}</small>
                  )}
                  {item.itemNote && <small className="cmd-confirm-item-note">Note : {item.itemNote}</small>}
                </div>
                <span className="cmd-confirm-item-price">{formatPrice(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="cmd-confirm-totals">
            <div className="cmd-confirm-total-row">
              <span>Sous-total</span>
              <span>{formatPrice(data.subtotal)}</span>
            </div>
            {data.discount > 0 && (
              <div className="cmd-confirm-total-row cmd-confirm-discount">
                <span>Remise −{data.discountPercentage.toString().replace(".", ",")} %</span>
                <span>−{formatPrice(data.discount)}</span>
              </div>
            )}
            {isDelivery && (
              <div className="cmd-confirm-total-row">
                <span>Frais de livraison</span>
                <span>{formatPrice(data.deliveryFee)}</span>
              </div>
            )}
            <div className="cmd-confirm-total-row cmd-confirm-total-final">
              <span>Total</span>
              <span>{formatPrice(data.total)}</span>
            </div>
          </div>

          <p className="cmd-confirm-payment">
            À régler {isDelivery ? "à la livraison" : "au retrait"},{" "}
            {data.paymentMethod === "cash" ? "en espèces" : "par carte ou Bancontact"}.
          </p>
        </div>

        {/* 6. ADRESSE DE LIVRAISON */}
        {isDelivery && data.deliveryAddress && (
          <div className="cmd-confirm-address">
            <h3 className="cmd-confirm-section-title">Adresse de livraison</h3>
            <p className="cmd-confirm-address-text">
              {data.deliveryAddress}
              {data.deliveryCity ? `, ${data.deliveryCity}` : ""}
            </p>
            <p className="cmd-confirm-address-error">
              Une erreur ? Appelez-nous tout de suite au{" "}
              <a href="tel:+3256342870">056 34 28 70</a>.
            </p>
          </div>
        )}

        {/* 6bis. RETRAIT */}
        {!isDelivery && (
          <div className="cmd-confirm-address">
            <h3 className="cmd-confirm-section-title">Adresse de retrait</h3>
            <p className="cmd-confirm-address-text">
              Le Grill Dufour — Rue du Christ 34, 7700 Mouscron
            </p>
            <p className="cmd-confirm-address-hint">
              Présentez-vous au comptoir avec votre numéro de commande.
            </p>
          </div>
        )}

        {/* 7. BOUTONS */}
        <div className="cmd-confirm-actions">
          <a href={trackingUrl} className="cmd-btn cmd-btn-primary cmd-btn-full cmd-btn-lg">
            Suivre ma commande
          </a>
          <a href="tel:+3256342870" className="cmd-confirm-phone">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg>
            056 34 28 70
          </a>
        </div>

        {/* 8. TOUCHE FINALE */}
        <p className="cmd-confirm-closing">
          Merci de votre confiance. À tout de suite !<br />
          <span className="cmd-confirm-signature">— Le Grill Dufour</span>
        </p>
      </div>
    </div>
  );
}

function CheckoutForm({ deliveryConfig }: { deliveryConfig: DeliveryConfig }) {
  const { state, itemCount, subtotal, getUnitPrice, clearCart } = useCart();

  const DELIVERY_FEE = deliveryConfig.fee;
  const MIN_ORDER = deliveryConfig.min_order;
  const discountActive = deliveryConfig.discount_active;
  const discountPercentage = deliveryConfig.discount_percentage;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const submittedRef = useRef(false);

  const discountExcludedSlugs = deliveryConfig.discount_excluded_slugs;
  const discount =
    state.mode === "delivery" && discountActive && discountPercentage > 0
      ? calculateDeliveryDiscount(state.items, discountPercentage, discountExcludedSlugs)
      : 0;
  const fee = state.mode === "delivery" ? DELIVERY_FEE : 0;
  const subtotalAfterDiscount = subtotal - discount;
  const total = subtotalAfterDiscount + fee;
  const canSubmit = itemCount > 0 && (state.mode !== "delivery" || subtotalAfterDiscount >= MIN_ORDER);

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
    if (!canSubmit || isSubmitting || submittedRef.current) return;

    setIsSubmitting(true);
    setErrors([]);
    submittedRef.current = true;

    try {
      const fullAddress = state.mode === "delivery"
        ? `${address.streetName} ${address.houseNumber}${address.box ? ` ${address.box}` : ""}`
        : undefined;

      const snapshotItems = state.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: getUnitPrice(item),
        variantLabel: item.variantLabel,
        donenessLabel: item.donenessLabel,
        donenessKey: item.donenessKey,
        supplements: item.supplements.map((s) => s.label),
        optionLabels: (item.optionSelections || []).map((os) =>
          os.choices.map((c) => c.quantity > 1 ? `${c.label} x${c.quantity}` : c.label).join(", ")
        ),
        itemNote: item.itemNote,
      }));

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
        submittedRef.current = false;
        return;
      }

      setSuccess({
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        total: result.total,
        mode: state.mode,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        paymentMethod: form.paymentMethod,
        deliveryAddress: fullAddress || "",
        deliveryCity: address.municipality,
        items: snapshotItems,
        subtotal,
        discount,
        discountPercentage,
        deliveryFee: fee,
        deliveryMinTime: deliveryConfig.delivery_min_time,
        deliveryMaxTime: deliveryConfig.delivery_max_time,
        pickupTime: deliveryConfig.pickup_time,
      });
      clearCart();
    } catch {
      setErrors(["Erreur réseau. Vérifiez votre connexion."]);
      setIsSubmitting(false);
      submittedRef.current = false;
    }
  };

  if (success) {
    return <OrderConfirmation data={success} deliveryConfig={deliveryConfig} />;
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
          <span>Commande</span>
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
                ? `Entre ${deliveryConfig.delivery_min_time} min et ${deliveryConfig.delivery_max_time === 60 ? "1h" : `${deliveryConfig.delivery_max_time} min`} · ${formatPrice(fee)}`
                : `À retirer au restaurant · ~${deliveryConfig.pickup_time}`}
            </p>
            {state.mode === "delivery" && (
              <p className="cmd-checkout-time-note">
                Livraison entre {deliveryConfig.delivery_min_time} minutes et {deliveryConfig.delivery_max_time === 60 ? "1 heure" : `${deliveryConfig.delivery_max_time} minutes`}, selon l&apos;affluence et votre lieu de résidence.
              </p>
            )}
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
              {state.mode === "delivery" && (
                <p className="cmd-field-hint">Pour recevoir votre confirmation de commande.</p>
              )}
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
                <span>Remise −{discountPercentage.toString().replace(".", ",")}%</span>
                <span>−{formatPrice(discount)}</span>
              </div>
            )}
            {state.mode === "delivery" && (
              <div className="cmd-cart-total-row">
                <span>Frais de livraison</span>
                <span>{formatPrice(fee)}</span>
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
