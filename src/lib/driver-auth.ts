import { timingSafeEqual } from "crypto";

const driverPinAttempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of driverPinAttempts) {
    if (record.blockedUntil > 0 && record.blockedUntil < now) {
      driverPinAttempts.delete(ip);
    }
  }
}, 60_000);

function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export interface DriverSession {
  id: string;
  name: string;
}

export async function authenticateDriver(
  pin: string | null,
  ip: string
): Promise<{ driver?: DriverSession; error?: string }> {
  if (!pin) return { error: "PIN requis" };

  const now = Date.now();
  const record = driverPinAttempts.get(ip);

  if (record && record.blockedUntil > now) {
    const minutes = Math.ceil((record.blockedUntil - now) / 60_000);
    return { error: `Trop de tentatives. Réessayez dans ${minutes} min.` };
  }

  const { supabaseAdmin } = await import("@/lib/supabase-server");
  const { data: drivers, error } = await supabaseAdmin
    .from("drivers")
    .select("id, name, pin")
    .eq("is_active", true);

  if (error || !drivers) {
    return { error: "Erreur serveur" };
  }

  const matched = drivers.find((d: { id: string; name: string; pin: string }) =>
    timingSafeCompare(pin, d.pin)
  );

  if (matched) {
    driverPinAttempts.delete(ip);
    return { driver: { id: matched.id, name: matched.name } };
  }

  const entry = record && record.blockedUntil <= now ? record : { count: 0, blockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION_MS;
  }
  driverPinAttempts.set(ip, entry);
  return { error: "PIN incorrect" };
}

export async function verifyDriverSession(
  driverId: string
): Promise<DriverSession | null> {
  const { supabaseAdmin } = await import("@/lib/supabase-server");
  const { data } = await supabaseAdmin
    .from("drivers")
    .select("id, name")
    .eq("id", driverId)
    .eq("is_active", true)
    .single();

  if (!data) return null;
  return { id: data.id, name: data.name };
}
