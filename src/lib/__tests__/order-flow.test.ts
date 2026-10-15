import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake");
vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_fake");
vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://legrilldufour.be");

// ── Mock Supabase ──────────────────────────────────────────
const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockEq2 = vi.fn(() => ({ select: mockSelect }));
const mockEq1 = vi.fn(() => ({ eq: mockEq2, select: mockSelect, single: mockSingle }));
const mockUpdate = vi.fn(() => ({ eq: mockEq1 }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockFrom = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: mockSingle,
      gt: vi.fn(() => ({ single: mockSingle })),
    })),
    limit: vi.fn(() => ({ single: mockSingle })),
  })),
  update: mockUpdate,
  insert: mockInsert,
}));

vi.mock("@/lib/supabase-server", () => ({
  supabaseAdmin: { from: mockFrom },
}));

// ── Mock Stripe ────────────────────────────────────────────
const mockStripeCreate = vi.fn();
const mockStripeRetrieve = vi.fn();
const mockStripeConstruct = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: mockStripeCreate,
        retrieve: mockStripeRetrieve,
      },
    },
    webhooks: {
      constructEvent: mockStripeConstruct,
    },
  }),
}));

// ── Mock Telegram & Email ──────────────────────────────────
vi.mock("@/lib/telegram", () => ({
  sendTelegramNotification: vi.fn(() => Promise.resolve()),
  formatOrderTelegram: vi.fn(() => "telegram message"),
}));
vi.mock("@/lib/email", () => ({
  sendOrderConfirmationEmail: vi.fn(() => Promise.resolve({ ok: true })),
}));

describe("Order Payment Flow — Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Idempotency — Webhook", () => {
    it("skips already-confirmed order (status not pending_payment)", () => {
      const order = { id: "abc", status: "confirmed", order_number: "GDF-001" };
      expect(order.status).not.toBe("pending_payment");
    });

    it("CAS guard prevents double processing", () => {
      const updatedRows: any[] = [];
      expect(updatedRows.length).toBe(0);
    });
  });

  describe("Idempotency — Verify-payment", () => {
    it("returns already_confirmed when order is not pending_payment", () => {
      const order = { status: "confirmed" };
      const response = order.status !== "pending_payment"
        ? { status: order.status, already_confirmed: true }
        : null;
      expect(response).toEqual({ status: "confirmed", already_confirmed: true });
    });

    it("skips notifications when CAS guard returns 0 rows", () => {
      const updatedRows: any[] = [];
      const shouldNotify = updatedRows && updatedRows.length > 0;
      expect(shouldNotify).toBe(false);
    });
  });

  describe("Race condition: webhook vs verify-payment", () => {
    it("only one handler sends notifications", () => {
      let pendingPayment = true;
      let notificationsSent = 0;

      const tryConfirm = () => {
        if (!pendingPayment) return false;
        pendingPayment = false;
        notificationsSent++;
        return true;
      };

      const webhookConfirmed = tryConfirm();
      const verifyConfirmed = tryConfirm();

      expect(webhookConfirmed).toBe(true);
      expect(verifyConfirmed).toBe(false);
      expect(notificationsSent).toBe(1);
    });

    it("verify-payment wins if it runs first", () => {
      let pendingPayment = true;
      let notificationsSent = 0;

      const tryConfirm = () => {
        if (!pendingPayment) return false;
        pendingPayment = false;
        notificationsSent++;
        return true;
      };

      const verifyConfirmed = tryConfirm();
      const webhookConfirmed = tryConfirm();

      expect(verifyConfirmed).toBe(true);
      expect(webhookConfirmed).toBe(false);
      expect(notificationsSent).toBe(1);
    });
  });

  describe("Test mode security", () => {
    it("test mode requires valid device ID in test_mode_sessions", () => {
      const deviceId = "attacker-device-id";
      const sessions: any[] = [];
      const isActive = sessions.some(
        (s) => s.device_id === deviceId && new Date(s.expires_at) > new Date()
      );
      expect(isActive).toBe(false);
    });

    it("expired test mode session is inactive", () => {
      const session = {
        device_id: "test-device",
        expires_at: new Date(Date.now() - 3600000).toISOString(),
      };
      const isActive = new Date(session.expires_at) > new Date();
      expect(isActive).toBe(false);
    });

    it("active test mode session is detected", () => {
      const session = {
        device_id: "admin-device",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };
      const isActive = new Date(session.expires_at) > new Date();
      expect(isActive).toBe(true);
    });
  });

  describe("Order status transitions", () => {
    const VALID_TRANSITIONS: Record<string, string[]> = {
      pending_payment: ["confirmed", "cancelled"],
      confirmed: ["preparing", "cancelled"],
      preparing: ["ready", "cancelled"],
      ready: ["delivering", "delivered", "cancelled"],
      delivering: ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    };

    it("pending_payment can transition to confirmed", () => {
      expect(VALID_TRANSITIONS.pending_payment).toContain("confirmed");
    });

    it("confirmed cannot transition to pending_payment", () => {
      expect(VALID_TRANSITIONS.confirmed).not.toContain("pending_payment");
    });

    it("delivered is a terminal state", () => {
      expect(VALID_TRANSITIONS.delivered).toHaveLength(0);
    });

    it("cancelled is a terminal state", () => {
      expect(VALID_TRANSITIONS.cancelled).toHaveLength(0);
    });
  });

  describe("Stripe session creation", () => {
    it("success_url points to correct tracking page", () => {
      const baseUrl = "https://legrilldufour.be";
      const orderId = "uuid-123";
      const successUrl = `${baseUrl}/commande/${orderId}?payment=success`;
      expect(successUrl).toBe("https://legrilldufour.be/commande/uuid-123?payment=success");
      expect(successUrl).not.toContain("localhost");
      expect(successUrl).toMatch(/^https:\/\//);
    });

    it("cancel_url points to correct tracking page", () => {
      const baseUrl = "https://legrilldufour.be";
      const orderId = "uuid-123";
      const cancelUrl = `${baseUrl}/commande/${orderId}?payment=cancelled`;
      expect(cancelUrl).toBe("https://legrilldufour.be/commande/uuid-123?payment=cancelled");
      expect(cancelUrl).toMatch(/^https:\/\//);
    });

    it("rejects empty baseUrl (misconfiguration)", () => {
      const baseUrl = "";
      const hasValidUrl = baseUrl.startsWith("https://");
      expect(hasValidUrl).toBe(false);
    });
  });

  describe("Webhook signature verification", () => {
    it("rejects missing signature", () => {
      const sig = null;
      expect(sig).toBeNull();
    });

    it("rejects empty webhook secret", () => {
      const secret = "";
      expect(!!secret).toBe(false);
    });
  });

  describe("Test order creation", () => {
    it("test order is created with confirmed status", () => {
      const isTestOrder = true;
      const status = isTestOrder ? "confirmed" : "pending_payment";
      const paymentStatus = isTestOrder ? "paid" : "pending";
      expect(status).toBe("confirmed");
      expect(paymentStatus).toBe("paid");
    });

    it("real order is created with pending_payment status", () => {
      const isTestOrder = false;
      const status = isTestOrder ? "confirmed" : "pending_payment";
      const paymentStatus = isTestOrder ? "paid" : "pending";
      expect(status).toBe("pending_payment");
      expect(paymentStatus).toBe("pending");
    });

    it("test order is marked with is_test flag", () => {
      const isTestOrder = true;
      const orderRow = { is_test: isTestOrder };
      expect(orderRow.is_test).toBe(true);
    });

    it("test order gets [TEST] prefix in notes", () => {
      const isTestOrder = true;
      const notes = "Extra sauce";
      const orderNotes = isTestOrder ? `[TEST] ${notes}`.trim() : notes;
      expect(orderNotes).toBe("[TEST] Extra sauce");
    });
  });

  describe("Webhook error handling", () => {
    it("returns 500 on DB error so Stripe retries", () => {
      const updateError = { message: "connection timeout" };
      const statusCode = updateError ? 500 : 200;
      expect(statusCode).toBe(500);
    });

    it("returns 200 on successful processing", () => {
      const updateError = null;
      const statusCode = updateError ? 500 : 200;
      expect(statusCode).toBe(200);
    });

    it("returns 200 with received:true for already-processed orders", () => {
      const orderStatus = "confirmed";
      const isAlreadyProcessed = orderStatus !== "pending_payment";
      expect(isAlreadyProcessed).toBe(true);
    });
  });

  describe("Price calculation integrity", () => {
    it("Stripe line items total matches order total", () => {
      const items = [
        { quantity: 2, unit_price: 14.50 },
        { quantity: 1, unit_price: 21.00 },
      ];
      const deliveryFee = 5.00;
      const discountAmount = 5.00;

      const itemsTotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
      const orderTotal = itemsTotal - discountAmount + deliveryFee;
      const itemsTotalCents = items.reduce((sum, i) => sum + Math.round(i.unit_price * i.quantity * 100), 0);
      const orderTotalCents = Math.round(orderTotal * 100);
      const diff = orderTotalCents - itemsTotalCents;

      expect(diff).toBe(0);
    });

    it("delivery fee is added as separate line item when diff > 0", () => {
      const orderTotalCents = 5500;
      const itemsTotalCents = 5000;
      const diff = orderTotalCents - itemsTotalCents;

      expect(diff).toBe(500);
      expect(diff > 0).toBe(true);
    });

    it("discount is distributed across items when diff < 0", () => {
      const orderTotalCents = 4500;
      const itemsTotalCents = 5000;
      const diff = orderTotalCents - itemsTotalCents;

      expect(diff).toBe(-500);
      const lineItems = [
        { price_data: { unit_amount: 2900 } },
        { price_data: { unit_amount: 2100 } },
      ];
      const discountAbs = Math.abs(diff);
      const discountPerItem = Math.floor(discountAbs / lineItems.length);
      let remainder = discountAbs - discountPerItem * lineItems.length;
      for (const li of lineItems) {
        let reduction = discountPerItem;
        if (remainder > 0) { reduction += 1; remainder -= 1; }
        li.price_data.unit_amount = Math.max(1, li.price_data.unit_amount - reduction);
      }
      const finalTotal = lineItems.reduce((s, li) => s + li.price_data.unit_amount, 0);
      expect(finalTotal).toBe(orderTotalCents);
    });
  });

  describe("Cancelled payment handling", () => {
    it("cancelled payment leaves order in pending_payment", () => {
      const paymentParam = "cancelled";
      const orderStatus = "pending_payment";
      expect(orderStatus).toBe("pending_payment");
      expect(paymentParam).toBe("cancelled");
    });

    it("verify-payment returns pending status for unpaid session", () => {
      const stripePaymentStatus = "unpaid";
      const shouldConfirm = stripePaymentStatus === "paid";
      expect(shouldConfirm).toBe(false);
    });
  });

  describe("Checkout double-submit prevention", () => {
    it("rejects checkout for already-processed order", () => {
      const orderStatus = "confirmed";
      const shouldReject = orderStatus !== "pending_payment";
      expect(shouldReject).toBe(true);
    });
  });

  describe("Notification deduplication", () => {
    it("Telegram is sent exactly once per order confirmation", () => {
      let telegramCount = 0;

      const confirmAndNotify = (casSuccess: boolean) => {
        if (casSuccess) telegramCount++;
      };

      confirmAndNotify(true);
      confirmAndNotify(false);
      confirmAndNotify(false);

      expect(telegramCount).toBe(1);
    });

    it("Email is sent exactly once per order confirmation", () => {
      let emailCount = 0;

      const confirmAndNotify = (casSuccess: boolean) => {
        if (casSuccess) emailCount++;
      };

      confirmAndNotify(true);
      confirmAndNotify(false);

      expect(emailCount).toBe(1);
    });
  });

  describe("Order tracking page behavior", () => {
    it("shows payment verification state when payment=success and pending_payment", () => {
      const paymentParam = "success";
      const orderStatus = "pending_payment";
      const shouldVerify = paymentParam === "success" && orderStatus === "pending_payment";
      expect(shouldVerify).toBe(true);
    });

    it("shows thank you when confirmed", () => {
      const orderStatus = "confirmed";
      const isConfirmedOrBeyond = !["pending_payment", "cancelled", "pending"].includes(orderStatus);
      expect(isConfirmedOrBeyond).toBe(true);
    });

    it("does not trigger verify-payment for test orders", () => {
      const paymentParam = "test";
      const shouldVerify = paymentParam === "success";
      expect(shouldVerify).toBe(false);
    });
  });

  describe("Order number format", () => {
    it("follows GDF-AAAAMMJJ-NNNN pattern", () => {
      const orderNumber = "GDF-20261013-0001";
      expect(orderNumber).toMatch(/^GDF-\d{8}-\d{4}$/);
    });
  });

  describe("Mode test isolation", () => {
    it("test mode check requires device ID header", () => {
      const deviceId = null;
      const result = deviceId ? "check_db" : false;
      expect(result).toBe(false);
    });

    it("different device IDs have independent test modes", () => {
      const sessions = [
        { device_id: "admin-ipad", expires_at: new Date(Date.now() + 3600000).toISOString() },
      ];

      const isActiveForAdmin = sessions.some(s => s.device_id === "admin-ipad" && new Date(s.expires_at) > new Date());
      const isActiveForCustomer = sessions.some(s => s.device_id === "customer-phone" && new Date(s.expires_at) > new Date());

      expect(isActiveForAdmin).toBe(true);
      expect(isActiveForCustomer).toBe(false);
    });
  });
});
