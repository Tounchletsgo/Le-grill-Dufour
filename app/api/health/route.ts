import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, string> = {};

  checks.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING";
  checks.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "MISSING";
  checks.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "MISSING";
  checks.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ? "set" : "MISSING";
  checks.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ? "set" : "MISSING";

  let supabaseOk = false;
  let supabaseError = "";
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { supabaseAdmin } = await import("@/lib/supabase-server");
      const { data, error } = await supabaseAdmin
        .from("categories")
        .select("id")
        .limit(1);
      if (error) {
        supabaseError = `Query failed: ${error.message} (code: ${error.code})`;
      } else {
        supabaseOk = true;
      }
    } catch (err: any) {
      supabaseError = `Connection failed: ${err?.message || String(err)}`;
    }
  } else {
    supabaseError = "Missing env vars";
  }

  const allEnvOk = !Object.values(checks).includes("MISSING");

  return NextResponse.json({
    status: allEnvOk && supabaseOk ? "ok" : "degraded",
    env: checks,
    supabase: supabaseOk ? "connected" : supabaseError,
    timestamp: new Date().toISOString(),
  });
}
