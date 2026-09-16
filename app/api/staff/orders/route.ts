import { NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/auth";

async function checkAuth(request: NextRequest) {
  const result = await checkApiAuth(request, "admin", "staff");
  return result.authenticated;
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

    const url = new URL(request.url);
    const includeDone = url.searchParams.get("include_done") === "true";

    let query = supabaseAdmin
      .from("orders")
      .select("*, order_items(*, order_item_supplements(*))")
      .order("created_at", { ascending: false });

    if (!includeDone) {
      query = query.in("status", ["pending", "confirmed", "preparing", "ready", "delivering"]);
    }

    const { data: orders, error } = await query.limit(100);

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
    const { orderId, status, paymentStatus, refused, reason, estimated_time } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const updateData: Record<string, unknown> = {};

    if (paymentStatus === "paid") {
      updateData.payment_status = "paid";
    }

    if (status) {
      const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivering", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const allowedTransitions: Record<string, string[]> = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["preparing", "pending", "cancelled"],
        preparing: ["ready", "confirmed", "cancelled"],
        ready: ["delivering", "delivered", "preparing", "cancelled"],
        delivering: ["delivered", "ready", "cancelled"],
        delivered: [],
        cancelled: ["pending", "confirmed"],
      };

      const { data: current } = await supabaseAdmin
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (current && allowedTransitions[current.status] &&
          !allowedTransitions[current.status].includes(status)) {
        return NextResponse.json(
          { error: `Transition ${current.status} → ${status} non autorisée` },
          { status: 400 }
        );
      }

      updateData.status = status;
      if (status === "confirmed") {
        updateData.confirmed_at = new Date().toISOString();
        if (estimated_time && typeof estimated_time === "string") {
          const minutes = parseInt(estimated_time, 10);
          if (!isNaN(minutes) && minutes > 0) {
            updateData.estimated_delivery_at = new Date(
              Date.now() + minutes * 60_000
            ).toISOString();
          }
        }
      }
      if (status === "preparing") updateData.prepared_at = new Date().toISOString();
      if (status === "delivered") updateData.delivered_at = new Date().toISOString();
      if (status === "cancelled") {
        updateData.cancelled_at = new Date().toISOString();
        if (refused) updateData.refused_at = new Date().toISOString();
        if (reason && typeof reason === "string") {
          updateData.refusal_reason = reason.slice(0, 500);
        }
      }
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
