import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .select("name, cooking_group_id, cooking_required, option_groups, cooking_group:cooking_groups(*)")
      .not("cooking_group_id", "is", null)
      .limit(3);

    if (error) {
      return NextResponse.json({ error: error.message });
    }

    return NextResponse.json({ items: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) });
  }
}
