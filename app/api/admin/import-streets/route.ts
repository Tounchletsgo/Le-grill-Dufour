import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const BEST_API = "https://best.pr.fedservices.be/api/opendata/best/v1/belgianAddress/v2/addresses";
const PAGE_SIZE = 100;
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
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const postalCode = body.postalCode;

  if (!postalCode || !ALLOWED_POSTALS.includes(postalCode)) {
    return NextResponse.json({ error: `Code postal invalide. Autorisés : ${ALLOWED_POSTALS.join(", ")}` }, { status: 400 });
  }

  const { supabaseAdmin } = await import("@/lib/supabase-server");

  try {
    const streets = new Map<string, StreetRow>();
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const url = `${BEST_API}?postCode=${postalCode}&limit=${PAGE_SIZE}&offset=${offset}`;
      const res = await fetch(url);

      if (!res.ok) {
        return NextResponse.json({
          error: `L'API BeSt Address a répondu avec une erreur (${res.status}). Réessayez plus tard.`,
        }, { status: 502 });
      }

      const data = await res.json();
      const items = data.items || data.addresses || data;

      if (!Array.isArray(items) || items.length === 0) {
        hasMore = false;
        break;
      }

      for (const addr of items) {
        const streetName =
          addr.streetName?.fr ||
          addr.streetname?.fr ||
          addr.street_name?.fr ||
          addr.streetName ||
          addr.streetname ||
          addr.street_name ||
          null;

        const municipality =
          addr.municipalityName?.fr ||
          addr.municipality?.fr ||
          addr.municipalityName ||
          addr.municipality ||
          null;

        if (!streetName) continue;

        const key = normalize(streetName);
        if (!streets.has(key)) {
          streets.set(key, {
            name: streetName,
            name_normalized: key,
            postal_code: postalCode,
            municipality: municipality || "Mouscron",
            source: "best_address",
            active: true,
          });
        }
      }

      offset += PAGE_SIZE;
      if (items.length < PAGE_SIZE) hasMore = false;
    }

    const deduped = [...streets.values()];

    if (deduped.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        message: `Aucune rue trouvée pour ${postalCode}.`,
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
