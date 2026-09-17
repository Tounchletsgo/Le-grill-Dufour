import { NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/auth";

async function checkAuth(request: NextRequest) {
  const result = await checkApiAuth(request, "admin");
  return result.authenticated;
}

export async function GET(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ config: null, reviews: [] });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");

    const [configRes, reviewsRes] = await Promise.all([
      supabaseAdmin.from("google_reviews_config").select("*").limit(1).single(),
      supabaseAdmin.from("google_reviews").select("*").order("sort_order"),
    ]);

    return NextResponse.json({
      config: configRes.data || null,
      reviews: reviewsRes.data || [],
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const body = await request.json();

    const { data: inserted, error } = await supabaseAdmin
      .from("google_reviews")
      .insert({
        author_name: body.author_name,
        rating: body.rating,
        review_date: body.review_date,
        review_text: body.review_text || "",
        sort_order: body.sort_order ?? 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    return NextResponse.json({ success: true, review: inserted });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const body = await request.json();

    if (body.config) {
      const { id, ...raw } = body.config;
      const configAllowed = ["place_id", "review_url", "auto_fetch"];
      const configData: Record<string, unknown> = {};
      for (const key of Object.keys(raw)) {
        if (configAllowed.includes(key)) configData[key] = raw[key];
      }
      if (Object.keys(configData).length > 0) {
        await supabaseAdmin.from("google_reviews_config").update(configData).eq("id", id);
      }
    }

    if (body.review) {
      const { id, ...raw } = body.review;
      const reviewAllowed = ["author_name", "rating", "review_date", "review_text", "sort_order", "is_active"];
      const reviewData: Record<string, unknown> = {};
      for (const key of Object.keys(raw)) {
        if (reviewAllowed.includes(key)) reviewData[key] = raw[key];
      }
      if (Object.keys(reviewData).length > 0) {
        await supabaseAdmin.from("google_reviews").update(reviewData).eq("id", id);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const { id } = await request.json();

    const { error } = await supabaseAdmin.from("google_reviews").delete().eq("id", id);
    if (error) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
