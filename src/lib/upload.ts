import sharp from "sharp";
import { getSupabaseAdmin } from "./auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const SIZES = [
  { width: 2000, suffix: "full" },
  { width: 1200, suffix: "lg" },
  { width: 800, suffix: "md" },
  { width: 400, suffix: "sm" },
];

export interface UploadResult {
  url: string;
  storagePath: string;
  width: number;
  height: number;
  sizeBytes: number;
  variants: { width: number; url: string; storagePath: string }[];
}

export async function processAndUpload(
  buffer: Buffer,
  filename: string,
  cropData?: { x: number; y: number; width: number; height: number }
): Promise<UploadResult> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`Image trop lourde (${(buffer.length / 1024 / 1024).toFixed(1)} Mo). Maximum : 10 Mo.`);
  }

  let pipeline = sharp(buffer);

  if (cropData) {
    pipeline = pipeline.extract({
      left: Math.round(cropData.x),
      top: Math.round(cropData.y),
      width: Math.round(cropData.width),
      height: Math.round(cropData.height),
    });
  }

  const metadata = await pipeline.metadata();
  const baseName = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();
  const timestamp = Date.now();
  const supabase = getSupabaseAdmin();

  const fullBuffer = await pipeline.webp({ quality: 82 }).toBuffer();
  const fullMeta = await sharp(fullBuffer).metadata();
  const mainPath = `content/${timestamp}_${baseName}.webp`;

  const { error: uploadError } = await supabase.storage
    .from("site-images")
    .upload(mainPath, fullBuffer, { contentType: "image/webp", upsert: true });

  if (uploadError) throw new Error(`Erreur upload : ${uploadError.message}`);

  const { data: urlData } = supabase.storage
    .from("site-images")
    .getPublicUrl(mainPath);

  const variants: UploadResult["variants"] = [];

  for (const size of SIZES) {
    if ((fullMeta.width || 0) <= size.width) continue;

    const resized = await sharp(fullBuffer)
      .resize(size.width, undefined, { fit: "inside" })
      .webp({ quality: 80 })
      .toBuffer();

    const varPath = `content/${timestamp}_${baseName}_${size.suffix}.webp`;
    await supabase.storage
      .from("site-images")
      .upload(varPath, resized, { contentType: "image/webp", upsert: true });

    const { data: varUrl } = supabase.storage
      .from("site-images")
      .getPublicUrl(varPath);

    variants.push({ width: size.width, url: varUrl.publicUrl, storagePath: varPath });
  }

  return {
    url: urlData.publicUrl,
    storagePath: mainPath,
    width: fullMeta.width || 0,
    height: fullMeta.height || 0,
    sizeBytes: fullBuffer.length,
    variants,
  };
}
