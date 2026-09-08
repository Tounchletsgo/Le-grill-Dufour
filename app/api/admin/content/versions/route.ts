import { NextRequest, NextResponse } from "next/server";
import { requireRole, getSupabaseAdmin, checkAdminPin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    const pin = request.headers.get("x-admin-pin");

    if (auth) {
      await requireRole(auth, "admin");
    } else if (pin) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const check = checkAdminPin(pin, ip);
      if (!check.valid) return NextResponse.json({ error: check.error }, { status: 401 });
    } else {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const contentId = request.nextUrl.searchParams.get("contentId");
    if (!contentId) return NextResponse.json({ error: "contentId requis" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("content_versions")
      .select("*")
      .eq("content_id", contentId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    return NextResponse.json({ versions: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    const pin = request.headers.get("x-admin-pin");

    if (auth) {
      await requireRole(auth, "admin");
    } else if (pin) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const check = checkAdminPin(pin, ip);
      if (!check.valid) return NextResponse.json({ error: check.error }, { status: 401 });
    } else {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { action, versionId } = await request.json();

    if (action === "restore") {
      const supabase = getSupabaseAdmin();
      const { data: version } = await supabase
        .from("content_versions")
        .select("content, content_id")
        .eq("id", versionId)
        .single();

      if (!version) return NextResponse.json({ error: "Version introuvable" }, { status: 404 });

      await supabase
        .from("site_content")
        .update({ draft: version.content })
        .eq("id", version.content_id);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
