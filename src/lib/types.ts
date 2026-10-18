import type { OpeningHours } from "@/db/schema";

export type BusinessSummary = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  categorySlug: string;
  categoryName: string;
  categoryIcon: string;
  categoryKeywords: string[];
  locationSlug: string;
  locationName: string;
  districtName: string | null;
  address: string;
  lat: number;
  lng: number;
  priceLevel: number;
  ratingAvg: number;
  reviewCount: number;
  featured: boolean;
  coverUrl: string;
  logoUrl: string;
  popularService: string;
  hours: OpeningHours;
  tags: string[];
  serviceNames: string[];
  minPrice: number;
};

export type CategoryInfo = { slug: string; name: string; icon: string; description: string };
export type LocationInfo = { slug: string; name: string; kind: string; lat: number; lng: number };

export type Viewer = { id: string; name: string; email: string; role: "USER" | "OWNER" | "ADMIN" } | null;

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
  data?: Record<string, unknown>;
};

export const initialState: ActionState = { ok: false };
