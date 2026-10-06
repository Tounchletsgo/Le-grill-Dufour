const RESTAURANT_LAT = 50.7433;
const RESTAURANT_LNG = 3.2067;
const ROAD_FACTOR = 1.35;
const AVG_SPEED_KMH = 25;

const POSTAL_TRAVEL_DEFAULTS: Record<string, number> = {
  "7700": 10,
  "7711": 12,
  "7712": 15,
};
const FALLBACK_TRAVEL_MIN = 15;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateTravelMinutes(lat: number, lng: number): number {
  const straightKm = haversineKm(RESTAURANT_LAT, RESTAURANT_LNG, lat, lng);
  const roadKm = straightKm * ROAD_FACTOR;
  const minutes = Math.ceil((roadKm / AVG_SPEED_KMH) * 60);
  return Math.max(5, minutes);
}

export async function calculateETA(params: {
  streetName?: string;
  postalCode?: string;
  prepMinutes: number;
}): Promise<{ totalMinutes: number; travelMinutes: number; method: "coordinates" | "postal" | "default" }> {
  if (params.streetName && params.postalCode) {
    try {
      const { supabaseAdmin } = await import("@/lib/supabase-server");
      const normalized = params.streetName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[''`\-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const { data } = await supabaseAdmin
        .from("streets")
        .select("latitude, longitude")
        .eq("postal_code", params.postalCode)
        .ilike("name_normalized", `%${normalized.split(" ").filter((w: string) => w.length > 2).slice(0, 2).join("%")}%`)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(1)
        .maybeSingle();

      if (data?.latitude && data?.longitude) {
        const travelMinutes = estimateTravelMinutes(data.latitude, data.longitude);
        return {
          totalMinutes: params.prepMinutes + travelMinutes,
          travelMinutes,
          method: "coordinates",
        };
      }
    } catch {}
  }

  if (params.postalCode && POSTAL_TRAVEL_DEFAULTS[params.postalCode]) {
    const travelMinutes = POSTAL_TRAVEL_DEFAULTS[params.postalCode];
    return {
      totalMinutes: params.prepMinutes + travelMinutes,
      travelMinutes,
      method: "postal",
    };
  }

  return {
    totalMinutes: params.prepMinutes + FALLBACK_TRAVEL_MIN,
    travelMinutes: FALLBACK_TRAVEL_MIN,
    method: "default",
  };
}
