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

  const { data, error } = await supabaseAdmin
    .from("driver_messages")
    .select("id, driver_id, sender, message, is_quick, read_at, created_at")
    .eq("driver_id", driverId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  const response = NextResponse.json({ messages: data || [] });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  const driverId = request.headers.get("x-driver-id");
  if (!driverId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const driver = await verifyDriverSession(driverId);
  if (!driver) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message, is_quick } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    if (message.trim().length > 500) {
      return NextResponse.json({ error: "Message trop long (max 500 caractères)" }, { status: 400 });
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data, error } = await supabaseAdmin
      .from("driver_messages")
      .insert({
        driver_id: driverId,
        sender: "driver",
        message: message.trim(),
        is_quick: !!is_quick,
      })
      .select("id, driver_id, sender, message, is_quick, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: "Erreur envoi" }, { status: 500 });
    }

    return NextResponse.json({ message: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
}
