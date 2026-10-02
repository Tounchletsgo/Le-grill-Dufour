import { NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await checkApiAuth(request, "admin", "staff");
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { supabaseAdmin } = await import("@/lib/supabase-server");
  const { data, error } = await supabaseAdmin
    .from("drivers")
    .select("id, name, phone, pin, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ drivers: data });
}

export async function POST(request: NextRequest) {
  const auth = await checkApiAuth(request, "admin");
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, phone, pin } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Nom requis (min 2 caractères)" }, { status: 400 });
    }
    if (!pin || typeof pin !== "string" || pin.length < 4) {
      return NextResponse.json({ error: "PIN requis (min 4 chiffres)" }, { status: 400 });
    }
    if (!/^\d+$/.test(pin)) {
      return NextResponse.json({ error: "Le PIN doit contenir uniquement des chiffres" }, { status: 400 });
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const { data: existing } = await supabaseAdmin
      .from("drivers")
      .select("id")
      .eq("pin", pin)
      .eq("is_active", true)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Ce PIN est déjà utilisé par un autre livreur" }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from("drivers")
      .insert({
        name: name.trim(),
        phone: phone?.trim() || null,
        pin,
      })
      .select("id, name, phone, pin, is_active, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: "Erreur création livreur" }, { status: 500 });
    }

    return NextResponse.json({ driver: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await checkApiAuth(request, "admin");
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, phone, pin, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return NextResponse.json({ error: "Nom requis (min 2 caractères)" }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (phone !== undefined) {
      updates.phone = phone?.trim() || null;
    }

    if (pin !== undefined) {
      if (typeof pin !== "string" || pin.length < 4 || !/^\d+$/.test(pin)) {
        return NextResponse.json({ error: "PIN: min 4 chiffres" }, { status: 400 });
      }
      const { data: existing } = await supabaseAdmin
        .from("drivers")
        .select("id")
        .eq("pin", pin)
        .eq("is_active", true)
        .neq("id", id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: "Ce PIN est déjà utilisé" }, { status: 409 });
      }
      updates.pin = pin;
    }

    if (is_active !== undefined) {
      updates.is_active = is_active;
    }

    const { data, error } = await supabaseAdmin
      .from("drivers")
      .update(updates)
      .eq("id", id)
      .select("id, name, phone, pin, is_active, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
    }

    return NextResponse.json({ driver: data });
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await checkApiAuth(request, "admin");
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const { supabaseAdmin } = await import("@/lib/supabase-server");
  const { error } = await supabaseAdmin
    .from("drivers")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Erreur désactivation" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
