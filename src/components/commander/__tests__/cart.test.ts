import { describe, it, expect } from "vitest";
import {
  cartReducer,
  buildCartItemId,
  itemUnitPrice,
  initialState,
  type CartItem,
} from "../cart-logic";

const makeItem = (
  menuItemId: string,
  opts: {
    variantId?: string;
    variantLabel?: string;
    basePrice?: number;
    supplements?: { id: string; label: string; price: number }[];
  } = {}
) => {
  const supplements = opts.supplements ?? [];
  return {
    id: buildCartItemId(menuItemId, opts.variantId, supplements),
    menuItemId,
    name: `Item ${menuItemId}`,
    variantId: opts.variantId,
    variantLabel: opts.variantLabel,
    basePrice: opts.basePrice ?? 10,
    supplements,
  };
};

describe("buildCartItemId", () => {
  it("uses menuItemId alone when no variant/supplements", () => {
    expect(buildCartItemId("abc")).toBe("abc");
  });

  it("includes variantId", () => {
    expect(buildCartItemId("abc", "v1")).toBe("abc__v1");
  });

  it("includes sorted supplement ids", () => {
    expect(
      buildCartItemId("abc", undefined, [{ id: "s2" }, { id: "s1" }])
    ).toBe("abc__s1,s2");
  });

  it("produces different IDs for different supplements", () => {
    const a = buildCartItemId("x", undefined, [{ id: "s1" }]);
    const b = buildCartItemId("x", undefined, [{ id: "s2" }]);
    expect(a).not.toBe(b);
  });
});

describe("cartReducer — ADD_ITEM", () => {
  it("adds a new item with quantity 1", () => {
    const item = makeItem("a");
    const state = cartReducer(initialState, { type: "ADD_ITEM", item });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(1);
    expect(state.items[0].name).toBe("Item a");
  });

  it("increments quantity when same id added again", () => {
    const item = makeItem("a");
    let state = cartReducer(initialState, { type: "ADD_ITEM", item });
    state = cartReducer(state, { type: "ADD_ITEM", item });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it("keeps items with different options as separate lines", () => {
    const plain = makeItem("a");
    const withSup = makeItem("a", {
      supplements: [{ id: "s1", label: "Sauce", price: 2 }],
    });
    let state = cartReducer(initialState, { type: "ADD_ITEM", item: plain });
    state = cartReducer(state, { type: "ADD_ITEM", item: withSup });
    expect(state.items).toHaveLength(2);
  });
});

describe("cartReducer — UPDATE_QTY", () => {
  it("updates the quantity", () => {
    const item = makeItem("a");
    let state = cartReducer(initialState, { type: "ADD_ITEM", item });
    state = cartReducer(state, { type: "UPDATE_QTY", id: item.id, qty: 5 });
    expect(state.items[0].quantity).toBe(5);
  });

  it("removes item when quantity reaches 0", () => {
    const item = makeItem("a");
    let state = cartReducer(initialState, { type: "ADD_ITEM", item });
    state = cartReducer(state, { type: "UPDATE_QTY", id: item.id, qty: 0 });
    expect(state.items).toHaveLength(0);
  });

  it("removes item when quantity goes negative", () => {
    const item = makeItem("a");
    let state = cartReducer(initialState, { type: "ADD_ITEM", item });
    state = cartReducer(state, { type: "UPDATE_QTY", id: item.id, qty: -1 });
    expect(state.items).toHaveLength(0);
  });
});

describe("cartReducer — REMOVE_ITEM", () => {
  it("removes the item by id", () => {
    const a = makeItem("a");
    const b = makeItem("b");
    let state = cartReducer(initialState, { type: "ADD_ITEM", item: a });
    state = cartReducer(state, { type: "ADD_ITEM", item: b });
    state = cartReducer(state, { type: "REMOVE_ITEM", id: a.id });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].menuItemId).toBe("b");
  });
});

describe("cartReducer — CLEAR", () => {
  it("removes all items", () => {
    const a = makeItem("a");
    const b = makeItem("b");
    let state = cartReducer(initialState, { type: "ADD_ITEM", item: a });
    state = cartReducer(state, { type: "ADD_ITEM", item: b });
    state = cartReducer(state, { type: "CLEAR" });
    expect(state.items).toHaveLength(0);
  });
});

describe("total recalculation", () => {
  it("computes subtotal correctly after add/increment/decrement", () => {
    const item = makeItem("a", {
      basePrice: 12,
      supplements: [{ id: "s1", label: "Extra", price: 3 }],
    });

    let state = cartReducer(initialState, { type: "ADD_ITEM", item });
    const unitPrice = itemUnitPrice(state.items[0]);
    expect(unitPrice).toBe(15);

    const subtotal1 = state.items.reduce(
      (s, i) => s + itemUnitPrice(i) * i.quantity,
      0
    );
    expect(subtotal1).toBe(15);

    state = cartReducer(state, { type: "ADD_ITEM", item });
    const subtotal2 = state.items.reduce(
      (s, i) => s + itemUnitPrice(i) * i.quantity,
      0
    );
    expect(subtotal2).toBe(30);

    state = cartReducer(state, {
      type: "UPDATE_QTY",
      id: item.id,
      qty: 1,
    });
    const subtotal3 = state.items.reduce(
      (s, i) => s + itemUnitPrice(i) * i.quantity,
      0
    );
    expect(subtotal3).toBe(15);
  });
});
