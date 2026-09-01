import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const { sendFeedbackRequestEmail } = await import("@/lib/email");

    const { data: config } = await supabaseAdmin
      .from("delivery_config")
      .select("feedback_delay_hours")
      .limit(1)
      .single();

    const delayHours = config?.feedback_delay_hours ?? 2;

    const { data: configReviews } = await supabaseAdmin
      .from("google_reviews_config")
      .select("google_maps_url")
      .limit(1)
      .single();

    const googleReviewUrl = configReviews?.google_maps_url ||
      "https://www.google.com/maps/place/Le+grill+Dufour/@50.7466257,3.2136073,17z/data=!4m8!3m7!1s0x47c3c321943758ad:0x54dba0a679e06d45!8m2!3d50.7466257!4d3.2161822!9m1!1b1!16s%2Fg%2F11hz1sr9kp";

    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - delayHours);

    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, customer_name, customer_email, customer_phone, feedback_token, delivered_at")
      .eq("status", "delivered")
      .eq("mode", "delivery")
      .not("customer_email", "is", null)
      .not("feedback_token", "is", null)
      .lte("delivered_at", cutoff.toISOString());

    if (!orders || orders.length === 0) {
      return NextResponse.json({ sent: 0, skipped: 0 });
    }

    const { data: alreadySent } = await supabaseAdmin
      .from("email_queue")
      .select("order_id")
      .eq("email_type", "feedback_request")
      .in("order_id", orders.map((o) => o.id));

    const sentOrderIds = new Set((alreadySent || []).map((e) => e.order_id));

    const { data: unsubscribes } = await supabaseAdmin
      .from("email_unsubscribes")
      .select("phone")
      .in("phone", orders.map((o) => o.customer_phone));

    const unsubPhones = new Set((unsubscribes || []).map((u) => u.phone));

    const { data: alreadyFeedback } = await supabaseAdmin
      .from("order_feedback")
      .select("order_id")
      .in("order_id", orders.map((o) => o.id));

    const feedbackOrderIds = new Set((alreadyFeedback || []).map((f) => f.order_id));

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://le-grill-dufour.vercel.app";

    let sent = 0;
    let skipped = 0;

    for (const order of orders) {
      if (sentOrderIds.has(order.id)) { skipped++; continue; }
      if (unsubPhones.has(order.customer_phone)) { skipped++; continue; }
      if (feedbackOrderIds.has(order.id)) { skipped++; continue; }

      const feedbackUrl = `${baseUrl}/feedback/${order.feedback_token}`;
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${order.feedback_token}`;

      const success = await sendFeedbackRequestEmail({
        to: order.customer_email,
        customerName: order.customer_name,
        orderNumber: order.order_number,
        feedbackUrl,
        googleReviewUrl,
        unsubscribeUrl,
      });

      await supabaseAdmin.from("email_queue").insert({
        order_id: order.id,
        email_type: "feedback_request",
        recipient: order.customer_email,
        status: success ? "sent" : "failed",
        attempts: 1,
        sent_at: success ? new Date().toISOString() : null,
        scheduled_at: new Date().toISOString(),
      });

      if (success) sent++;
    }

    return NextResponse.json({ sent, skipped });
  } catch (err) {
    console.error("Feedback cron error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
