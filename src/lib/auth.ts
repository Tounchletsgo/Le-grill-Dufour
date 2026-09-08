import { createClient } from "@supabase/supabase-js";

export type UserRole = "admin" | "staff";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase config");
  return createClient(url, key);
}

export async function verifyAuth(
  authHeader: string | null
): Promise<{ userId: string; role: UserRole } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!roleRow) return null;
  return { userId: user.id, role: roleRow.role as UserRole };
}

export async function requireRole(
  authHeader: string | null,
  ...allowedRoles: UserRole[]
): Promise<{ userId: string; role: UserRole }> {
  const auth = await verifyAuth(authHeader);
  if (!auth) throw new Error("Non authentifié");
  if (!allowedRoles.includes(auth.role)) throw new Error("Accès refusé");
  return auth;
}

const pinAttempts = new Map<string, { count: number; blockedUntil: number }>();
const PIN_MAX_ATTEMPTS = 5;
const PIN_BLOCK_DURATION_MS = 15 * 60 * 1000;

export function checkAdminPin(pin: string | null, ip: string): { valid: boolean; error?: string } {
  const expected = process.env.ADMIN_PIN;
  if (!expected) return { valid: false, error: "Configuration manquante" };

  const now = Date.now();
  const record = pinAttempts.get(ip);

  if (record && record.blockedUntil > now) {
    const minutes = Math.ceil((record.blockedUntil - now) / 60_000);
    return { valid: false, error: `Trop de tentatives. Réessayez dans ${minutes} min.` };
  }

  if (pin === expected) {
    pinAttempts.delete(ip);
    return { valid: true };
  }

  const entry = record && record.blockedUntil <= now ? record : { count: 0, blockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= PIN_MAX_ATTEMPTS) {
    entry.blockedUntil = now + PIN_BLOCK_DURATION_MS;
  }
  pinAttempts.set(ip, entry);
  return { valid: false, error: "PIN incorrect" };
}
