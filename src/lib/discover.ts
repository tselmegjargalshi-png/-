import type { BusinessSummary } from "./types";
import { scoreDoc, tokenize } from "./search";
import { isOpenNow } from "./hours";

export type SortKey = "recommended" | "rating" | "priceLow" | "priceHigh" | "name";

export type Filters = {
  categories: string[];
  location: string | null;
  prices: number[];
  minRating: number;
  openNow: boolean;
  featured: boolean;
  service: string | null;
};

export const EMPTY_FILTERS: Filters = { categories: [], location: null, prices: [], minRating: 0, openNow: false, featured: false, service: null };

export function activeFilterCount(f: Filters): number {
  return (f.categories.length ? 1 : 0) + (f.location ? 1 : 0) + (f.prices.length ? 1 : 0) + (f.minRating ? 1 : 0) + (f.openNow ? 1 : 0) + (f.featured ? 1 : 0) + (f.service ? 1 : 0);
}

export function searchBusinesses(all: BusinessSummary[], query: string, filters: Filters, sort: SortKey, now: Date): BusinessSummary[] {
  const tokens = tokenize(query);
  const scored: Array<{ b: BusinessSummary; score: number }> = [];
  for (const b of all) {
    if (filters.categories.length && !filters.categories.includes(b.categorySlug)) continue;
    if (filters.location && b.locationSlug !== filters.location) continue;
    if (filters.prices.length && !filters.prices.includes(b.priceLevel)) continue;
    if (filters.minRating && b.ratingAvg < filters.minRating) continue;
    if (filters.featured && !b.featured) continue;
    if (filters.service && !b.serviceNames.includes(filters.service)) continue;
    if (filters.openNow && !isOpenNow(b.hours, now)) continue;
    const score = scoreDoc(
      { name: b.name, tagline: b.tagline, categoryName: b.categoryName, categoryKeywords: b.categoryKeywords, locationName: `${b.locationName} ${b.districtName ?? ""}`, address: b.address, tags: b.tags, services: b.serviceNames },
      tokens,
    );
    if (tokens.length && score === 0) continue;
    scored.push({ b, score });
  }
  const rec = (a: BusinessSummary, b: BusinessSummary) =>
    Number(b.featured) - Number(a.featured) || b.ratingAvg - a.ratingAvg || b.reviewCount - a.reviewCount;
  scored.sort((x, y) => {
    if (tokens.length && y.score !== x.score) return y.score - x.score;
    switch (sort) {
      case "rating": return y.b.ratingAvg - x.b.ratingAvg || y.b.reviewCount - x.b.reviewCount;
      case "priceLow": return x.b.priceLevel - y.b.priceLevel || rec(x.b, y.b);
      case "priceHigh": return y.b.priceLevel - x.b.priceLevel || rec(x.b, y.b);
      case "name": return x.b.name.localeCompare(y.b.name);
      default: return rec(x.b, y.b);
    }
  });
  return scored.map((s) => s.b);
}

export const SUGGESTIONS = ["Кофе уух газар", "Үсчин", "Фитнес", "Бэлэг", "Хувцас", "Лого хийлгэх", "Вэбсайт хийлгэх"];

export const SORT_LABELS: Record<SortKey, string> = {
  recommended: "Санал болгох",
  rating: "Өндөр үнэлгээтэй",
  priceLow: "Үнэ: хямдаас",
  priceHigh: "Үнэ: үнэтэйгээс",
  name: "Нэрээр (А-Я)",
};
