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

const BEST_BASE = "https://best.pr.fedservices.be/api/opendata/best/v1/belgianAddress/v2";
const PAGE_SIZE = 500;
const FETCH_TIMEOUT_MS = 25000;

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[''`\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findLangString(obj: any): string | null {
  if (!obj || typeof obj !== "object") return typeof obj === "string" ? obj : null;
  if (obj.fr) return obj.fr;
  if (obj.nl) return obj.nl;
  if (obj.de) return obj.de;
  if (obj.spelling) return obj.spelling;
  for (const key of ["name", "streetName", "streetname", "label"]) {
    if (obj[key]) {
      const r = findLangString(obj[key]);
      if (r) return r;
    }
  }
  return null;
}

function extractStreetName(addr: any): string | null {
  if (typeof addr === "string") return null;
  for (const key of ["hasStreetName", "streetName", "streetname", "street_name", "street", "name"]) {
    const val = addr[key];
    if (!val) continue;
    const r = findLangString(val);
    if (r) return r;
  }
  return null;
}

function extractMunicipality(addr: any): string | null {
  for (const key of ["hasMunicipality", "hasPartOfMunicipality", "municipalityName", "municipality"]) {
    const val = addr[key];
    if (!val) continue;
    const r = findLangString(val);
    if (r) return r;
  }
  return null;
}

async function fetchViaStreetnames(
  postalCode: string,
): Promise<{ streets: Array<{ name: string; municipality: string }>; debug?: any } | null> {
  const streets = new Map<string, { name: string; municipality: string }>();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let debugSample: any = null;

  try {
    let offset = 0;
    for (let page = 0; page < 50; page++) {
      const url = `${BEST_BASE}/streetnames?postCode=${postalCode}&limit=${PAGE_SIZE}&offset=${offset}`;
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) return null;

      const data = await res.json();

      if (page === 0) {
        debugSample = {
          method: "streetnames",
          totalItems: data.totalItems || data.total || "?",
          totalPages: data.totalPages || "?",
          topLevelKeys: Object.keys(data),
          firstItemKeys: null as string[] | null,
        };
      }

      const items: any[] = data.items || data.streetNames || data.streetnames || data.results ||
        (Array.isArray(data) ? data : []);

      if (!Array.isArray(items) || items.length === 0) break;

      if (debugSample && !debugSample.firstItemKeys) {
        debugSample.firstItemKeys = Object.keys(items[0]);
      }

      for (const item of items) {
        const streetName = findLangString(item) || extractStreetName(item);
        if (!streetName) continue;

        const municipality = extractMunicipality(item) ||
          POSTAL_CONFIG[postalCode] || "Mouscron";

        const key = streetName.toLowerCase().trim();
        if (!streets.has(key)) {
          streets.set(key, { name: streetName, municipality });
        }
      }

      offset += items.length;
      if (items.length < PAGE_SIZE) break;
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }

  if (streets.size === 0) return null;
  return { streets: [...streets.values()], debug: debugSample };
}

async function fetchViaAddresses(
  postalCode: string,
): Promise<{ streets: Array<{ name: string; municipality: string }>; debug?: any }> {
  const streets = new Map<string, { name: string; municipality: string }>();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let debugSample: any = null;

  try {
    let offset = 0;
    for (let page = 0; page < 200; page++) {
      const url = `${BEST_BASE}/addresses?postCode=${postalCode}&limit=${PAGE_SIZE}&offset=${offset}`;
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) throw new Error(`BeSt API HTTP ${res.status}`);

      const data = await res.json();

      if (page === 0) {
        debugSample = {
          method: "addresses",
          totalItems: data.totalItems || data.total || "?",
          totalPages: data.totalPages || "?",
          topLevelKeys: Object.keys(data),
          firstItemKeys: null as string[] | null,
        };
      }

      const items: any[] = data.items || data.addresses || data.results ||
        (Array.isArray(data) ? data : []);

      if (!Array.isArray(items) || items.length === 0) break;

      if (debugSample && !debugSample.firstItemKeys) {
        debugSample.firstItemKeys = Object.keys(items[0]);
      }

      for (const addr of items) {
        const streetName = extractStreetName(addr);
        const municipality = extractMunicipality(addr);

        if (!streetName) continue;

        const key = streetName.toLowerCase().trim();
        if (!streets.has(key)) {
          streets.set(key, {
            name: streetName,
            municipality: municipality || POSTAL_CONFIG[postalCode] || "Mouscron",
          });
        }
      }

      offset += items.length;
      if (items.length < PAGE_SIZE) break;
    }
  } finally {
    clearTimeout(timeout);
  }

  return { streets: [...streets.values()], debug: debugSample };
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

  const results: Array<{ postalCode: string; fetched: number; imported: number; debug?: any }> = [];

  for (const pc of postalCodes) {
    try {
      const result = await fetchViaStreetnames(pc) || await fetchViaAddresses(pc);
      const { streets: bestStreets, debug } = result;

      if (bestStreets.length === 0) {
        results.push({ postalCode: pc, fetched: 0, imported: 0, debug });
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

      results.push({
        postalCode: pc,
        fetched: bestStreets.length,
        imported,
        debug: { apiTotal: debug?.totalItems, apiPages: debug?.totalPages, method: debug?.method },
      });
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
