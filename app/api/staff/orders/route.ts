import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ orders: [] });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*, order_item_supplements(*))")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Staff orders fetch error:", error);
      return NextResponse.json({ orders: [] }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (err) {
    console.error("Staff orders error:", err);
    return NextResponse.json({ orders: [] }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: "Missing orderId or status" }, { status: 400 });
    }

    const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivering", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const updateData: any = { status };

    if (status === "confirmed") updateData.confirmed_at = new Date().toISOString();
    if (status === "preparing") updateData.prepared_at = new Date().toISOString();
    if (status === "delivered") updateData.delivered_at = new Date().toISOString();
    if (status === "cancelled") updateData.cancelled_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (error) {
      console.error("Staff order update error:", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Staff PATCH error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
