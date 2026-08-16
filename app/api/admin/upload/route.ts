import { NextRequest, NextResponse } from "next/server";
import { requireRole, getSupabaseAdmin } from "@/lib/auth";
import { processAndUpload } from "@/lib/upload";

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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const altText = formData.get("alt_text") as string;
    const cropDataStr = formData.get("crop") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
    }

    if (!altText?.trim()) {
      return NextResponse.json(
        { error: "Le texte alternatif est obligatoire (accessibilité et référencement)." },
        { status: 400 }
      );
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non supporté. Utilisez JPG, PNG, WebP ou GIF." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const cropData = cropDataStr ? JSON.parse(cropDataStr) : undefined;

    const result = await processAndUpload(buffer, file.name, cropData);

    const supabase = getSupabaseAdmin();
    const { data: imageRow, error } = await supabase
      .from("site_images")
      .insert({
        filename: file.name,
        alt_text: altText.trim(),
        storage_path: result.storagePath,
        url: result.url,
        width: result.width,
        height: result.height,
        size_bytes: result.sizeBytes,
        content_type: "image/webp",
        variants: result.variants.map((v) => ({ width: v.width, url: v.url })),
        uploaded_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ image: imageRow });
  } catch (e: any) {
    const status = e.message?.includes("trop lourde") ? 413 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}

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
      .from("site_images")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ images: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
