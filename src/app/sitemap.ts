import type { MetadataRoute } from "next";
import { getCategories, getSlugs } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const [slugs, cats] = await Promise.all([getSlugs(), getCategories()]);
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/tukhai`, changeFrequency: "monthly", priority: 0.4 },
    ...cats.map((c) => ({ url: `${base}/angilal/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...slugs.map((s) => ({ url: `${base}/biznes/${s.slug}`, lastModified: s.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
