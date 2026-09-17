import { NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const auth = await checkApiAuth(request, "admin");
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const { orderId } = await request.json();

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, payment_method, payment_status, stripe_payment_intent_id")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    if (order.payment_method !== "online") {
      return NextResponse.json({ error: "Seules les commandes payées en ligne peuvent être remboursées ici" }, { status: 400 });
    }

    if (order.payment_status === "refunded") {
      return NextResponse.json({ error: "Commande déjà remboursée" }, { status: 400 });
    }

    if (!order.stripe_payment_intent_id) {
      return NextResponse.json({ error: "Pas d'identifiant de paiement Stripe trouvé" }, { status: 400 });
    }

    const stripe = getStripe();
    await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
    });

    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "refunded" })
      .eq("id", orderId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Refund error:", err);
    return NextResponse.json({ error: "Erreur lors du remboursement" }, { status: 500 });
  }
}
