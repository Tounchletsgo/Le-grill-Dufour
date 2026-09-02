import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("slug, menu_items(name, cooking_group_id, cooking_required, option_groups, cooking_group:cooking_groups(*))")
      .eq("is_active", true)
      .in("slug", ["viandes"])
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message });
    }

    const cat = data?.[0];
    const items = (cat as any)?.menu_items?.slice(0, 3) || [];

    return NextResponse.json({
      category: cat?.slug,
      items: items.map((i: any) => ({
        name: i.name,
        cooking_group_id: i.cooking_group_id,
        cooking_group: i.cooking_group,
        cooking_group_type: typeof i.cooking_group,
        cooking_group_isArray: Array.isArray(i.cooking_group),
        option_groups: i.option_groups,
      })),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) });
  }
}
