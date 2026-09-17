import { NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/auth";

function todayBrussels(): string {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Brussels" })
  )
    .toISOString()
    .slice(0, 10);
}

async function checkAuth(request: NextRequest) {
  const result = await checkApiAuth(request, "admin", "staff");
  return result.authenticated;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || todayBrussels();
  const history = searchParams.get("history") === "1";

  const { supabaseAdmin } = await import("@/lib/supabase-server");

  if (history) {
    const { data, error } = await supabaseAdmin
      .from("daily_specials")
      .select("*")
      .order("valid_date", { ascending: false })
      .order("slot")
      .limit(60);

    if (error) {
      return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
    return NextResponse.json({ specials: data });
  }

  const { data, error } = await supabaseAdmin
    .from("daily_specials")
    .select("*")
    .eq("valid_date", date)
    .order("slot");

  if (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
  return NextResponse.json({ specials: data });
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { slot, name, description, price, cooking_group, is_available, valid_date } = body;

  if (!slot || !name) {
    return NextResponse.json({ error: "Slot et nom requis" }, { status: 400 });
  }
  if (![1, 2].includes(slot)) {
    return NextResponse.json({ error: "Slot doit être 1 ou 2" }, { status: 400 });
  }

  const date = valid_date || todayBrussels();
  const finalPrice = typeof price === "number" ? price : 14.0;
  const finalCooking = cooking_group === "boeuf" || cooking_group === "cuisson_imposee" ? cooking_group : null;

  const { supabaseAdmin } = await import("@/lib/supabase-server");

  const { data, error } = await supabaseAdmin
    .from("daily_specials")
    .upsert(
      {
        slot,
        valid_date: date,
        name: name.trim(),
        description: description?.trim() || null,
        price: finalPrice,
        cooking_group: finalCooking,
        is_available: is_available !== false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slot,valid_date" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Upsert failed" }, { status: 500 });
  }
  return NextResponse.json({ special: data });
}

export async function DELETE(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const { supabaseAdmin } = await import("@/lib/supabase-server");

  const { error } = await supabaseAdmin
    .from("daily_specials")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
