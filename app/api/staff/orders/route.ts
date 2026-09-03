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
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { orderId, status, paymentStatus, refused } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const updateData: any = {};

    if (paymentStatus === "paid") {
      updateData.payment_status = "paid";
    }

    if (status) {
      const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivering", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = status;
      if (status === "confirmed") updateData.confirmed_at = new Date().toISOString();
      if (status === "preparing") updateData.prepared_at = new Date().toISOString();
      if (status === "delivered") updateData.delivered_at = new Date().toISOString();
      if (status === "cancelled") updateData.cancelled_at = new Date().toISOString();
      if (status === "cancelled" && refused) updateData.refused_at = new Date().toISOString();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

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
