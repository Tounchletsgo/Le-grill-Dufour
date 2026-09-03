import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Non configuré" }, { status: 500 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, customer_name, created_at, feedback_token")
      .eq("feedback_token", token)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (new Date(order.created_at) < thirtyDaysAgo) {
      return NextResponse.json({ error: "Ce lien a expiré (30 jours)." }, { status: 410 });
    }

    const { data: existing } = await supabaseAdmin
      .from("order_feedback")
      .select("id")
      .eq("order_id", order.id)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Vous avez déjà envoyé votre avis pour cette commande." }, { status: 409 });
    }

    const orderDate = new Date(order.created_at).toLocaleDateString("fr-BE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const { data: reviewConfig } = await supabaseAdmin
      .from("google_reviews_config")
      .select("google_maps_url")
      .limit(1)
      .single();

    return NextResponse.json({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      orderDate,
      googleUrl: reviewConfig?.google_maps_url || "",
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Non configuré" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { token, rating, comment, isComplete, isHot, isOnTime } = body;

    if (!token || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, customer_name, customer_email, customer_phone, delivery_address, delivery_city, created_at")
      .eq("feedback_token", token)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (new Date(order.created_at) < thirtyDaysAgo) {
      return NextResponse.json({ error: "Ce lien a expiré." }, { status: 410 });
    }

    const { data: existing } = await supabaseAdmin
      .from("order_feedback")
      .select("id")
      .eq("order_id", order.id)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Avis déjà envoyé." }, { status: 409 });
    }

    const safeComment = (typeof comment === "string" ? comment : "").slice(0, 2000).trim();
    const safeBool = (v: unknown): boolean | null => (v === true || v === false ? v : null);

    const { error } = await supabaseAdmin
      .from("order_feedback")
      .insert({
        order_id: order.id,
        rating,
        comment: safeComment,
        is_complete: safeBool(isComplete),
        is_hot: safeBool(isHot),
        is_on_time: safeBool(isOnTime),
      });

    if (error) {
      console.error("Feedback insert error:", error);
      return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });
    }

    const { sendTelegramNotification } = await import("@/lib/telegram");
    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
    const qParts = [
      safeBool(isComplete) !== null ? `Complète: ${isComplete ? "oui" : "non"}` : null,
      safeBool(isHot) !== null ? `Chaud: ${isHot ? "oui" : "non"}` : null,
      safeBool(isOnTime) !== null ? `Délai OK: ${isOnTime ? "oui" : "non"}` : null,
    ].filter(Boolean).join(" · ");
    const telegramMsg = `📝 Nouveau retour client\n${stars} (${rating}/5)\nCommande ${order.order_number} — ${order.customer_name}${qParts ? `\n${qParts}` : ""}${safeComment ? `\n\n${safeComment}` : "\n(pas de commentaire)"}`;
    sendTelegramNotification(telegramMsg).catch(() => {});

    const { sendFeedbackNotifToRestaurant } = await import("@/lib/email");
    const fullAddress = [order.delivery_address, order.delivery_city].filter(Boolean).join(", ");
    sendFeedbackNotifToRestaurant({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      rating,
      isComplete: safeBool(isComplete),
      isHot: safeBool(isHot),
      isOnTime: safeBool(isOnTime),
      comment: safeComment,
      deliveryAddress: fullAddress || undefined,
      orderId: order.id,
    }).catch(() => {});

    const { data: reviewConfig } = await supabaseAdmin
      .from("google_reviews_config")
      .select("google_maps_url")
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      googleUrl: reviewConfig?.google_maps_url || "",
    });
  } catch (err) {
    console.error("Feedback API error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
