import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkApiAuth } from "@/lib/auth";

async function checkAuth(request: NextRequest) {
  const result = await checkApiAuth(request, "admin");
  return result.authenticated;
}

export async function GET(request: NextRequest) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const { data, error } = await supabaseAdmin
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

    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const { error } = await supabaseAdmin
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

    const { supabaseAdmin } = await import("@/lib/supabase-server");

    if (action === "publish") {
      const { data: block } = await supabaseAdmin
        .from("site_content")
        .select("id, draft, content")
        .eq("id", id)
        .single();

      if (!block) return NextResponse.json({ error: "Bloc introuvable" }, { status: 404 });

      const newContent = block.draft || content;
      if (!newContent) return NextResponse.json({ error: "Rien à publier" }, { status: 400 });

      const { error: versionError } = await supabaseAdmin.from("content_versions").insert({
        content_id: block.id,
        content: block.content,
      });

      if (versionError) {
        console.error("Content version backup failed:", versionError.message);
        return NextResponse.json({ error: "Impossible de sauvegarder la version précédente" }, { status: 500 });
      }

      const { error } = await supabaseAdmin
        .from("site_content")
        .update({
          content: newContent,
          draft: null,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      const { data: versions } = await supabaseAdmin
        .from("content_versions")
        .select("id")
        .eq("content_id", id)
        .order("created_at", { ascending: false })
        .range(10, 100);

      if (versions && versions.length > 0) {
        await supabaseAdmin
          .from("content_versions")
          .delete()
          .in("id", versions.map((v) => v.id));
      }

      revalidatePath("/", "layout");
      return NextResponse.json({ success: true });
    }

    if (action === "restore") {
      const { data: version } = await supabaseAdmin
        .from("content_versions")
        .select("content, content_id")
        .eq("id", versionId)
        .single();

      if (!version) return NextResponse.json({ error: "Version introuvable" }, { status: 404 });

      const { error: restoreError } = await supabaseAdmin
        .from("site_content")
        .update({ draft: version.content })
        .eq("id", version.content_id);

      if (restoreError) {
        console.error("Content restore failed:", restoreError.message);
        return NextResponse.json({ error: "Restauration échouée" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "create") {
      const { error } = await supabaseAdmin.from("site_content").insert({
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
