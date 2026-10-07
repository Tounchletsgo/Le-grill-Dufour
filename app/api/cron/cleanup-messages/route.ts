import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");

    // 5h00 Brussels time today
    const now = new Date();
    const brusselsNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Europe/Brussels" })
    );
    const brusselsToday5am = new Date(brusselsNow);
    brusselsToday5am.setHours(5, 0, 0, 0);

    // If it's before 5am Brussels, use yesterday's 5am
    if (brusselsNow < brusselsToday5am) {
      brusselsToday5am.setDate(brusselsToday5am.getDate() - 1);
    }

    // Convert Brussels 5am back to UTC
    const utcStr = brusselsToday5am.toLocaleString("en-US", { timeZone: "UTC" });
    const brusselsStr = brusselsToday5am.toLocaleString("en-US", { timeZone: "Europe/Brussels" });
    const offset = new Date(brusselsStr).getTime() - new Date(utcStr).getTime();
    const cutoffUtc = new Date(brusselsToday5am.getTime() - offset).toISOString();

    const { data: deleted, error } = await supabaseAdmin
      .from("driver_messages")
      .delete()
      .lt("created_at", cutoffUtc)
      .select("id");

    if (error) {
      console.error("Message cleanup error:", error);
      return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }

    const count = deleted?.length || 0;

    // Record cleanup time
    await supabaseAdmin
      .from("delivery_config")
      .update({ last_message_cleanup: new Date().toISOString() })
      .limit(1);

    console.log(`Message cleanup: deleted ${count} messages before ${cutoffUtc}`);

    return NextResponse.json({ cleaned: count, cutoff: cutoffUtc });
  } catch (err) {
    console.error("Message cleanup cron error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
