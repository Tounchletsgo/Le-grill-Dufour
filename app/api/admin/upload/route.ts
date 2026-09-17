import { NextRequest, NextResponse } from "next/server";
import { checkApiAuth, getSupabaseAdmin } from "@/lib/auth";
import { processAndUpload } from "@/lib/upload";

export async function POST(request: NextRequest) {
  const authResult = await checkApiAuth(request, "admin");
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
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
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ image: imageRow });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status = msg.includes("trop lourde") ? 413 : 500;
    return NextResponse.json({ error: status === 500 ? "Server error" : msg }, { status });
  }
}

export async function GET(request: NextRequest) {
  const authResult = await checkApiAuth(request, "admin");
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("site_images")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ images: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
