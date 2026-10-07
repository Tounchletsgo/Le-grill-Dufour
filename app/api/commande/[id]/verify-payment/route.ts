import { NextRequest, NextResponse } from "next/server";
import type { OrderItemEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const { getStripe } = await import("@/lib/stripe");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, status, stripe_session_id, order_number, mode, customer_name, customer_phone, customer_email, delivery_address, house_number, delivery_postal, delivery_city, payment_method, notes, subtotal, delivery_fee, discount_amount, total, locale")
      .eq("id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending_payment") {
      return NextResponse.json({ status: order.status, already_confirmed: true });
    }

    if (!order.stripe_session_id) {
      return NextResponse.json({ error: "No Stripe session" }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ status: "pending_payment", payment_status: session.payment_status });
    }

    let configMinTime = 20;
    let configMaxTime = 60;
    let discountPercentage: number | undefined;

    const { data: deliveryConfigData } = await supabaseAdmin
      .from("delivery_config")
      .select("delivery_min_time, delivery_max_time, discount_active, discount_percentage")
      .limit(1)
      .single();

    if (deliveryConfigData) {
      configMinTime = deliveryConfigData.delivery_min_time ?? 20;
      configMaxTime = deliveryConfigData.delivery_max_time ?? 60;
      if (deliveryConfigData.discount_active) {
        discountPercentage = deliveryConfigData.discount_percentage;
      }
    }

    const isStripeLive = session.livemode === true;

    const updatePayload: Record<string, unknown> = {
      status: "confirmed",
      payment_status: "paid",
      payment_method: "online",
      stripe_payment_intent_id: (session.payment_intent as string) || null,
      confirmed_at: new Date().toISOString(),
      ...(isStripeLive ? {} : { is_test: true }),
    };

    if (order.mode === "delivery" && order.delivery_address) {
      try {
        const { calculateETA } = await import("@/lib/eta");
        const streetName = order.house_number
          ? order.delivery_address.replace(order.house_number, "").trim()
          : order.delivery_address;
        const eta = await calculateETA({
          streetName,
          postalCode: order.delivery_postal || undefined,
          prepMinutes: configMinTime,
        });
        updatePayload.estimated_delivery_at = new Date(Date.now() + eta.totalMinutes * 60_000).toISOString();
      } catch {}
    }

    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .eq("status", "pending_payment")
      .select("id");

    if (updateError) {
      console.error("verify-payment: update failed:", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json({ status: "confirmed", already_confirmed: true });
    }

    console.log("verify-payment: order", orderId, "confirmed via fallback");

    const { data: orderItems } = await supabaseAdmin
      .from("order_items")
      .select("name, quantity, variant_label, unit_price, total_price, doneness_label, order_item_supplements(label, price)")
      .eq("order_id", orderId);

    const { sendTelegramNotification, formatOrderTelegram } = await import("@/lib/telegram");
    const { sendOrderConfirmationEmail } = await import("@/lib/email");

    const notifItems: OrderItemEmail[] = (orderItems || []).map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      variant_label: item.variant_label,
      total_price: item.total_price,
      doneness_label: item.doneness_label,
      supplements: item.order_item_supplements?.length
        ? item.order_item_supplements.map((s: any) => ({ label: s.label, price: s.price }))
        : undefined,
    }));

    const telegramMsg = formatOrderTelegram({
      order_number: order.order_number,
      mode: order.mode,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      delivery_address: order.delivery_address,
      delivery_city: order.delivery_city,
      total: order.total,
      payment_method: "online",
      notes: order.notes,
      items: notifItems,
      discount_amount: order.discount_amount,
    });
    sendTelegramNotification(telegramMsg).catch(() => {});

    if (order.customer_email) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
      const trackingUrl = `${baseUrl}/commande/${orderId}`;

      sendOrderConfirmationEmail({
        to: order.customer_email,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        mode: order.mode,
        paymentMethod: "online",
        items: notifItems,
        subtotal: order.subtotal,
        deliveryFee: order.delivery_fee,
        discountAmount: order.discount_amount,
        discountPercentage,
        total: order.total,
        deliveryAddress: order.delivery_address || undefined,
        houseNumber: order.house_number || undefined,
        deliveryPostal: order.delivery_postal || undefined,
        deliveryCity: order.delivery_city || undefined,
        deliveryMinTime: configMinTime,
        deliveryMaxTime: configMaxTime,
        estimatedArrivalAt: (updatePayload.estimated_delivery_at as string) || undefined,
        trackingUrl,
        locale: (order as any).locale === "nl" ? "nl" : "fr",
      }).then(async (result) => {
        if (!result.ok) console.error("verify-payment email failed:", result.error);
        try {
          const { supabaseAdmin: sa } = await import("@/lib/supabase-server");
          await sa.from("email_queue").insert({
            order_id: orderId,
            email_type: "confirmation",
            recipient: order.customer_email,
            status: result.ok ? "sent" : "failed",
            last_error: result.error || null,
            attempts: 1,
            sent_at: result.ok ? new Date().toISOString() : null,
            scheduled_at: new Date().toISOString(),
          });
        } catch {}
      }).catch(() => {});
    }

    return NextResponse.json({ status: "confirmed", confirmed: true });
  } catch (err) {
    console.error("verify-payment error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
