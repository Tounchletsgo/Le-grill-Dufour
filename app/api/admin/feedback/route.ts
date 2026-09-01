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
    return NextResponse.json({ feedback: [] });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data: feedback, error } = await supabaseAdmin
      .from("order_feedback")
      .select(`
        id, rating, comment, created_at,
        orders!inner(order_number, customer_name, customer_phone, delivered_at)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Feedback fetch error:", error);
      return NextResponse.json({ feedback: [] });
    }

    const formatted = (feedback || []).map((f: any) => ({
      id: f.id,
      rating: f.rating,
      comment: f.comment,
      created_at: f.created_at,
      order_number: f.orders?.order_number,
      customer_name: f.orders?.customer_name,
      customer_phone: f.orders?.customer_phone,
      delivered_at: f.orders?.delivered_at,
    }));

    return NextResponse.json({ feedback: formatted });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
