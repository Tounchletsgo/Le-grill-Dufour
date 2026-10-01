import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
        "order_number, status, mode, customer_name, customer_email, total, delivery_fee, subtotal, discount_amount, created_at, notes, payment_method, payment_status, estimated_delivery_at, delivery_address, house_number, delivery_postal, delivery_city, locale, order_items(name, variant_label, quantity, unit_price, total_price, doneness_label)"
      )
      .eq("id", params.id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ order }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
