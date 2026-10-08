import { NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await checkApiAuth(request, "admin");
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { supabaseAdmin } = await import("@/lib/supabase-server");

  const alerts: { type: string; severity: "warning" | "error"; message: string; orderId?: string; orderNumber?: string }[] = [];

  const thirtyMinAgo = new Date(Date.now() - 30 * 60_000).toISOString();
  const { data: stuckPending } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, customer_name, total, created_at")
    .eq("status", "pending_payment")
    .eq("is_test", false)
    .lt("created_at", thirtyMinAgo)
    .order("created_at", { ascending: false })
    .limit(20);

  for (const order of stuckPending || []) {
    const age = Math.round((Date.now() - new Date(order.created_at).getTime()) / 60_000);
    alerts.push({
      type: "stuck_pending",
      severity: age > 120 ? "error" : "warning",
      message: `#${order.order_number} (${order.customer_name}) — en attente de paiement depuis ${age} min`,
      orderId: order.id,
      orderNumber: order.order_number,
    });
  }

  const { data: noStripeId } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, customer_name, total, created_at")
    .eq("is_test", false)
    .eq("payment_status", "paid")
    .is("stripe_payment_intent_id", null)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(20);

  for (const order of noStripeId || []) {
    alerts.push({
      type: "no_stripe_id",
      severity: "error",
      message: `#${order.order_number} (${order.customer_name}) — confirmée sans référence Stripe`,
      orderId: order.id,
      orderNumber: order.order_number,
    });
  }

  return NextResponse.json({ alerts });
}
