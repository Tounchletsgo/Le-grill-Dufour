import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

async function checkAuth(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth) {
    try {
      await requireRole(auth, "admin");
      return true;
    } catch {
      return false;
    }
  }
  const pin = request.headers.get("x-admin-pin");
  const expected = process.env.ADMIN_PIN;
  if (!expected) return false;
  return pin === expected;
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
      const { id, ...data } = body.config;
      await supabaseAdmin.from("google_reviews_config").update(data).eq("id", id);
    }

    if (body.review) {
      const { id, ...data } = body.review;
      await supabaseAdmin.from("google_reviews").update(data).eq("id", id);
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
