export interface CartOptionChoice {
  key: string;
  label: string;
  price: number;
  quantity: number;
}

export interface CartOptionSelection {
  groupKey: string;
  groupLabel: string;
  choices: CartOptionChoice[];
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  variantId?: string;
  variantLabel?: string;
  basePrice: number;
  quantity: number;
  supplements: { id: string; label: string; price: number }[];
  optionSelections: CartOptionSelection[];
  itemNote?: string;
  isDeliverable?: boolean;
  isDeliveryOnly?: boolean;
  donenessKey?: string;
  donenessLabel?: string;
  cookingGroupKey?: string;
  categorySlug?: string;
}

export interface CartState {
  items: CartItem[];
  mode: "delivery" | "pickup";
  isOpen: boolean;
}

export type CartAction =
  | { type: "ADD_ITEM"; item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "UPDATE_QTY"; id: string; qty: number }
  | { type: "SET_MODE"; mode: "delivery" | "pickup" }
  | { type: "TOGGLE_CART" }
  | { type: "OPEN_CART" }
  | { type: "CLOSE_CART" }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; state: CartState };

export function cartReducer(state: CartState, action: CartAction): CartState {
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

export function buildCartItemId(
  menuItemId: string,
  variantId?: string,
  supplements?: { id: string }[],
  donenessKey?: string,
  optionSelections?: CartOptionSelection[]
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
  if (donenessKey) parts.push(`ck:${donenessKey}`);
  if (optionSelections?.length) {
    const optParts = optionSelections
      .flatMap((os) => os.choices.map((c) => `${os.groupKey}:${c.key}${c.quantity > 1 ? `x${c.quantity}` : ""}`))
      .sort();
    if (optParts.length) parts.push(`opt:${optParts.join(",")}`);
  }
  return parts.join("__");
}

export function itemUnitPrice(item: CartItem): number {
  const supTotal = item.supplements.reduce((s, sup) => s + sup.price, 0);
  const optTotal = item.optionSelections.reduce(
    (s, os) => s + os.choices.reduce((cs, c) => cs + c.price * c.quantity, 0),
    0
  );
  return item.basePrice + supTotal + optTotal;
}

export const initialState: CartState = { items: [], mode: "delivery", isOpen: false };

export const STORAGE_KEY = "gdf-cart";

const DISCOUNT_EXCLUDED_SLUGS = ["boissons", "desserts"];

export function roundTo5Cents(value: number): number {
  return Math.round(value / 0.05) * 0.05;
}

export function calculateDeliveryDiscount(
  items: CartItem[],
  discountPercentage: number
): number {
  let totalDiscount = 0;
  for (const item of items) {
    if (DISCOUNT_EXCLUDED_SLUGS.includes(item.categorySlug || "")) continue;
    const unitPrice = itemUnitPrice(item);
    const discountedUnitPrice = roundTo5Cents(unitPrice * (1 - discountPercentage / 100));
    totalDiscount += (unitPrice - discountedUnitPrice) * item.quantity;
  }
  return parseFloat(totalDiscount.toFixed(2));
}
