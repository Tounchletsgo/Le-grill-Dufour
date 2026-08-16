#!/usr/bin/env node
/**
 * Import des rues depuis BeSt Address (SPF BOSA) vers Supabase.
 *
 * Usage :
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_KEY=service_role_key \
 *     node scripts/import-streets.mjs
 *
 * Codes postaux configurés : 7700, 7711, 7712 (commune de Mouscron).
 * Réexécutable sans doublons (upsert sur name_normalized + postal_code).
 */

const POSTAL_CODES = ["7700", "7711", "7712"];
const BEST_API = "https://best.pr.fedservices.be/api/opendata/best/v1/belgianAddress/v2/addresses";
const PAGE_SIZE = 100;

function normalize(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchStreetsForPostal(postalCode) {
  const streets = new Map();
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const url = `${BEST_API}?postCode=${postalCode}&limit=${PAGE_SIZE}&offset=${offset}`;
    console.log(`  Fetching ${url}`);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${await res.text()}`);
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
        });
      }
    }

    offset += PAGE_SIZE;
    if (items.length < PAGE_SIZE) hasMore = false;

    await new Promise((r) => setTimeout(r, 300));
  }

  return [...streets.values()];
}

async function importToSupabase(streets) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Variables SUPABASE_URL et SUPABASE_KEY requises.\n" +
      "Utilise la service_role key (pas la anon key)."
    );
  }

  const batchSize = 50;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < streets.length; i += batchSize) {
    const batch = streets.slice(i, i + batchSize);

    const res = await fetch(`${url}/rest/v1/streets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Batch error at offset ${i}: ${res.status} ${text}`);
      continue;
    }

    const result = await res.json();
    inserted += result.length;
    process.stdout.write(`  ${i + batch.length}/${streets.length}\r`);
  }

  return { inserted, updated };
}

function exportToJSON(streets, path) {
  const { writeFileSync } = await import("fs");
  writeFileSync(path, JSON.stringify(streets, null, 2), "utf-8");
  console.log(`Exported ${streets.length} streets to ${path}`);
}

async function main() {
  console.log("=== Import des rues BeSt Address ===\n");
  console.log(`Codes postaux : ${POSTAL_CODES.join(", ")}\n`);

  const allStreets = [];

  for (const pc of POSTAL_CODES) {
    console.log(`\nCode postal ${pc} :`);
    try {
      const streets = await fetchStreetsForPostal(pc);
      console.log(`  → ${streets.length} rues trouvées`);
      allStreets.push(...streets);
    } catch (err) {
      console.error(`  Erreur pour ${pc}: ${err.message}`);
      console.error(`  Tu peux fournir un CSV à la place.`);
    }
  }

  if (allStreets.length === 0) {
    console.error("\nAucune rue récupérée. Vérifie l'accès à l'API BeSt Address.");
    console.error("Alternative : fournis un CSV avec colonnes name,postal_code,municipality");
    process.exit(1);
  }

  const unique = new Map();
  for (const s of allStreets) {
    unique.set(`${s.name_normalized}::${s.postal_code}`, s);
  }
  const deduped = [...unique.values()];

  console.log(`\nTotal : ${deduped.length} rues uniques\n`);

  if (process.argv.includes("--json")) {
    const outPath = process.argv[process.argv.indexOf("--json") + 1] || "streets.json";
    const { writeFileSync } = await import("node:fs");
    writeFileSync(outPath, JSON.stringify(deduped, null, 2), "utf-8");
    console.log(`Export JSON : ${outPath}`);
    return;
  }

  console.log("Import Supabase...");
  const { inserted } = await importToSupabase(deduped);
  console.log(`\nTerminé : ${inserted} rues importées/mises à jour.`);
}

main().catch((err) => {
  console.error("\nErreur fatale :", err.message);
  process.exit(1);
});
