import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts) {
    if (record.blockedUntil > 0 && record.blockedUntil < now) {
      loginAttempts.delete(ip);
    }
  }
}, 60_000);

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record && record.blockedUntil > now) {
    const minutes = Math.ceil((record.blockedUntil - now) / 60_000);
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${minutes} min.` },
      { status: 429 }
    );
  }

  try {
    const { email, password } = await request.json();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key || !serviceKey) {
      return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
    }

    const supabase = createClient(url, key);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      const entry = record && record.blockedUntil <= now ? record : { count: 0, blockedUntil: 0 };
      entry.count += 1;
      if (entry.count >= MAX_ATTEMPTS) {
        entry.blockedUntil = now + BLOCK_DURATION_MS;
      }
      loginAttempts.set(ip, entry);
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    loginAttempts.delete(ip);

    const admin = createClient(url, serviceKey);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id)
      .single();

    if (!roleRow) {
      return NextResponse.json(
        { error: "Aucun rôle attribué. Contactez l'administrateur." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: roleRow.role,
      },
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
