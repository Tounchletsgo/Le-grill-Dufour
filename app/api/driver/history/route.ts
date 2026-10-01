import { NextRequest, NextResponse } from "next/server";
import { verifyDriverSession } from "@/lib/driver-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const driverId = request.headers.get("x-driver-id");
  if (!driverId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const driver = await verifyDriverSession(driverId);
  if (!driver) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  const { supabaseAdmin } = await import("@/lib/supabase-server");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      customer_name,
      delivery_address,
      house_number,
      delivery_postal,
      delivery_city,
      total,
      payment_method,
      payment_status,
      created_at,
      delivered_at,
      driver_picked_up_at
    `)
    .eq("assigned_driver_id", driverId)
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  const delivered = (data || []).filter((o) => o.status === "delivered");
  const totalDelivered = delivered.length;
  const totalAmount = delivered.reduce((sum, o) => sum + Number(o.total), 0);

  const response = NextResponse.json({
    orders: data || [],
    stats: { totalDelivered, totalAmount },
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
