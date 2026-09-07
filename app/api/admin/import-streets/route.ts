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
  const expected = process.env.ADMIN_PIN;
  if (!expected) return false;
  return pin === expected;
}

const POSTAL_CONFIG: Record<string, string> = {
  "7700": "Mouscron",
  "7711": "Dottignies",
  "7712": "Herseaux",
};

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

async function fetchStreetsFromBeSt(
  postalCode: string,
): Promise<Array<{ name: string; municipality: string }>> {
  const streets = new Map<string, { name: string; municipality: string }>();
  let offset = 0;

  for (let page = 0; page < 200; page++) {
    const url = `${BEST_API}?postCode=${postalCode}&limit=${PAGE_SIZE}&offset=${offset}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`BeSt API returned ${res.status}`);
    }

    const data = await res.json();
    const items = data.items || data.addresses || data;

    if (!Array.isArray(items) || items.length === 0) break;

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

      const key = streetName.toLowerCase().trim();
      if (!streets.has(key)) {
        streets.set(key, {
          name: streetName,
          municipality: municipality || POSTAL_CONFIG[postalCode] || "Mouscron",
        });
      }
    }

    offset += PAGE_SIZE;
    if (items.length < PAGE_SIZE) break;
  }

  return [...streets.values()];
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
  const postalCodes: string[] = body.postalCodes || Object.keys(POSTAL_CONFIG);

  const invalid = postalCodes.filter((pc) => !POSTAL_CONFIG[pc]);
  if (invalid.length > 0) {
    return NextResponse.json({
      error: `Codes postaux invalides : ${invalid.join(", ")}. Autorisés : ${Object.keys(POSTAL_CONFIG).join(", ")}`,
    }, { status: 400 });
  }

  const { supabaseAdmin } = await import("@/lib/supabase-server");

  const results: Array<{ postalCode: string; fetched: number; imported: number }> = [];

  for (const pc of postalCodes) {
    try {
      const bestStreets = await fetchStreetsFromBeSt(pc);

      if (bestStreets.length === 0) {
        results.push({ postalCode: pc, fetched: 0, imported: 0 });
        continue;
      }

      const seen = new Set<string>();
      const rows: StreetRow[] = [];

      for (const s of bestStreets) {
        const key = normalize(s.name);
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({
          name: s.name,
          name_normalized: key,
          postal_code: pc,
          municipality: s.municipality,
          source: "best_address",
          active: true,
        });
      }

      let imported = 0;
      const batchSize = 50;

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { data, error } = await supabaseAdmin
          .from("streets")
          .upsert(batch, { onConflict: "name_normalized,postal_code" })
          .select();

        if (error) {
          return NextResponse.json({
            error: `Erreur Supabase pour ${pc} : ${error.message}`,
            partialResults: results,
          }, { status: 500 });
        }
        imported += data?.length || 0;
      }

      results.push({ postalCode: pc, fetched: bestStreets.length, imported });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({
        error: `Erreur pour ${pc} : ${msg}`,
        partialResults: results,
      }, { status: 500 });
    }
  }

  const totalImported = results.reduce((s, r) => s + r.imported, 0);

  return NextResponse.json({
    success: true,
    totalImported,
    details: results,
  });
}
