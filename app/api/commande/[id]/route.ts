import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const trackerRateLimit = new Map<string, number[]>();
setInterval(() => {
  const now = Date.now();
  for (const [ip, hits] of trackerRateLimit) {
    const recent = hits.filter((t) => now - t < 60_000);
    if (recent.length === 0) trackerRateLimit.delete(ip);
    else trackerRateLimit.set(ip, recent);
  }
}, 60_000);

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = _request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const hits = (trackerRateLimit.get(ip) || []).filter((t) => now - t < 60_000);
  if (hits.length >= 30) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }
  hits.push(now);
  trackerRateLimit.set(ip, hits);
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "order_number, status, mode, customer_name, total, delivery_fee, subtotal, discount_amount, created_at, payment_method, payment_status, estimated_delivery_at, delivery_address, house_number, delivery_postal, delivery_city, locale, order_items(name, variant_label, quantity, unit_price, total_price, doneness_label)"
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
