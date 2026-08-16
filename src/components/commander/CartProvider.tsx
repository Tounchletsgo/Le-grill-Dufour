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
  type CartOptionSelection,
  type CartOptionChoice,
} from "./cart-logic";

export type { CartItem, CartState, CartOptionSelection, CartOptionChoice };
export { buildCartItemId, cartReducer, itemUnitPrice, initialState };

export interface ModeConflict {
  mode: "delivery" | "pickup";
  conflictItems: CartItem[];
}

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
  checkModeConflict: (targetMode: "delivery" | "pickup") => ModeConflict | null;
  removeConflictItems: (conflict: ModeConflict) => void;
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
      const id = buildCartItemId(item.menuItemId, item.variantId, item.supplements, item.donenessKey, item.optionSelections);
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

  const checkModeConflict = useCallback(
    (targetMode: "delivery" | "pickup"): ModeConflict | null => {
      if (state.items.length === 0) return null;
      if (targetMode === "delivery") {
        const nonDeliverable = state.items.filter((i) => i.isDeliverable === false);
        if (nonDeliverable.length > 0) return { mode: targetMode, conflictItems: nonDeliverable };
      } else {
        const deliveryOnly = state.items.filter((i) => i.isDeliveryOnly === true);
        if (deliveryOnly.length > 0) return { mode: targetMode, conflictItems: deliveryOnly };
      }
      return null;
    },
    [state.items]
  );

  const removeConflictItems = useCallback(
    (conflict: ModeConflict) => {
      conflict.conflictItems.forEach((ci) => dispatch({ type: "REMOVE_ITEM", id: ci.id }));
      dispatch({ type: "SET_MODE", mode: conflict.mode });
    },
    []
  );

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
        checkModeConflict,
        removeConflictItems,
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
