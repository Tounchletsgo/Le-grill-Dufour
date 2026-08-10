"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  variantId?: string;
  variantLabel?: string;
  basePrice: number;
  quantity: number;
  supplements: { id: string; label: string; price: number }[];
}

interface CartState {
  items: CartItem[];
  mode: "delivery" | "pickup";
  isOpen: boolean;
}

type CartAction =
  | { type: "ADD_ITEM"; item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "UPDATE_QTY"; id: string; qty: number }
  | { type: "SET_MODE"; mode: "delivery" | "pickup" }
  | { type: "TOGGLE_CART" }
  | { type: "OPEN_CART" }
  | { type: "CLOSE_CART" }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; state: CartState };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        return {
          ...state,
          isOpen: true,
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        ...state,
        isOpen: true,
        items: [...state.items, { ...action.item, quantity: 1 }],
      };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.id),
      };
    case "UPDATE_QTY": {
      if (action.qty <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.id !== action.id),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: action.qty } : i
        ),
      };
    }
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "TOGGLE_CART":
      return { ...state, isOpen: !state.isOpen };
    case "OPEN_CART":
      return { ...state, isOpen: true };
    case "CLOSE_CART":
      return { ...state, isOpen: false };
    case "CLEAR":
      return { ...state, items: [] };
    case "HYDRATE":
      return action.state;
    default:
      return state;
  }
}

function buildCartItemId(
  menuItemId: string,
  variantId?: string,
  supplements?: { id: string }[]
): string {
  const parts = [menuItemId];
  if (variantId) parts.push(variantId);
  if (supplements?.length) {
    parts.push(
      supplements
        .map((s) => s.id)
        .sort()
        .join(",")
    );
  }
  return parts.join("__");
}

function itemUnitPrice(item: CartItem): number {
  return item.basePrice + item.supplements.reduce((s, sup) => s + sup.price, 0);
}

const initialState: CartState = { items: [], mode: "delivery", isOpen: false };

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

const STORAGE_KEY = "gdf-cart";

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
