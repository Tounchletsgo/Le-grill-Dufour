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

      // Send notifications after successful payment
      const { data: fullOrder } = await supabaseAdmin
        .from("orders")
        .select("order_number, mode, customer_name, customer_phone, customer_email, delivery_address, delivery_city, total, subtotal, delivery_fee, payment_method, notes, order_items(name, quantity, variant_label, total_price)")
        .eq("id", metadata.order_id)
        .single();

      if (fullOrder) {
        const { sendTelegramNotification, formatOrderTelegram } = await import("@/lib/telegram");
        const { sendOrderConfirmationEmail } = await import("@/lib/email");

        const telegramMsg = formatOrderTelegram({
          order_number: fullOrder.order_number,
          mode: fullOrder.mode,
          customer_name: fullOrder.customer_name,
          customer_phone: fullOrder.customer_phone,
          delivery_address: fullOrder.delivery_address,
          delivery_city: fullOrder.delivery_city,
          total: fullOrder.total,
          payment_method: fullOrder.payment_method,
          notes: fullOrder.notes,
          items: fullOrder.order_items || [],
        });
        sendTelegramNotification(telegramMsg).catch(() => {});

        if (fullOrder.customer_email) {
          sendOrderConfirmationEmail({
            to: fullOrder.customer_email,
            orderNumber: fullOrder.order_number,
            customerName: fullOrder.customer_name,
            mode: fullOrder.mode,
            items: fullOrder.order_items || [],
            subtotal: fullOrder.subtotal,
            deliveryFee: fullOrder.delivery_fee,
            total: fullOrder.total,
          }).catch(() => {});
        }
      }
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
