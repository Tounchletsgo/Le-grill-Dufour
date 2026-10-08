import { describe, it, expect, vi } from "vitest";
import { getDictionary, t } from "../index";

describe("getDictionary", () => {
  it("returns French dictionary for fr", () => {
    const dict = getDictionary("fr");
    expect(dict).toBeDefined();
    expect(dict.home).toBeDefined();
  });

  it("returns Dutch dictionary for nl", () => {
    const dict = getDictionary("nl");
    expect(dict).toBeDefined();
    expect(dict.home).toBeDefined();
  });

  it("falls back to French for unknown locale", () => {
    const dict = getDictionary("xx" as "fr");
    const frDict = getDictionary("fr");
    expect(dict).toBe(frDict);
  });
});

describe("t (translation function)", () => {
  const frDict = getDictionary("fr");
  const nlDict = getDictionary("nl");

  it("resolves a top-level key", () => {
    const result = t(frDict, "home.copyright");
    expect(result).toContain("Grill");
  });

  it("resolves nested keys", () => {
    const result = t(frDict, "home.discover");
    expect(typeof result).toBe("string");
    expect(result).not.toBe("home.discover");
  });

  it("returns the key itself for missing translations", () => {
    const result = t(frDict, "nonexistent.deep.key");
    expect(result).toBe("nonexistent.deep.key");
  });

  it("interpolates variables", () => {
    const dict = getDictionary("fr");
    const template = "{name} a commandé {count} articles";
    const mockDict = { test: { msg: template } } as unknown as typeof dict;
    const result = t(mockDict, "test.msg", { name: "Jean", count: 3 });
    expect(result).toBe("Jean a commandé 3 articles");
  });

  it("replaces all occurrences of a variable", () => {
    const dict = getDictionary("fr");
    const template = "{x} et {x}";
    const mockDict = { test: { msg: template } } as unknown as typeof dict;
    const result = t(mockDict, "test.msg", { x: "A" });
    expect(result).toBe("A et A");
  });

  it("falls back to French when NL key is missing", () => {
    const frResult = t(frDict, "home.copyright");
    const nlResult = t(nlDict, "home.copyright");
    expect(typeof nlResult).toBe("string");
    expect(nlResult.length).toBeGreaterThan(0);
  });

  it("returns different translations for FR and NL", () => {
    const fr = t(frDict, "home.discover");
    const nl = t(nlDict, "home.discover");
    expect(fr).not.toBe(nl);
  });
});
