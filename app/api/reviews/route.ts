import { NextResponse } from "next/server";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      config: null,
      reviews: [],
      debug: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const [configRes, reviewsRes] = await Promise.all([
      supabaseAdmin.from("google_reviews_config").select("*").limit(1).single(),
      supabaseAdmin
        .from("google_reviews")
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),
    ]);

    if (configRes.error || reviewsRes.error) {
      return NextResponse.json({
        config: null,
        reviews: [],
        debug: {
          configError: configRes.error?.message || null,
          reviewsError: reviewsRes.error?.message || null,
        },
      });
    }

    return NextResponse.json({
      config: configRes.data || null,
      reviews: reviewsRes.data || [],
    });
  } catch (e: unknown) {
    return NextResponse.json({
      config: null,
      reviews: [],
      debug: { error: e instanceof Error ? e.message : String(e) },
    });
  }
}
