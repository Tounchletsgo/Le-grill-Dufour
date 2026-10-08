import { describe, it, expect, beforeEach, vi } from "vitest";

vi.stubEnv("ADMIN_PIN", "1234");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");

import { checkAdminPin } from "../auth";

describe("checkAdminPin", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_PIN", "1234");
  });

  it("accepts correct PIN", () => {
    const result = checkAdminPin("1234", "10.0.0.1");
    expect(result).toEqual({ valid: true });
  });

  it("rejects incorrect PIN", () => {
    const result = checkAdminPin("9999", "10.0.0.2");
    expect(result).toEqual({ valid: false, error: "PIN incorrect" });
  });

  it("rejects null PIN", () => {
    const result = checkAdminPin(null, "10.0.0.3");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("manquante");
  });

  it("rejects when ADMIN_PIN is not set", () => {
    vi.stubEnv("ADMIN_PIN", "");
    const result = checkAdminPin("1234", "10.0.0.4");
    expect(result.valid).toBe(false);
  });

  it("blocks after 5 failed attempts from the same IP", () => {
    const ip = "10.0.0.100";
    for (let i = 0; i < 5; i++) {
      checkAdminPin("wrong", ip);
    }
    const blocked = checkAdminPin("1234", ip);
    expect(blocked.valid).toBe(false);
    expect(blocked.error).toContain("Trop de tentatives");
  });

  it("does not block different IPs", () => {
    for (let i = 0; i < 5; i++) {
      checkAdminPin("wrong", "10.0.0.200");
    }
    const result = checkAdminPin("1234", "10.0.0.201");
    expect(result).toEqual({ valid: true });
  });

  it("resets attempts on successful login", () => {
    const ip = "10.0.0.300";
    for (let i = 0; i < 3; i++) {
      checkAdminPin("wrong", ip);
    }
    checkAdminPin("1234", ip);
    for (let i = 0; i < 4; i++) {
      checkAdminPin("wrong", ip);
    }
    const result = checkAdminPin("1234", ip);
    expect(result).toEqual({ valid: true });
  });

  it("returns minutes remaining when blocked", () => {
    const ip = "10.0.0.400";
    for (let i = 0; i < 5; i++) {
      checkAdminPin("wrong", ip);
    }
    const result = checkAdminPin("1234", ip);
    expect(result.error).toMatch(/\d+ min/);
  });
});
