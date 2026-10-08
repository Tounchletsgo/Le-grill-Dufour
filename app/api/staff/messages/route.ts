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

  try {
    const { data: config } = await supabaseAdmin
      .from("delivery_config")
      .select("last_message_cleanup")
      .limit(1)
      .single();
    const last = config?.last_message_cleanup ? new Date(config.last_message_cleanup) : null;
    const now = new Date();
    const brusselsNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Brussels" }));
    const brusselsToday5am = new Date(brusselsNow);
    brusselsToday5am.setHours(5, 0, 0, 0);
    if (brusselsNow < brusselsToday5am) brusselsToday5am.setDate(brusselsToday5am.getDate() - 1);
    if (!last || last < brusselsToday5am) {
      const utcStr = brusselsToday5am.toLocaleString("en-US", { timeZone: "UTC" });
      const brusselsStr = brusselsToday5am.toLocaleString("en-US", { timeZone: "Europe/Brussels" });
      const offset = new Date(brusselsStr).getTime() - new Date(utcStr).getTime();
      const cutoffUtc = new Date(brusselsToday5am.getTime() - offset).toISOString();
      await supabaseAdmin.from("driver_messages").delete().lt("created_at", cutoffUtc);
      await supabaseAdmin.from("delivery_config").update({ last_message_cleanup: now.toISOString() }).limit(1);
    }
  } catch {}

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

export async function DELETE(request: NextRequest) {
  const auth = await checkApiAuth(request, "admin", "staff");
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message_id, driver_id, clear_all } = body;

    const { supabaseAdmin } = await import("@/lib/supabase-server");

    if (clear_all && driver_id) {
      const { data: deleted } = await supabaseAdmin
        .from("driver_messages")
        .delete()
        .eq("driver_id", driver_id)
        .select("id");

      console.log(`Messages cleared: driver=${driver_id}, count=${deleted?.length || 0}, by=${auth.role}`);
      return NextResponse.json({ deleted: deleted?.length || 0 });
    }

    if (message_id) {
      const { data: deleted } = await supabaseAdmin
        .from("driver_messages")
        .delete()
        .eq("id", message_id)
        .select("id");

      if (!deleted || deleted.length === 0) {
        return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
      }

      console.log(`Message deleted: id=${message_id}, by=${auth.role}`);
      return NextResponse.json({ deleted: 1 });
    }

    return NextResponse.json({ error: "message_id ou clear_all requis" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
}
