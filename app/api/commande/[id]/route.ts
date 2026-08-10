import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "order_number, status, mode, customer_name, total, delivery_fee, subtotal, created_at, notes, order_items(name, variant_label, quantity, unit_price, total_price)"
      )
      .eq("id", params.id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
