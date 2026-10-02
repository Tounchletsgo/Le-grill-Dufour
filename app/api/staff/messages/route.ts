import { NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await checkApiAuth(request, "admin", "staff");
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const driverId = searchParams.get("driver_id");

  const { supabaseAdmin } = await import("@/lib/supabase-server");

  if (driverId) {
    const { data, error } = await supabaseAdmin
      .from("driver_messages")
      .select("id, driver_id, sender, message, is_quick, read_at, created_at")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json({ messages: data || [] });
  }

  const { data: unread, error: unreadErr } = await supabaseAdmin
    .from("driver_messages")
    .select("id, driver_id, sender, message, is_quick, created_at")
    .eq("sender", "driver")
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (unreadErr) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  const response = NextResponse.json({ messages: unread || [] });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  const auth = await checkApiAuth(request, "admin", "staff");
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { driver_id, message, is_quick } = body;

    if (!driver_id) {
      return NextResponse.json({ error: "driver_id requis" }, { status: 400 });
    }
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data, error } = await supabaseAdmin
      .from("driver_messages")
      .insert({
        driver_id,
        sender: "staff",
        message: message.trim(),
        is_quick: !!is_quick,
      })
      .select("id, driver_id, sender, message, is_quick, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: "Erreur envoi" }, { status: 500 });
    }

    try {
      const { sendPushToDriver } = await import("@/lib/push-notifications");
      await sendPushToDriver(supabaseAdmin, driver_id, {
        title: "Message de la cuisine",
        body: message.trim().slice(0, 100),
        url: "/livreur",
      });
    } catch {}

    return NextResponse.json({ message: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await checkApiAuth(request, "admin", "staff");
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { driver_id } = body;

    if (!driver_id) {
      return NextResponse.json({ error: "driver_id requis" }, { status: 400 });
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");

    await supabaseAdmin
      .from("driver_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("driver_id", driver_id)
      .eq("sender", "driver")
      .is("read_at", null);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
}
