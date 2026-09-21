import type { MetadataRoute } from "next";
import { routeMap } from "@/i18n/types";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://legrilldufour.be";
  const now = new Date().toISOString();

  const priorities: Record<string, number> = {
    "/": 1.0,
    "/la-carte": 0.9,
    "/commander": 0.9,
    "/reserver": 0.8,
    "/cheques-cadeaux": 0.7,
    "/contact": 0.7,
    "/mentions-legales": 0.3,
    "/politique-de-confidentialite": 0.3,
  };

  const entries: MetadataRoute.Sitemap = [];

  for (const [frRoute, map] of Object.entries(routeMap)) {
    if (frRoute === "/commander/checkout") continue;

    entries.push({
      url: `${base}${map.fr}`,
      lastModified: now,
      changeFrequency: frRoute === "/" || frRoute === "/commander" ? "weekly" : "monthly",
      priority: priorities[frRoute] ?? 0.5,
      alternates: {
        languages: {
          fr: `${base}${map.fr}`,
          "nl-BE": `${base}${map.nl}`,
        },
      },
    });

    entries.push({
      url: `${base}${map.nl}`,
      lastModified: now,
      changeFrequency: frRoute === "/" || frRoute === "/commander" ? "weekly" : "monthly",
      priority: priorities[frRoute] ?? 0.5,
      alternates: {
        languages: {
          fr: `${base}${map.fr}`,
          "nl-BE": `${base}${map.nl}`,
        },
      },
    });
  }

  return entries;
}
