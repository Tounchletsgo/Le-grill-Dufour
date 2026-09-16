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
  const expected = process.env.ADMIN_PIN;
  if (!expected) return false;
  return pin === expected;
}

export async function GET(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ categories: [] });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data: categories, error } = await supabaseAdmin
      .from("categories")
      .select("*, menu_items(*, item_variants(*), item_supplements(*), cooking_group:cooking_groups(*))")
      .order("sort_order");

    if (error) {
      return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }

    return NextResponse.json({ categories: categories || [] });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const body = await request.json();

    if (body.action === "reset_all_stock") {
      const { error } = await supabaseAdmin
        .from("menu_items")
        .update({ is_out_of_stock: false })
        .eq("is_out_of_stock", true);
      if (error) return NextResponse.json({ error: "Reset failed" }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (body.action === "toggle_category_stock") {
      const { category_id, out_of_stock } = body;
      if (!category_id || typeof out_of_stock !== "boolean") {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
      }
      const { error } = await supabaseAdmin
        .from("menu_items")
        .update({ is_out_of_stock: out_of_stock })
        .eq("category_id", category_id)
        .eq("is_active", true);
      if (error) return NextResponse.json({ error: "Toggle failed" }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    const { table, id, data } = body;

    const allowedTables = ["categories", "menu_items", "item_variants", "item_supplements", "cooking_levels", "cooking_groups", "cooking_group_levels"];
    if (!allowedTables.includes(table)) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from(table)
      .update(data)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const { table, data } = await request.json();

    const allowedTables = ["categories", "menu_items", "item_variants", "item_supplements", "cooking_levels", "cooking_groups", "cooking_group_levels"];
    if (!allowedTables.includes(table)) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    const { data: inserted, error } = await supabaseAdmin
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: inserted });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const { table, id } = await request.json();

    const allowedTables = ["menu_items", "item_variants", "item_supplements", "cooking_levels", "cooking_groups", "cooking_group_levels"];
    if (!allowedTables.includes(table)) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
