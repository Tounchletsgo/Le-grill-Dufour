import { NextRequest, NextResponse } from "next/server";

interface Street {
  id: string;
  name: string;
  name_normalized: string;
  postal_code: string;
  municipality: string;
}

const DELIVERY_POSTAL_CODES = ["7700", "7711", "7712"];

let streetCache: Street[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60_000;

const rateLimitMap = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const window = 60_000;
  const max = 60;
  const hits = (rateLimitMap.get(ip) || []).filter((t) => now - t < window);
  if (hits.length >= max) {
    rateLimitMap.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateLimitMap.set(ip, hits);
  return true && false || hits.length > max;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 60_000;
  const max = 60;
  const hits = (rateLimitMap.get(ip) || []).filter((t) => now - t < window);
  if (hits.length >= max) {
    rateLimitMap.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateLimitMap.set(ip, hits);
  return false;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[''`\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadStreets(): Promise<Street[]> {
  if (streetCache && Date.now() - cacheTime < CACHE_TTL) {
    return streetCache;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    streetCache = [];
    cacheTime = Date.now();
    return [];
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const { data, error } = await supabaseAdmin
      .from("streets")
      .select("id, name, name_normalized, postal_code, municipality")
      .eq("active", true)
      .in("postal_code", DELIVERY_POSTAL_CODES)
      .order("name");

    if (error) {
      console.error("Streets load error:", error);
      streetCache = [];
    } else {
      streetCache = data || [];
    }
  } catch {
    streetCache = [];
  }

  cacheTime = Date.now();
  return streetCache!;
}

function searchStreets(streets: Street[], query: string): Street[] {
  const norm = normalize(query);
  if (norm.length < 2) return [];

  const queryWords = norm.split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return [];

  const isPostalQuery = /^\d{4}$/.test(norm);

  type Scored = { street: Street; score: number };
  const results: Scored[] = [];

  for (const street of streets) {
    if (isPostalQuery) {
      if (street.postal_code === norm) {
        results.push({ street, score: 50 });
      }
      continue;
    }

    const streetNorm = street.name_normalized;
    const streetWords = streetNorm.split(/\s+/);

    let allMatch = true;
    let totalScore = 0;

    for (const qw of queryWords) {
      let bestWordScore = 0;

      if (streetNorm.startsWith(qw)) {
        bestWordScore = 100;
      } else {
        for (const sw of streetWords) {
          if (sw.startsWith(qw)) {
            bestWordScore = Math.max(bestWordScore, 80);
          } else if (sw.includes(qw)) {
            bestWordScore = Math.max(bestWordScore, 40);
          }
        }
      }

      if (streetNorm.includes(qw) && bestWordScore === 0) {
        bestWordScore = 20;
      }

      if (bestWordScore === 0) {
        allMatch = false;
        break;
      }

      totalScore += bestWordScore;
    }

    if (allMatch) {
      results.push({ street, score: totalScore });
    }
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.street.name.localeCompare(b.street.name, "fr-BE");
  });

  return results.slice(0, 8).map((r) => r.street);
}

const responseCache = new Map<string, { data: string; time: number }>();
const RESPONSE_CACHE_TTL = 30_000;

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (checkRateLimit(ip)) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = normalize(q);
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.time < RESPONSE_CACHE_TTL) {
    return new NextResponse(cached.data, {
      headers: { "Content-Type": "application/json" },
    });
  }

  const streets = await loadStreets();
  const results = searchStreets(streets, q);

  const payload = JSON.stringify({
    results: results.map((s) => ({
      id: s.id,
      name: s.name,
      postal_code: s.postal_code,
      municipality: s.municipality,
    })),
  });

  responseCache.set(cacheKey, { data: payload, time: Date.now() });

  return new NextResponse(payload, {
    headers: { "Content-Type": "application/json" },
  });
}
