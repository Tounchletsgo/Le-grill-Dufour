import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { sendTelegramNotification, formatOrderTelegram } from "@/lib/telegram";
import { sendOrderConfirmationEmail, type OrderItemEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;

    if (!orderId) {
      console.error("Webhook: no order_id in metadata");
      return NextResponse.json({ received: true });
    }

    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Supabase not configured for webhook");
        return NextResponse.json({ error: "DB not configured" }, { status: 500 });
      }

      const { supabaseAdmin } = await import("@/lib/supabase-server");

      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, status, order_number, mode, customer_name, customer_phone, customer_email, delivery_address, house_number, delivery_postal, delivery_city, payment_method, notes, subtotal, delivery_fee, discount_amount, total, locale")
        .eq("id", orderId)
        .single();

      if (!order) {
        console.error("Webhook: order not found:", orderId);
        return NextResponse.json({ received: true });
      }

      if (order.status !== "pending_payment") {
        return NextResponse.json({ received: true });
      }

      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          status: "confirmed",
          payment_status: "paid",
          payment_method: "online",
          stripe_payment_intent_id: session.payment_intent || null,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Webhook: order update failed:", updateError);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }

      const { data: orderItems } = await supabaseAdmin
        .from("order_items")
        .select("name, quantity, variant_label, unit_price, total_price, doneness_label, order_item_supplements(label, price)")
        .eq("order_id", orderId);

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
          trackingUrl,
          locale: (order as any).locale === "nl" ? "nl" : "fr",
        }).then(async (result) => {
          if (!result.ok) console.error("Webhook email failed:", result.error);
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

    } catch (err) {
      console.error("Webhook processing error:", err);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
