import { NextRequest, NextResponse } from "next/server";
import { checkApiAuth, getSupabaseAdmin } from "@/lib/auth";

async function checkAuth(request: NextRequest) {
  const result = await checkApiAuth(request, "admin");
  return result.authenticated;
}

export async function GET(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
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
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
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
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
