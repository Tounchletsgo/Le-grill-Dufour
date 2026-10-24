import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();

    const { data: staleOrders } = await supabaseAdmin
      .from("orders")
      .select("id, stripe_session_id, order_number, created_at")
      .eq("status", "pending_payment")
      .lt("created_at", oneHourAgo);

    let recovered = 0;
    const orphanedIds: string[] = [];

    if (staleOrders && staleOrders.length > 0 && process.env.STRIPE_SECRET_KEY) {
      const { getStripe } = await import("@/lib/stripe");
      const stripe = getStripe();

      for (const order of staleOrders) {
        if (!order.stripe_session_id) continue;

        try {
          const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
          if (session.payment_status === "paid") {
            const { error: updateError } = await supabaseAdmin
              .from("orders")
              .update({
                status: "confirmed",
                payment_status: "paid",
                payment_method: "online",
                stripe_payment_intent_id: (session.payment_intent as string) || null,
                confirmed_at: new Date().toISOString(),
                ...(session.livemode ? {} : { is_test: true }),
              })
              .eq("id", order.id)
              .eq("status", "pending_payment");

            if (!updateError) {
              recovered++;
              orphanedIds.push(order.order_number || order.id);
              console.log("Cleanup: recovered orphaned payment for", order.order_number || order.id);
            }
          }
        } catch {
          // Stripe session expired or invalid — safe to clean up
        }
      }

      if (orphanedIds.length > 0) {
        try {
          const { sendAlertEmail } = await import("@/lib/email");
          await sendAlertEmail({
            subject: `Paiement orphelin récupéré (${orphanedIds.length})`,
            body: `Les commandes suivantes étaient payées dans Stripe mais bloquées en « pending_payment » dans la base.\nElles ont été confirmées automatiquement :\n\n${orphanedIds.map(id => `• ${id}`).join("\n")}\n\nVérifiez que ces commandes sont bien arrivées en cuisine.`,
          });
        } catch {}
      }
    }

    const { data: abandoned, error } = await supabaseAdmin
      .from("orders")
      .delete()
      .eq("status", "pending_payment")
      .lt("created_at", oneHourAgo)
      .select("id");

    if (error) {
      console.error("Cleanup error:", error);
      return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }

    return NextResponse.json({
      cleaned: abandoned?.length || 0,
      recovered,
    });
  } catch (err) {
    console.error("Cleanup cron error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
