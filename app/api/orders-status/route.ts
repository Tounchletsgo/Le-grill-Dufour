import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ paused: true });
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data, error } = await supabaseAdmin
      .from("delivery_config")
      .select("orders_paused")
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ paused: true });
    }

    return NextResponse.json({ paused: data.orders_paused ?? true });
  } catch {
    return NextResponse.json({ paused: true });
  }
}
