"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  cartReducer,
  buildCartItemId,
  itemUnitPrice,
  initialState,
  STORAGE_KEY,
  type CartItem,
  type CartState,
} from "./cart-logic";

export type { CartItem, CartState };
export { buildCartItemId, cartReducer, itemUnitPrice, initialState };

interface CartContextValue {
  state: CartState;
  addItem: (item: Omit<CartItem, "quantity" | "id">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  setMode: (mode: "delivery" | "pickup") => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  getUnitPrice: (item: CartItem) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({
          type: "HYDRATE",
          state: { ...parsed, isOpen: false },
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items: state.items, mode: state.mode })
      );
    } catch {}
  }, [state.items, state.mode]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity" | "id">) => {
      const id = buildCartItemId(item.menuItemId, item.variantId, item.supplements);
      dispatch({ type: "ADD_ITEM", item: { ...item, id } });
    },
    []
  );

  const removeItem = useCallback((id: string) => dispatch({ type: "REMOVE_ITEM", id }), []);
  const updateQty = useCallback(
    (id: string, qty: number) => dispatch({ type: "UPDATE_QTY", id, qty }),
    []
  );
  const setMode = useCallback(
    (mode: "delivery" | "pickup") => dispatch({ type: "SET_MODE", mode }),
    []
  );
  const toggleCart = useCallback(() => dispatch({ type: "TOGGLE_CART" }), []);
  const openCart = useCallback(() => dispatch({ type: "OPEN_CART" }), []);
  const closeCart = useCallback(() => dispatch({ type: "CLOSE_CART" }), []);
  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const itemCount = state.items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = state.items.reduce((s, i) => s + itemUnitPrice(i) * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQty,
        setMode,
        toggleCart,
        openCart,
        closeCart,
        clearCart,
        itemCount,
        subtotal,
        getUnitPrice: itemUnitPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
