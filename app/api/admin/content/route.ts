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
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("site_content")
      .select("*")
      .order("page")
      .order("block_key");

    if (error) throw error;
    return NextResponse.json({ blocks: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { id, draft } = await request.json();
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("site_content")
      .update({ draft, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await checkApiAuth(request, "admin");
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, id, content, versionId, page, block_key, block_label } = body;

    const supabase = getSupabaseAdmin();

    if (action === "publish") {
      const { data: block } = await supabase
        .from("site_content")
        .select("id, draft, content")
        .eq("id", id)
        .single();

      if (!block) return NextResponse.json({ error: "Bloc introuvable" }, { status: 404 });

      const newContent = block.draft || content;
      if (!newContent) return NextResponse.json({ error: "Rien à publier" }, { status: 400 });

      await supabase.from("content_versions").insert({
        content_id: block.id,
        content: block.content,
      });

      const { error } = await supabase
        .from("site_content")
        .update({
          content: newContent,
          draft: null,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      const { data: versions } = await supabase
        .from("content_versions")
        .select("id")
        .eq("content_id", id)
        .order("created_at", { ascending: false })
        .range(10, 100);

      if (versions && versions.length > 0) {
        await supabase
          .from("content_versions")
          .delete()
          .in("id", versions.map((v) => v.id));
      }

      return NextResponse.json({ success: true });
    }

    if (action === "restore") {
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

    if (action === "create") {
      const { error } = await supabase.from("site_content").insert({
        page,
        block_key,
        block_label: block_label || block_key,
        content: content || {},
      });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
