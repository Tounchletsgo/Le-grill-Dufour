import { NextRequest, NextResponse } from "next/server";
import { requireRole, getSupabaseAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    const pin = request.headers.get("x-admin-pin");

    if (auth) {
      await requireRole(auth, "admin");
    } else if (!pin) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("site_content")
      .select("*")
      .order("page")
      .order("block_key");

    if (error) throw error;
    return NextResponse.json({ blocks: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === "Non authentifié" || e.message === "Accès refusé" ? 403 : 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    const pin = request.headers.get("x-admin-pin");

    if (auth) {
      await requireRole(auth, "admin");
    } else if (!pin) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id, draft } = await request.json();
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("site_content")
      .update({ draft, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    const pin = request.headers.get("x-admin-pin");
    let userId: string | null = null;

    if (auth) {
      const authResult = await requireRole(auth, "admin");
      userId = authResult.userId;
    } else if (!pin) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { action, id, content } = await request.json();

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
        published_by: userId,
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
      const { versionId } = await request.json();
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
      const { page, block_key, block_label } = await request.json();
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
