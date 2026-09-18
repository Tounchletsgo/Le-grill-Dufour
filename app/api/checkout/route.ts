import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, total, status, customer_email, customer_name, mode, order_items(name, quantity, unit_price)")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending_payment") {
      return NextResponse.json({ error: "Order already processed" }, { status: 400 });
    }

    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "";

    const lineItems = (order.order_items || []).map((item: any) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: `${item.quantity}x ${item.name}`,
        },
        unit_amount: Math.round(item.unit_price * item.quantity * 100),
      },
      quantity: 1,
    }));

    const itemsTotal = (order.order_items || []).reduce(
      (sum: number, item: any) => sum + Math.round(item.unit_price * item.quantity * 100),
      0
    );
    const orderTotalCents = Math.round(order.total * 100);
    const diff = orderTotalCents - itemsTotal;

    if (diff > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: "Frais de livraison" },
          unit_amount: diff,
        },
        quantity: 1,
      });
    } else if (diff < 0) {
      const discountAbs = Math.abs(diff);
      const discountPerItem = Math.floor(discountAbs / lineItems.length);
      let remainder = discountAbs - discountPerItem * lineItems.length;
      for (const li of lineItems) {
        let reduction = discountPerItem;
        if (remainder > 0) { reduction += 1; remainder -= 1; }
        li.price_data.unit_amount = Math.max(1, li.price_data.unit_amount - reduction);
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "bancontact"],
      mode: "payment",
      line_items: lineItems,
      metadata: {
        order_id: orderId,
        order_number: order.order_number,
      },
      customer_email: order.customer_email || undefined,
      success_url: `${baseUrl}/commande/${orderId}?payment=success`,
      cancel_url: `${baseUrl}/commande/${orderId}?payment=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });

    await supabaseAdmin
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", orderId);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout session error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
