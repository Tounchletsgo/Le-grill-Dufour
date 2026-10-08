import { describe, it, expect } from "vitest";
import { resolveLocaleFromPath, localizedHref, routeMap } from "../types";

describe("resolveLocaleFromPath", () => {
  it("returns fr for root path", () => {
    const result = resolveLocaleFromPath("/");
    expect(result).toEqual({ locale: "fr", canonicalRoute: "/" });
  });

  it("returns fr for French routes", () => {
    expect(resolveLocaleFromPath("/la-carte")).toEqual({
      locale: "fr",
      canonicalRoute: "/la-carte",
    });
    expect(resolveLocaleFromPath("/commander")).toEqual({
      locale: "fr",
      canonicalRoute: "/commander",
    });
  });

  it("returns nl for Dutch homepage", () => {
    expect(resolveLocaleFromPath("/nl")).toEqual({
      locale: "nl",
      canonicalRoute: "/",
    });
  });

  it("resolves known Dutch routes to their French canonical", () => {
    expect(resolveLocaleFromPath("/nl/de-kaart")).toEqual({
      locale: "nl",
      canonicalRoute: "/la-carte",
    });
    expect(resolveLocaleFromPath("/nl/bestellen")).toEqual({
      locale: "nl",
      canonicalRoute: "/commander",
    });
    expect(resolveLocaleFromPath("/nl/bestellen/afrekenen")).toEqual({
      locale: "nl",
      canonicalRoute: "/commander/checkout",
    });
  });

  it("resolves all routes in routeMap", () => {
    for (const [frRoute, map] of Object.entries(routeMap)) {
      const nlPath = map.nl;
      const result = resolveLocaleFromPath(nlPath);
      expect(result.locale).toBe("nl");
      expect(result.canonicalRoute).toBe(frRoute);
    }
  });

  it("handles /nl/commande/ dynamic routes", () => {
    expect(resolveLocaleFromPath("/nl/commande/abc-123")).toEqual({
      locale: "nl",
      canonicalRoute: "/commande/abc-123",
    });
  });

  it("handles /nl/feedback/ dynamic routes", () => {
    expect(resolveLocaleFromPath("/nl/feedback/abc-123")).toEqual({
      locale: "nl",
      canonicalRoute: "/feedback/abc-123",
    });
  });

  it("strips /nl prefix for unknown Dutch routes", () => {
    expect(resolveLocaleFromPath("/nl/unknown-page")).toEqual({
      locale: "nl",
      canonicalRoute: "/unknown-page",
    });
  });

  it("returns fr for French dynamic routes", () => {
    expect(resolveLocaleFromPath("/commande/abc-123")).toEqual({
      locale: "fr",
      canonicalRoute: "/commande/abc-123",
    });
  });
});

describe("localizedHref", () => {
  it("returns French route unchanged for fr locale", () => {
    expect(localizedHref("/la-carte", "fr")).toBe("/la-carte");
    expect(localizedHref("/commander", "fr")).toBe("/commander");
    expect(localizedHref("/", "fr")).toBe("/");
  });

  it("returns Dutch route from routeMap for nl locale", () => {
    expect(localizedHref("/la-carte", "nl")).toBe("/nl/de-kaart");
    expect(localizedHref("/commander", "nl")).toBe("/nl/bestellen");
    expect(localizedHref("/", "nl")).toBe("/nl");
  });

  it("maps all routeMap entries correctly", () => {
    for (const [frRoute, map] of Object.entries(routeMap)) {
      expect(localizedHref(frRoute, "nl")).toBe(map.nl);
    }
  });

  it("prefixes /nl for /commande/ dynamic routes", () => {
    expect(localizedHref("/commande/abc-123", "nl")).toBe("/nl/commande/abc-123");
  });

  it("prefixes /nl for /feedback/ dynamic routes", () => {
    expect(localizedHref("/feedback/abc-123", "nl")).toBe("/nl/feedback/abc-123");
  });

  it("prefixes /nl for unknown routes", () => {
    expect(localizedHref("/some-page", "nl")).toBe("/nl/some-page");
  });
});
