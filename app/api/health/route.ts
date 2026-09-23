import { NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  let supabaseOk = false;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { supabaseAdmin } = await import("@/lib/supabase-server");
      const { error } = await supabaseAdmin
        .from("categories")
        .select("id")
        .limit(1);
      supabaseOk = !error;
    } catch {
      supabaseOk = false;
    }
  }

  const allEnvOk =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !!process.env.STRIPE_SECRET_KEY &&
    !!process.env.STRIPE_WEBHOOK_SECRET;

  const status = allEnvOk && supabaseOk ? "ok" : "degraded";

  const authResult = await checkApiAuth(request, "admin");
  if (authResult.authenticated) {
    const checks: Record<string, string> = {};
    checks.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING";
    checks.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "MISSING";
    checks.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "MISSING";
    checks.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ? "set" : "MISSING";
    checks.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ? "set" : "MISSING";

    return NextResponse.json({
      status,
      env: checks,
      supabase: supabaseOk ? "connected" : "error",
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({ status });
}
