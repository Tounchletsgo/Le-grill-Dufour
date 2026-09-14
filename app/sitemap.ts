import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://legrilldufour.be";
  const now = new Date().toISOString();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/la-carte`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/commander`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/reserver`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/cheques-cadeaux`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}
