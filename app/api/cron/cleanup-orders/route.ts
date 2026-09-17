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

    const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();

    const { data: abandoned, error } = await supabaseAdmin
      .from("orders")
      .delete()
      .eq("status", "pending_payment")
      .lt("created_at", oneHourAgo)
      .select("id");

    if (error) {
      console.error("Cleanup error:", error);
      return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }

    return NextResponse.json({
      cleaned: abandoned?.length || 0,
    });
  } catch (err) {
    console.error("Cleanup cron error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
