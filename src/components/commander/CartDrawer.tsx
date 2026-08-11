"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

function formatPrice(price: number): string {
  return price.toFixed(2).replace(".", ",").replace(",00", "") + " €";
}

export default function CartDrawer({
  deliveryFee,
  freeFrom,
  minOrder,
}: {
  deliveryFee: number;
  freeFrom: number;
  minOrder: number;
}) {
  const {
    state,
    closeCart,
    removeItem,
    updateQty,
    clearCart,
    itemCount,
    subtotal,
    getUnitPrice,
  } = useCart();
  const [confirmClear, setConfirmClear] = useState(false);

  const fee =
    state.mode === "delivery" && subtotal < freeFrom ? deliveryFee : 0;
  const total = subtotal + fee;
  const canCheckout =
    itemCount > 0 && subtotal >= minOrder;

  const handleClear = () => {
    if (confirmClear) {
      clearCart();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  return (
    <>
      <div
        className={`cmd-cart-overlay ${state.isOpen ? "is-visible" : ""}`}
        onClick={closeCart}
      />
      <aside className={`cmd-cart-drawer ${state.isOpen ? "is-open" : ""}`}>
        <div className="cmd-cart-header">
          <h3>Votre Panier ({itemCount})</h3>
          <button
            className="cmd-cart-close"
            onClick={closeCart}
            aria-label="Fermer le panier"
            type="button"
          >
            &times;
          </button>
        </div>

        <div className="cmd-cart-body">
          {state.items.length === 0 ? (
            <div className="cmd-cart-empty">
              <svg viewBox="0 0 24 24" width="48" height="48" className="cmd-cart-empty-icon">
                <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.6L5.2 14c-.1.3-.2.6-.2 1 0 1.1.9 2 2 2h12v-2H7.4c-.1 0-.2-.1-.2-.2v-.1l.9-1.6h7.4c.8 0 1.4-.4 1.7-1l3.6-6.5c.2-.3 0-.6-.3-.6H5.2L4.3 2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
              <p>Votre panier est vide</p>
              <a href="/commander" className="cmd-btn cmd-btn-primary" onClick={closeCart}>
                Voir la carte livraison
              </a>
            </div>
          ) : (
            <>
              {state.items.map((item) => {
                const unit = getUnitPrice(item);
                return (
                  <div className="cmd-cart-item" key={item.id}>
                    <div className="cmd-cart-item-top">
                      <div className="cmd-cart-item-info">
                        <span className="cmd-cart-item-name">
                          {item.name}
                          {item.variantLabel && (
                            <small> — {item.variantLabel}</small>
                          )}
                        </span>
                        {item.supplements.length > 0 && (
                          <small className="cmd-cart-item-sups">
                            + {item.supplements.map((s) => s.label).join(", ")}
                          </small>
                        )}
                      </div>
                      <span className="cmd-cart-item-price">
                        {formatPrice(unit * item.quantity)}
                      </span>
                    </div>
                    <div className="cmd-cart-item-actions">
                      <div className="cmd-cart-qty">
                        <button
                          type="button"
                          className="cmd-cart-qty-btn"
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          aria-label={`Diminuer la quantité de ${item.name}`}
                        >
                          &minus;
                        </button>
                        <span className="cmd-cart-qty-value">{item.quantity}</span>
                        <button
                          type="button"
                          className="cmd-cart-qty-btn"
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          aria-label={`Augmenter la quantité de ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="cmd-cart-item-remove"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Supprimer ${item.name} du panier`}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="cmd-cart-clear-wrap">
                <button
                  type="button"
                  className={`cmd-cart-clear ${confirmClear ? "cmd-cart-clear-confirm" : ""}`}
                  onClick={handleClear}
                  onBlur={() => setConfirmClear(false)}
                >
                  {confirmClear ? "Confirmer le vidage" : "Vider le panier"}
                </button>
              </div>
            </>
          )}
        </div>

        {state.items.length > 0 && (
          <div className="cmd-cart-footer">
            <div className="cmd-cart-totals">
              <div className="cmd-cart-total-row">
                <span>Sous-total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {state.mode === "delivery" && (
                <div className="cmd-cart-total-row">
                  <span>Livraison</span>
                  <span>
                    {fee === 0
                      ? "Gratuite"
                      : formatPrice(fee)}
                  </span>
                </div>
              )}
              <div className="cmd-cart-total-row cmd-cart-total-final">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            {subtotal < minOrder && (
              <p className="cmd-cart-min-warning">
                Minimum de commande : {formatPrice(minOrder)}
                {" "}(encore {formatPrice(minOrder - subtotal)})
              </p>
            )}
            <a
              href={canCheckout ? "/commander/checkout" : undefined}
              className={`cmd-btn cmd-btn-primary cmd-btn-full ${!canCheckout ? "cmd-btn-disabled" : ""}`}
              onClick={(e) => !canCheckout && e.preventDefault()}
            >
              Passer la commande — {formatPrice(total)}
            </a>
          </div>
        )}
      </aside>
    </>
  );
}
