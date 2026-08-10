"use client";

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
    itemCount,
    subtotal,
    getUnitPrice,
  } = useCart();

  const fee =
    state.mode === "delivery" && subtotal < freeFrom ? deliveryFee : 0;
  const total = subtotal + fee;
  const canCheckout =
    itemCount > 0 && subtotal >= minOrder;

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
            <p className="cmd-cart-empty">Votre panier est vide</p>
          ) : (
            state.items.map((item) => {
              const unit = getUnitPrice(item);
              return (
                <div className="cmd-cart-item" key={item.id}>
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
                    <span className="cmd-cart-item-price">
                      {formatPrice(unit * item.quantity)}
                    </span>
                  </div>
                  <div className="cmd-cart-item-actions">
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      aria-label="Diminuer"
                    >
                      &minus;
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      aria-label="Augmenter"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="cmd-cart-item-remove"
                      onClick={() => removeItem(item.id)}
                      aria-label="Supprimer"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
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
