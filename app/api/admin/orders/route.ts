import { NextRequest, NextResponse } from "next/server";

function checkAuth(request: NextRequest) {
  const pin = request.headers.get("x-admin-pin");
  const expected = process.env.ADMIN_PIN || "0000";
  return pin === expected;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ orders: [], stats: null });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;
    const statusFilter = searchParams.get("status");

    let query = supabaseAdmin
      .from("orders")
      .select("*, order_items(name, variant_label, quantity, unit_price, total_price)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data: orders, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: todayOrders } = await supabaseAdmin
      .from("orders")
      .select("total, status")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    const stats = {
      todayCount: todayOrders?.length || 0,
      todayRevenue: todayOrders
        ?.filter((o: any) => o.status !== "cancelled")
        .reduce((s: number, o: any) => s + o.total, 0) || 0,
      todayCancelled: todayOrders?.filter((o: any) => o.status === "cancelled").length || 0,
    };

    return NextResponse.json({ orders: orders || [], total: count || 0, stats });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
