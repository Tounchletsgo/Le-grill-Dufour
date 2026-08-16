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
