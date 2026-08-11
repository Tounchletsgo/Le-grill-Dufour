import type { SiteContent } from "@/types/database";

export async function getPageContent(
  page: string
): Promise<Record<string, Record<string, any>>> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {};
  }

  try {
    const { supabase } = await import("@/lib/supabase");
    const { data, error } = await supabase
      .from("site_content")
      .select("block_key, content")
      .eq("page", page)
      .eq("is_published", true);

    if (error || !data) return {};

    const result: Record<string, Record<string, any>> = {};
    for (const row of data as Pick<SiteContent, "block_key" | "content">[]) {
      result[row.block_key] = row.content;
    }
    return result;
  } catch {
    return {};
  }
}
