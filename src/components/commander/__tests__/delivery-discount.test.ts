import { describe, it, expect } from "vitest";
import {
  calculateDeliveryDiscount,
  roundTo5Cents,
  itemUnitPrice,
  type CartItem,
} from "../cart-logic";

function makeCartItem(overrides: Partial<CartItem> & { menuItemId: string }): CartItem {
  return {
    id: overrides.menuItemId,
    name: `Item ${overrides.menuItemId}`,
    basePrice: 10,
    quantity: 1,
    supplements: [],
    optionSelections: [],
    ...overrides,
  };
}

describe("roundTo5Cents", () => {
  it("rounds down below 2.5 cents", () => {
    expect(roundTo5Cents(1.02)).toBe(1.0);
  });

  it("rounds 1.03 to 1.05", () => {
    expect(roundTo5Cents(1.03)).toBeCloseTo(1.05, 10);
  });

  it("keeps exact multiples of 5 cents", () => {
    expect(roundTo5Cents(1.15)).toBeCloseTo(1.15, 10);
  });

  it("handles zero", () => {
    expect(roundTo5Cents(0)).toBe(0);
  });

  it("handles large values", () => {
    expect(roundTo5Cents(99.97)).toBe(99.95);
  });
});

describe("itemUnitPrice", () => {
  it("returns base price when no supplements or options", () => {
    const item = makeCartItem({ menuItemId: "a", basePrice: 15 });
    expect(itemUnitPrice(item)).toBe(15);
  });

  it("adds supplement prices", () => {
    const item = makeCartItem({
      menuItemId: "a",
      basePrice: 10,
      supplements: [
        { id: "s1", label: "Sauce", price: 2 },
        { id: "s2", label: "Extra", price: 3 },
      ],
    });
    expect(itemUnitPrice(item)).toBe(15);
  });

  it("adds option selection prices with quantities", () => {
    const item = makeCartItem({
      menuItemId: "a",
      basePrice: 10,
      optionSelections: [
        {
          groupKey: "sides",
          groupLabel: "Accompagnements",
          choices: [
            { key: "frites", label: "Frites", price: 0, quantity: 1 },
            { key: "salade", label: "Salade", price: 2, quantity: 2 },
          ],
        },
      ],
    });
    expect(itemUnitPrice(item)).toBe(14);
  });

  it("combines supplements and options", () => {
    const item = makeCartItem({
      menuItemId: "a",
      basePrice: 20,
      supplements: [{ id: "s1", label: "Flambadou", price: 5 }],
      optionSelections: [
        {
          groupKey: "sides",
          groupLabel: "Accompagnements",
          choices: [{ key: "frites", label: "Frites", price: 3, quantity: 1 }],
        },
      ],
    });
    expect(itemUnitPrice(item)).toBe(28);
  });
});

describe("calculateDeliveryDiscount", () => {
  it("applies 10% discount to eligible items", () => {
    const items = [
      makeCartItem({ menuItemId: "steak", basePrice: 20, quantity: 1, categorySlug: "viandes" }),
    ];
    const discount = calculateDeliveryDiscount(items, 10);
    expect(discount).toBe(2);
  });

  it("excludes boissons from discount", () => {
    const items = [
      makeCartItem({ menuItemId: "steak", basePrice: 20, quantity: 1, categorySlug: "viandes" }),
      makeCartItem({ menuItemId: "cola", basePrice: 3, quantity: 2, categorySlug: "boissons" }),
    ];
    const discount = calculateDeliveryDiscount(items, 10);
    expect(discount).toBe(2);
  });

  it("excludes desserts from discount", () => {
    const items = [
      makeCartItem({ menuItemId: "steak", basePrice: 20, quantity: 1, categorySlug: "viandes" }),
      makeCartItem({ menuItemId: "mousse", basePrice: 7, quantity: 1, categorySlug: "desserts" }),
    ];
    const discount = calculateDeliveryDiscount(items, 10);
    expect(discount).toBe(2);
  });

  it("excludes boissons-livraison from discount", () => {
    const items = [
      makeCartItem({ menuItemId: "eau", basePrice: 2, quantity: 1, categorySlug: "boissons-livraison" }),
    ];
    const discount = calculateDeliveryDiscount(items, 10);
    expect(discount).toBe(0);
  });

  it("handles multiple quantities", () => {
    const items = [
      makeCartItem({ menuItemId: "steak", basePrice: 20, quantity: 3, categorySlug: "viandes" }),
    ];
    const discount = calculateDeliveryDiscount(items, 10);
    expect(discount).toBe(6);
  });

  it("rounds each unit to 5 cents before computing total", () => {
    const items = [
      makeCartItem({ menuItemId: "a", basePrice: 13, quantity: 1, categorySlug: "viandes" }),
    ];
    const discount = calculateDeliveryDiscount(items, 10);
    const discountedUnit = roundTo5Cents(13 * 0.9);
    expect(discount).toBe(parseFloat((13 - discountedUnit).toFixed(2)));
  });

  it("returns 0 for empty items", () => {
    expect(calculateDeliveryDiscount([], 10)).toBe(0);
  });

  it("returns 0 for 0% discount", () => {
    const items = [
      makeCartItem({ menuItemId: "steak", basePrice: 20, quantity: 1, categorySlug: "viandes" }),
    ];
    expect(calculateDeliveryDiscount(items, 0)).toBe(0);
  });

  it("allows custom excluded slugs", () => {
    const items = [
      makeCartItem({ menuItemId: "steak", basePrice: 20, quantity: 1, categorySlug: "viandes" }),
      makeCartItem({ menuItemId: "cola", basePrice: 3, quantity: 1, categorySlug: "boissons" }),
    ];
    const discount = calculateDeliveryDiscount(items, 10, ["viandes"]);
    expect(discount).toBeCloseTo(0.3, 2);
  });

  it("includes items with no categorySlug in discount", () => {
    const items = [
      makeCartItem({ menuItemId: "special", basePrice: 10, quantity: 1 }),
    ];
    const discount = calculateDeliveryDiscount(items, 10);
    expect(discount).toBe(1);
  });
});
