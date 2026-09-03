import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

async function checkAuth(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth) {
    try {
      await requireRole(auth, "admin", "staff");
      return true;
    } catch {
      return false;
    }
  }
  const pin = request.headers.get("x-admin-pin");
  const expected = process.env.ADMIN_PIN || "0000";
  return pin === expected;
}

export async function GET(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ feedback: [], stats: null });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const url = new URL(request.url);
    const ratingFilter = url.searchParams.get("rating");
    const periodFilter = url.searchParams.get("period");

    let query = supabaseAdmin
      .from("order_feedback")
      .select(`
        id, rating, comment, is_complete, is_hot, is_on_time,
        is_handled, handled_note, handled_at, created_at,
        orders!inner(order_number, customer_name, customer_phone, delivered_at, delivery_address, delivery_city)
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    if (ratingFilter && !isNaN(Number(ratingFilter))) {
      query = query.eq("rating", Number(ratingFilter));
    }

    if (periodFilter) {
      const now = new Date();
      let since: Date;
      if (periodFilter === "7d") {
        since = new Date(now.getTime() - 7 * 86400000);
      } else if (periodFilter === "30d") {
        since = new Date(now.getTime() - 30 * 86400000);
      } else {
        since = new Date(0);
      }
      query = query.gte("created_at", since.toISOString());
    }

    const { data: feedback, error } = await query;

    if (error) {
      console.error("Feedback fetch error:", error);
      return NextResponse.json({ feedback: [], stats: null });
    }

    const formatted = (feedback || []).map((f: any) => ({
      id: f.id,
      rating: f.rating,
      comment: f.comment,
      is_complete: f.is_complete,
      is_hot: f.is_hot,
      is_on_time: f.is_on_time,
      is_handled: f.is_handled,
      handled_note: f.handled_note,
      handled_at: f.handled_at,
      created_at: f.created_at,
      order_number: f.orders?.order_number,
      customer_name: f.orders?.customer_name,
      customer_phone: f.orders?.customer_phone,
      delivered_at: f.orders?.delivered_at,
      delivery_address: [f.orders?.delivery_address, f.orders?.delivery_city].filter(Boolean).join(", "),
    }));

    const allFeedback = await supabaseAdmin
      .from("order_feedback")
      .select("rating, is_complete, is_hot, is_on_time, created_at");

    const all = allFeedback.data || [];
    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 86400000);
    const d30 = new Date(now.getTime() - 30 * 86400000);

    function computeStats(items: any[]) {
      if (items.length === 0) return null;
      const avgRating = items.reduce((s, f) => s + f.rating, 0) / items.length;
      const withComplete = items.filter((f) => f.is_complete !== null);
      const withHot = items.filter((f) => f.is_hot !== null);
      const withOnTime = items.filter((f) => f.is_on_time !== null);
      return {
        count: items.length,
        avgRating: Math.round(avgRating * 10) / 10,
        completeRate: withComplete.length > 0 ? Math.round(withComplete.filter((f) => f.is_complete).length / withComplete.length * 100) : null,
        hotRate: withHot.length > 0 ? Math.round(withHot.filter((f) => f.is_hot).length / withHot.length * 100) : null,
        onTimeRate: withOnTime.length > 0 ? Math.round(withOnTime.filter((f) => f.is_on_time).length / withOnTime.length * 100) : null,
      };
    }

    const stats = {
      all: computeStats(all),
      last7d: computeStats(all.filter((f) => new Date(f.created_at) >= d7)),
      last30d: computeStats(all.filter((f) => new Date(f.created_at) >= d30)),
    };

    return NextResponse.json({ feedback: formatted, stats });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Non configuré" }, { status: 500 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const { id, is_handled, handled_note } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (typeof is_handled === "boolean") {
      update.is_handled = is_handled;
      update.handled_at = is_handled ? new Date().toISOString() : null;
    }
    if (typeof handled_note === "string") {
      update.handled_note = handled_note.slice(0, 1000);
    }

    const { error } = await supabaseAdmin
      .from("order_feedback")
      .update(update)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Erreur" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
