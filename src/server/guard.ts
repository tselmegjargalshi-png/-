import { and, eq, sql } from "drizzle-orm";
import type { ZodError } from "zod";
import { getDb, schema } from "@/db";
import { getViewer } from "./auth";
import { ownsBusiness } from "./queries";
import { ubParts } from "@/lib/format";
import type { Viewer } from "@/lib/types";

export class AuthError extends Error {}

export async function requireViewer(): Promise<NonNullable<Viewer>> {
  const v = await getViewer();
  if (!v) throw new AuthError("Нэвтэрч орно уу.");
  return v;
}

export async function requireAdmin() {
  const v = await requireViewer();
  if (v.role !== "ADMIN") throw new AuthError("Танд энэ үйлдлийг хийх эрх байхгүй.");
  return v;
}

/** Бизнесийн эзэмшигч эсвэл админ эсэхийг шалгана. */
export async function requireBusinessAccess(businessId: string) {
  const v = await requireViewer();
  if (v.role === "ADMIN") return v;
  if (!(await ownsBusiness(v.id, businessId))) throw new AuthError("Танд энэ бизнесийг удирдах эрх байхгүй.");
  return v;
}

export function fieldErrors(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function recomputeRating(businessId: string) {
  const db = await getDb();
  const [agg] = await db
    .select({ avg: sql<number>`coalesce(avg(${schema.reviews.rating}), 0)::float`, n: sql<number>`count(*)::int` })
    .from(schema.reviews)
    .where(and(eq(schema.reviews.businessId, businessId), eq(schema.reviews.status, "VISIBLE")));
  await db
    .update(schema.businesses)
    .set({ ratingAvg: Math.round(agg.avg * 10) / 10, reviewCount: agg.n })
    .where(eq(schema.businesses.id, businessId));
}

export async function bumpStat(businessId: string, field: "impressions" | "profileViews" | "contacts") {
  const db = await getDb();
  const day = ubParts(new Date()).ymd;
  const col = { impressions: schema.dailyStats.impressions, profileViews: schema.dailyStats.profileViews, contacts: schema.dailyStats.contacts }[field];
  await db
    .insert(schema.dailyStats)
    .values({ businessId, day, [field]: 1 })
    .onConflictDoUpdate({ target: [schema.dailyStats.businessId, schema.dailyStats.day], set: { [field]: sql`${col} + 1` } });
}

export const PHONE_RE = /^(\+?976[\s-]?)?\d{4}[\s-]?\d{4}$/;
