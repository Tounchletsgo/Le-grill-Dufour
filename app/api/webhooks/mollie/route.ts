import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const paymentId = formData.get("id") as string;

    if (!paymentId) {
      return NextResponse.json({ error: "Missing payment id" }, { status: 400 });
    }

    const { getMollieClient } = await import("@/lib/mollie");
    const client = getMollieClient();
    if (!client) {
      return NextResponse.json({ error: "Mollie not configured" }, { status: 500 });
    }

    const payment = await client.payments.get(paymentId);
    const metadata = payment.metadata as { order_id: string; order_number: string };

    if (!metadata?.order_id) {
      return NextResponse.json({ error: "Missing order metadata" }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("Mollie webhook: Supabase not configured, skipping DB update");
      return NextResponse.json({ received: true });
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const status = payment.status;

    if (status === "paid") {
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          mollie_payment_id: paymentId,
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        } as any)
        .eq("id", metadata.order_id);
    } else if (status === "failed" || status === "expired" || status === "canceled") {
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "pending",
          mollie_payment_id: paymentId,
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        } as any)
        .eq("id", metadata.order_id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mollie webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
