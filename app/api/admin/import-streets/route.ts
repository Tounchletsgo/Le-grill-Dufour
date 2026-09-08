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
const PAGE_SIZE = 500;
const PARALLEL_PAGES = 5;
const FETCH_TIMEOUT_MS = 7000;

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[''`\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPage(postalCode: string, offset: number, signal: AbortSignal): Promise<any[]> {
  const url = `${BEST_API}?postCode=${postalCode}&limit=${PAGE_SIZE}&offset=${offset}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`BeSt API ${res.status}`);
  const data = await res.json();
  return data.items || data.addresses || (Array.isArray(data) ? data : []);
}

async function fetchStreetsFromBeSt(
  postalCode: string,
): Promise<Array<{ name: string; municipality: string }>> {
  const streets = new Map<string, { name: string; municipality: string }>();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const offsets = Array.from({ length: PARALLEL_PAGES }, (_, i) => offset + i * PAGE_SIZE);
      const batches = await Promise.all(
        offsets.map((o) => fetchPage(postalCode, o, controller.signal).catch(() => [] as any[]))
      );

      for (const items of batches) {
        if (!Array.isArray(items) || items.length === 0) {
          hasMore = false;
          continue;
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

          const key = streetName.toLowerCase().trim();
          if (!streets.has(key)) {
            streets.set(key, {
              name: streetName,
              municipality: municipality || POSTAL_CONFIG[postalCode] || "Mouscron",
            });
          }
        }

        if (items.length < PAGE_SIZE) {
          hasMore = false;
        }
      }

      offset += PARALLEL_PAGES * PAGE_SIZE;
    }
  } finally {
    clearTimeout(timeout);
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
  const postalCodes: string[] = body.postalCodes || (body.postalCode ? [body.postalCode] : null);

  if (!postalCodes) {
    return NextResponse.json({
      error: "Paramètre postalCode requis (un code postal à la fois)",
    }, { status: 400 });
  }

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
      const isAbort = err instanceof Error && err.name === "AbortError";
      return NextResponse.json({
        error: isAbort
          ? `Timeout pour ${pc} : l'API BeSt a mis trop de temps à répondre`
          : `Erreur pour ${pc} : ${msg}`,
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
