import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

export const maxDuration = 60;

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

const ALLOWED_POSTALS = ["7700", "7711", "7712"];

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[''`\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface StreetRow {
  name: string;
  name_normalized: string;
  postal_code: string;
  municipality: string;
  source: string;
  active: boolean;
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const postalCode = body.postalCode;
  const clientStreets: Array<{ name: string; municipality?: string }> = body.streets;

  if (!postalCode || !ALLOWED_POSTALS.includes(postalCode)) {
    return NextResponse.json({ error: `Code postal invalide. Autorisés : ${ALLOWED_POSTALS.join(", ")}` }, { status: 400 });
  }

  if (!Array.isArray(clientStreets) || clientStreets.length === 0) {
    return NextResponse.json({ error: "Aucune rue fournie." }, { status: 400 });
  }

  const { supabaseAdmin } = await import("@/lib/supabase-server");

  try {
    const seen = new Set<string>();
    const deduped: StreetRow[] = [];

    for (const s of clientStreets) {
      if (!s.name || typeof s.name !== "string") continue;
      const key = normalize(s.name);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push({
        name: s.name,
        name_normalized: key,
        postal_code: postalCode,
        municipality: s.municipality || "Mouscron",
        source: "best_address",
        active: true,
      });
    }

    if (deduped.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        message: `Aucune rue valide pour ${postalCode}.`,
      });
    }

    let inserted = 0;
    const batchSize = 50;

    for (let i = 0; i < deduped.length; i += batchSize) {
      const batch = deduped.slice(i, i + batchSize);
      const { data, error } = await supabaseAdmin
        .from("streets")
        .upsert(batch, { onConflict: "name_normalized,postal_code" })
        .select();

      if (error) {
        return NextResponse.json({ error: `Erreur Supabase : ${error.message}` }, { status: 500 });
      }
      inserted += data?.length || 0;
    }

    return NextResponse.json({
      success: true,
      imported: inserted,
      postalCode,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
