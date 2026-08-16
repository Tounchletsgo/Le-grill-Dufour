import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

const POSTAL_CODES = ["7700", "7711", "7712"];
const BEST_API = "https://best.pr.fedservices.be/api/opendata/best/v1/belgianAddress/v2/addresses";
const PAGE_SIZE = 100;

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[''`\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

interface StreetRow {
  name: string;
  name_normalized: string;
  postal_code: string;
  municipality: string;
  latitude: number | null;
  longitude: number | null;
  source: string;
  active: boolean;
}

async function fetchStreetsForPostal(postalCode: string): Promise<StreetRow[]> {
  const streets = new Map<string, StreetRow>();
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const url = `${BEST_API}?postCode=${postalCode}&limit=${PAGE_SIZE}&offset=${offset}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`API BeSt Address erreur ${res.status}`);
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

      const postal = addr.postCode || addr.postcode || addr.postal_code || postalCode;

      if (!streetName) continue;

      const key = `${normalize(streetName)}::${postal}`;
      if (!streets.has(key)) {
        streets.set(key, {
          name: streetName,
          name_normalized: normalize(streetName),
          postal_code: String(postal),
          municipality: municipality || "Mouscron",
          latitude: addr.latitude || addr.lat || null,
          longitude: addr.longitude || addr.lon || addr.lng || null,
          source: "best_address",
          active: true,
        });
      }
    }

    offset += PAGE_SIZE;
    if (items.length < PAGE_SIZE) hasMore = false;

    await new Promise((r) => setTimeout(r, 200));
  }

  return [...streets.values()];
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  const { supabaseAdmin } = await import("@/lib/supabase-server");

  try {
    const allStreets: StreetRow[] = [];
    const errors: string[] = [];

    for (const pc of POSTAL_CODES) {
      try {
        const streets = await fetchStreetsForPostal(pc);
        allStreets.push(...streets);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${pc}: ${msg}`);
      }
    }

    if (allStreets.length === 0) {
      return NextResponse.json({
        error: "Aucune rue récupérée depuis l'API BeSt Address.",
        details: errors,
      }, { status: 502 });
    }

    const unique = new Map<string, StreetRow>();
    for (const s of allStreets) {
      unique.set(`${s.name_normalized}::${s.postal_code}`, s);
    }
    const deduped = [...unique.values()];

    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < deduped.length; i += batchSize) {
      const batch = deduped.slice(i, i + batchSize);
      const { data, error } = await supabaseAdmin
        .from("streets")
        .upsert(batch, { onConflict: "name_normalized,postal_code" })
        .select();

      if (error) {
        errors.push(`Batch ${i}: ${error.message}`);
      } else {
        inserted += data?.length || 0;
      }
    }

    return NextResponse.json({
      success: true,
      imported: inserted,
      total: deduped.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
