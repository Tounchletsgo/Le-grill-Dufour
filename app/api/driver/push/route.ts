import { NextRequest, NextResponse } from "next/server";
import { verifyDriverSession } from "@/lib/driver-auth";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const driverId = request.headers.get("x-driver-id");
  if (!driverId || !UUID_RE.test(driverId)) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const driver = await verifyDriverSession(driverId);
  if (!driver) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subscription } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: "Subscription invalide" }, { status: 400 });
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { error } = await supabaseAdmin
      .from("driver_push_subscriptions")
      .upsert(
        {
          driver_id: driverId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      console.error("Push subscription upsert failed:", error.message);
      return NextResponse.json({ error: "Enregistrement échoué" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const driverId = request.headers.get("x-driver-id");
  if (!driverId || !UUID_RE.test(driverId)) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const driver = await verifyDriverSession(driverId);
  if (!driver) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint requis" }, { status: 400 });
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");

    await supabaseAdmin
      .from("driver_push_subscriptions")
      .delete()
      .eq("driver_id", driverId)
      .eq("endpoint", endpoint);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
}
