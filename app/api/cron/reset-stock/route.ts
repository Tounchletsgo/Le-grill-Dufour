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

    const { data: config } = await supabaseAdmin
      .from("delivery_config")
      .select("auto_reset_stock")
      .limit(1)
      .single();

    if (!config?.auto_reset_stock) {
      return NextResponse.json({ skipped: true, reason: "auto_reset_stock disabled" });
    }

    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .update({ is_out_of_stock: false })
      .eq("is_out_of_stock", true)
      .select("id");

    if (error) {
      return NextResponse.json({ error: "Reset failed" }, { status: 500 });
    }

    return NextResponse.json({ reset: true, count: data?.length ?? 0 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
