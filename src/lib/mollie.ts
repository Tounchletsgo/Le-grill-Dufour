import createMollieClient from "@mollie/api-client";

let mollieClient: ReturnType<typeof createMollieClient> | null = null;

export function getMollieClient() {
  if (!process.env.MOLLIE_API_KEY) return null;
  if (!mollieClient) {
    mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
  }
  return mollieClient;
}

export interface CreatePaymentParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  description: string;
  redirectUrl: string;
  customerEmail?: string;
}

export async function createPayment(params: CreatePaymentParams) {
  const client = getMollieClient();
  if (!client) throw new Error("Mollie non configuré.");

  const payment = await client.payments.create({
    amount: {
      currency: "EUR",
      value: params.amount.toFixed(2),
    },
    description: params.description,
    redirectUrl: params.redirectUrl,
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mollie`,
    metadata: {
      order_id: params.orderId,
      order_number: params.orderNumber,
    },
    method: ["bancontact", "creditcard"] as any,
  });

  return {
    paymentId: payment.id,
    checkoutUrl: payment.getCheckoutUrl(),
  };
}
