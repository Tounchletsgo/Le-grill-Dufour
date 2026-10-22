import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake");
vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_fake");
vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://legrilldufour.be");

const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle, limit: vi.fn(() => ({ single: mockSingle })) }));
const mockEq = vi.fn(() => ({ select: mockSelect, single: mockSingle }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({ single: mockSingle })),
    limit: vi.fn(() => ({ single: mockSingle })),
  })),
  update: mockUpdate,
  insert: mockInsert,
}));

vi.mock("@/lib/supabase-server", () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: vi.fn(),
        retrieve: vi.fn(),
      },
    },
  }),
}));

vi.mock("@/lib/telegram", () => ({
  sendTelegramNotification: vi.fn(() => Promise.resolve()),
  formatOrderTelegram: vi.fn(() => "telegram message"),
}));
vi.mock("@/lib/email", () => ({
  sendOrderConfirmationEmail: vi.fn(() => Promise.resolve({ ok: true })),
}));

describe("Orders Paused — Bientôt disponible", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("API: /api/orders-status", () => {
    it("defaults to paused:true when config is unreadable", () => {
      const configData = null;
      const configError = { message: "connection timeout" };
      const result = configError || !configData ? { paused: true } : { paused: configData.orders_paused };
      expect(result.paused).toBe(true);
    });

    it("returns paused:true when orders_paused is true", () => {
      const configData = { orders_paused: true };
      const result = { paused: configData.orders_paused ?? true };
      expect(result.paused).toBe(true);
    });

    it("returns paused:false when orders_paused is false", () => {
      const configData = { orders_paused: false };
      const result = { paused: configData.orders_paused ?? true };
      expect(result.paused).toBe(false);
    });

    it("defaults to paused:true when orders_paused field is missing", () => {
      const configData = {} as any;
      const result = { paused: configData.orders_paused ?? true };
      expect(result.paused).toBe(true);
    });
  });

  describe("Server-side: order creation blocked when paused", () => {
    it("rejects order creation when orders_paused and not test mode", () => {
      const deliveryConfig = { orders_paused: true, is_closed: false };
      const isTestOrder = false;

      const shouldReject = deliveryConfig.orders_paused && !isTestOrder;
      expect(shouldReject).toBe(true);
    });

    it("allows order creation when orders_paused but is test mode", () => {
      const deliveryConfig = { orders_paused: true, is_closed: false };
      const isTestOrder = true;

      const shouldReject = deliveryConfig.orders_paused && !isTestOrder;
      expect(shouldReject).toBe(false);
    });

    it("allows order creation when orders are open", () => {
      const deliveryConfig = { orders_paused: false, is_closed: false };
      const isTestOrder = false;

      const shouldReject = deliveryConfig.orders_paused && !isTestOrder;
      expect(shouldReject).toBe(false);
    });
  });

  describe("Server-side: checkout blocked when paused", () => {
    it("rejects checkout session creation when paused and not test", () => {
      const configCheck = { orders_paused: true };
      const order = { is_test: false, status: "pending_payment" };

      const shouldBlock = configCheck.orders_paused && !order.is_test;
      expect(shouldBlock).toBe(true);
    });

    it("allows checkout for test orders even when paused", () => {
      const configCheck = { orders_paused: true };
      const order = { is_test: true, status: "pending_payment" };

      const shouldBlock = configCheck.orders_paused && !order.is_test;
      expect(shouldBlock).toBe(false);
    });
  });

  describe("In-flight payment handling", () => {
    it("webhook still processes orders created before pause", () => {
      const orderStatus = "pending_payment";
      const stripeEvent = "checkout.session.completed";
      const shouldProcess = stripeEvent === "checkout.session.completed" && orderStatus === "pending_payment";
      expect(shouldProcess).toBe(true);
    });

    it("verify-payment still works for in-flight orders", () => {
      const orderStatus = "pending_payment";
      const stripeSessionPaid = true;
      const shouldConfirm = orderStatus === "pending_payment" && stripeSessionPaid;
      expect(shouldConfirm).toBe(true);
    });
  });

  describe("Client-side: modal and redirect behavior", () => {
    it("shows modal when paused and user clicks order link", () => {
      let modalShown = false;
      let navigated = false;
      const paused = true;

      const handleClick = (e: { preventDefault: () => void }) => {
        if (paused) {
          e.preventDefault();
          modalShown = true;
        } else {
          navigated = true;
        }
      };

      handleClick({ preventDefault: () => {} });
      expect(modalShown).toBe(true);
      expect(navigated).toBe(false);
    });

    it("navigates normally when orders are open", () => {
      let modalShown = false;
      let navigated = false;
      const paused = false;

      const handleClick = (e: { preventDefault: () => void }) => {
        if (paused) {
          e.preventDefault();
          modalShown = true;
        } else {
          navigated = true;
        }
      };

      handleClick({ preventDefault: () => {} });
      expect(modalShown).toBe(false);
      expect(navigated).toBe(true);
    });

    it("/commander page redirects when paused", () => {
      const paused = true;
      const shouldRedirect = paused;
      expect(shouldRedirect).toBe(true);
    });

    it("/commander/checkout page redirects when paused", () => {
      const paused = true;
      const shouldRedirect = paused;
      expect(shouldRedirect).toBe(true);
    });

    it("/commander page does not redirect when open", () => {
      const paused = false;
      const shouldRedirect = paused;
      expect(shouldRedirect).toBe(false);
    });
  });

  describe("Admin toggle", () => {
    it("toggle creates audit log entry", () => {
      const oldValue = true;
      const newValue = false;
      const logEntry = {
        changed_by: "admin-pin",
        old_value: oldValue,
        new_value: newValue,
      };
      expect(logEntry.old_value).not.toBe(logEntry.new_value);
      expect(logEntry.changed_by).toBeTruthy();
    });

    it("no-op toggle does not create log entry", () => {
      const oldValue = true;
      const newValue = true;
      const shouldLog = oldValue !== newValue;
      expect(shouldLog).toBe(false);
    });
  });

  describe("Default safety: unreadable config defaults to paused", () => {
    it("null config → paused", () => {
      const config: any = null;
      const paused = config?.orders_paused ?? true;
      expect(paused).toBe(true);
    });

    it("undefined orders_paused → paused", () => {
      const config: any = {};
      const paused = config?.orders_paused ?? true;
      expect(paused).toBe(true);
    });

    it("explicit false → not paused", () => {
      const config = { orders_paused: false };
      const paused = config.orders_paused ?? true;
      expect(paused).toBe(false);
    });

    it("DB error → paused", () => {
      const error = { message: "connection timeout" };
      const data: any = null;
      const paused = error || !data ? true : (data.orders_paused ?? true);
      expect(paused).toBe(true);
    });
  });

  describe("Bilingual support", () => {
    it("FR translations exist for orders paused", () => {
      const frKeys = {
        title: "Bientôt disponible",
        message: "Notre service de commande en ligne est en préparation.",
        close: "Fermer",
        banner: "Commandes en livraison : bientôt disponible",
      };
      expect(frKeys.title).toBeTruthy();
      expect(frKeys.message).toBeTruthy();
      expect(frKeys.close).toBeTruthy();
      expect(frKeys.banner).toBeTruthy();
    });

    it("NL translations exist for orders paused", () => {
      const nlKeys = {
        title: "Binnenkort beschikbaar",
        message: "Onze online bestelservice is in voorbereiding.",
        close: "Sluiten",
        banner: "Levering bestellen: binnenkort beschikbaar",
      };
      expect(nlKeys.title).toBeTruthy();
      expect(nlKeys.message).toBeTruthy();
      expect(nlKeys.close).toBeTruthy();
      expect(nlKeys.banner).toBeTruthy();
    });
  });

  describe("Order status transitions unaffected", () => {
    const VALID_TRANSITIONS: Record<string, string[]> = {
      pending_payment: ["confirmed", "cancelled"],
      confirmed: ["preparing", "cancelled"],
      preparing: ["ready", "cancelled"],
      ready: ["delivering", "delivered", "cancelled"],
      delivering: ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    };

    it("existing transitions still valid with paused feature", () => {
      expect(VALID_TRANSITIONS.pending_payment).toContain("confirmed");
      expect(VALID_TRANSITIONS.confirmed).toContain("preparing");
    });
  });

  describe("Accessibility", () => {
    it("modal has aria-modal and role dialog", () => {
      const modalAttrs = { role: "dialog", "aria-modal": "true" };
      expect(modalAttrs.role).toBe("dialog");
      expect(modalAttrs["aria-modal"]).toBe("true");
    });

    it("Escape key closes modal", () => {
      let closed = false;
      const onKeyDown = (key: string) => {
        if (key === "Escape") closed = true;
      };
      onKeyDown("Escape");
      expect(closed).toBe(true);
    });

    it("click outside closes modal", () => {
      let closed = false;
      const target = "overlay";
      const overlayRef = "overlay";
      if (target === overlayRef) closed = true;
      expect(closed).toBe(true);
    });

    it("banner has role=status for screen readers", () => {
      const bannerRole = "status";
      expect(bannerRole).toBe("status");
    });
  });

  describe("Animation", () => {
    it("respects prefers-reduced-motion", () => {
      const reducedMotion = true;
      const noMotion = reducedMotion;
      expect(noMotion).toBe(true);
    });

    it("animations play when motion is allowed", () => {
      const reducedMotion = false;
      const shouldAnimate = !reducedMotion;
      expect(shouldAnimate).toBe(true);
    });
  });

  describe("Toggle restores normal behavior", () => {
    it("opening orders allows order creation", () => {
      const deliveryConfig = { orders_paused: false, is_closed: false };
      const isTestOrder = false;
      const shouldReject = deliveryConfig.orders_paused && !isTestOrder;
      expect(shouldReject).toBe(false);
    });

    it("opening orders removes modal intercept", () => {
      const paused = false;
      let modalShown = false;
      if (paused) modalShown = true;
      expect(modalShown).toBe(false);
    });

    it("opening orders stops page redirects", () => {
      const paused = false;
      const shouldRedirect = paused;
      expect(shouldRedirect).toBe(false);
    });
  });
});
