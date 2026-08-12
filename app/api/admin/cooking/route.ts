import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

async function checkAuth(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth) {
    try {
      await requireRole(auth, "admin");
      return true;
    } catch {
      return false;
    }
  }
  const pin = request.headers.get("x-admin-pin");
  const expected = process.env.ADMIN_PIN || "0000";
  return pin === expected;
}

export async function GET(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ groups: [], levels: [], groupLevels: [], menuItems: [] });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const [groupsRes, levelsRes, glRes, itemsRes] = await Promise.all([
      supabaseAdmin.from("cooking_groups").select("*").order("sort_order"),
      supabaseAdmin.from("cooking_levels").select("*").order("sort_order"),
      supabaseAdmin.from("cooking_group_levels").select("*"),
      supabaseAdmin
        .from("menu_items")
        .select("id, name, cooking_group_id, cooking_required, categories!inner(label)")
        .eq("is_active", true)
        .in("category_id", (
          await supabaseAdmin
            .from("categories")
            .select("id")
            .in("slug", ["viandes", "grillades"])
        ).data?.map((c: any) => c.id) || [])
        .order("sort_order"),
    ]);

    const menuItems = (itemsRes.data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      cooking_group_id: item.cooking_group_id,
      cooking_required: item.cooking_required,
      category_label: item.categories?.label || null,
    }));

    return NextResponse.json({
      groups: groupsRes.data || [],
      levels: levelsRes.data || [],
      groupLevels: glRes.data || [],
      menuItems,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
