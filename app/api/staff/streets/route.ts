import { NextRequest, NextResponse } from "next/server";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[''`\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ streets: [], manualAddresses: [] });
  }

  const { supabaseAdmin } = await import("@/lib/supabase-server");
  const searchParams = request.nextUrl.searchParams;
  const view = searchParams.get("view");

  if (view === "manual-addresses") {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, delivery_address, delivery_postal, delivery_city, created_at")
      .eq("address_source", "manual")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ manualAddresses: [] }, { status: 500 });
    }
    return NextResponse.json({ manualAddresses: data || [] });
  }

  const q = searchParams.get("q") || "";
  let query = supabaseAdmin
    .from("streets")
    .select("*")
    .order("name");

  if (q) {
    query = query.ilike("name_normalized", `%${normalize(q)}%`);
  }

  const { data, error } = await query.limit(200);

  if (error) {
    return NextResponse.json({ streets: [] }, { status: 500 });
  }
  return NextResponse.json({ streets: data || [] });
}

export async function POST(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  const { supabaseAdmin } = await import("@/lib/supabase-server");
  const body = await request.json();

  const name = body.name?.trim();
  const postalCode = body.postal_code?.trim();
  const municipality = body.municipality?.trim();

  if (!name || !postalCode || !municipality) {
    return NextResponse.json({ error: "Nom, code postal et commune requis." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("streets")
    .upsert(
      {
        name,
        name_normalized: normalize(name),
        postal_code: postalCode,
        municipality,
        active: true,
        source: "manual",
      },
      { onConflict: "name_normalized,postal_code" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ street: data });
}

export async function PATCH(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  const { supabaseAdmin } = await import("@/lib/supabase-server");
  const { id, active } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "ID requis." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("streets")
    .update({ active })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
