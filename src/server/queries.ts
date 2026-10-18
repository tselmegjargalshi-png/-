import { and, asc, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb, schema } from "@/db";
import type { BusinessSummary, CategoryInfo, LocationInfo } from "@/lib/types";
import { addDays, ubParts } from "@/lib/format";

const { businesses, categories, locations, services, staff, images, reviews, bookings, savedBusinesses, dailyStats, users, businessOwners, reports, contactRequests } = schema;

export async function getCategories(): Promise<CategoryInfo[]> {
  const db = await getDb();
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  return rows.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon, description: c.description }));
}

export async function getCategoriesFull() {
  const db = await getDb();
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function getLocationList(): Promise<LocationInfo[]> {
  const db = await getDb();
  const rows = await db.select().from(locations).orderBy(asc(locations.sortOrder));
  return rows.filter((l) => l.kind !== "DISTRICT").map((l) => ({ slug: l.slug, name: l.name, kind: l.kind, lat: l.lat, lng: l.lng }));
}

export async function getLocationRows() {
  const db = await getDb();
  return db.select().from(locations).orderBy(asc(locations.sortOrder));
}

const parent = alias(locations, "parent_location");

function summaryColumns() {
  return {
    id: businesses.id, slug: businesses.slug, name: businesses.name, tagline: businesses.tagline,
    categorySlug: categories.slug, categoryName: categories.name, categoryIcon: categories.icon, categoryKeywords: categories.keywords,
    locSlug: locations.slug, locName: locations.name, locKind: locations.kind,
    parentSlug: parent.slug, parentName: parent.name,
    address: businesses.address, lat: businesses.lat, lng: businesses.lng, priceLevel: businesses.priceLevel,
    ratingAvg: businesses.ratingAvg, reviewCount: businesses.reviewCount, featured: businesses.featured,
    coverUrl: businesses.coverUrl, logoUrl: businesses.logoUrl, popularService: businesses.popularService,
    hours: businesses.hours, tags: businesses.tags,
  };
}

type SummaryRow = Awaited<ReturnType<typeof selectSummaries>>[number];

async function selectSummaries(where?: ReturnType<typeof and>) {
  const db = await getDb();
  return db
    .select(summaryColumns())
    .from(businesses)
    .innerJoin(categories, eq(businesses.categoryId, categories.id))
    .innerJoin(locations, eq(businesses.locationId, locations.id))
    .leftJoin(parent, eq(locations.parentId, parent.id))
    .where(where)
    .orderBy(desc(businesses.featured), desc(businesses.ratingAvg), asc(businesses.name));
}

async function toSummaries(rows: SummaryRow[]): Promise<BusinessSummary[]> {
  if (rows.length === 0) return [];
  const db = await getDb();
  const svc = await db
    .select({ businessId: services.businessId, name: services.name, price: services.priceMnt })
    .from(services)
    .where(inArray(services.businessId, rows.map((r) => r.id)));
  const byBiz = new Map<string, Array<{ name: string; price: number }>>();
  for (const s of svc) {
    const list = byBiz.get(s.businessId) ?? [];
    list.push({ name: s.name, price: s.price });
    byBiz.set(s.businessId, list);
  }
  return rows.map((r) => {
    const list = byBiz.get(r.id) ?? [];
    const paid = list.map((x) => x.price).filter((p) => p > 0);
    return {
      id: r.id, slug: r.slug, name: r.name, tagline: r.tagline,
      categorySlug: r.categorySlug, categoryName: r.categoryName, categoryIcon: r.categoryIcon, categoryKeywords: r.categoryKeywords,
      locationSlug: r.parentSlug ?? r.locSlug, locationName: r.parentName ?? r.locName,
      districtName: r.parentName ? r.locName : null,
      address: r.address, lat: r.lat, lng: r.lng, priceLevel: r.priceLevel, ratingAvg: r.ratingAvg, reviewCount: r.reviewCount,
      featured: r.featured, coverUrl: r.coverUrl, logoUrl: r.logoUrl, popularService: r.popularService, hours: r.hours, tags: r.tags,
      serviceNames: list.map((x) => x.name), minPrice: paid.length ? Math.min(...paid) : 0,
    };
  });
}

export async function getActiveSummaries(): Promise<BusinessSummary[]> {
  const rows = await selectSummaries(eq(businesses.status, "ACTIVE"));
  return toSummaries(rows);
}

export async function getSummariesByCategory(slug: string): Promise<BusinessSummary[]> {
  const rows = await selectSummaries(and(eq(businesses.status, "ACTIVE"), eq(categories.slug, slug)));
  return toSummaries(rows);
}

export async function getSummariesByIds(ids: string[]): Promise<BusinessSummary[]> {
  if (ids.length === 0) return [];
  const rows = await selectSummaries(and(inArray(businesses.id, ids), eq(businesses.status, "ACTIVE")));
  return toSummaries(rows);
}

export type BusinessDetail = Awaited<ReturnType<typeof getBusinessDetail>>;

export async function getBusinessDetail(slug: string, opts: { includeInactiveFor?: string | null; isAdmin?: boolean } = {}) {
  const db = await getDb();
  const [row] = await db
    .select({ b: businesses, cat: categories, loc: locations, parentName: parent.name, parentSlug: parent.slug })
    .from(businesses)
    .innerJoin(categories, eq(businesses.categoryId, categories.id))
    .innerJoin(locations, eq(businesses.locationId, locations.id))
    .leftJoin(parent, eq(locations.parentId, parent.id))
    .where(eq(businesses.slug, slug))
    .limit(1);
  if (!row) return null;

  if (row.b.status !== "ACTIVE") {
    let allowed = !!opts.isAdmin;
    if (!allowed && opts.includeInactiveFor) {
      const [o] = await db.select().from(businessOwners).where(and(eq(businessOwners.businessId, row.b.id), eq(businessOwners.userId, opts.includeInactiveFor))).limit(1);
      allowed = !!o;
    }
    if (!allowed) return null;
  }

  const [svc, stf, imgs, revs] = await Promise.all([
    db.select().from(services).where(eq(services.businessId, row.b.id)).orderBy(asc(services.sortOrder)),
    db.select().from(staff).where(eq(staff.businessId, row.b.id)).orderBy(asc(staff.sortOrder)),
    db.select().from(images).where(eq(images.businessId, row.b.id)).orderBy(asc(images.sortOrder)),
    db.select().from(reviews).where(and(eq(reviews.businessId, row.b.id), eq(reviews.status, "VISIBLE"))).orderBy(desc(reviews.createdAt)),
  ]);
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({ star, count: revs.filter((r) => r.rating === star).length }));
  return {
    business: row.b,
    category: row.cat,
    locationName: row.parentName ?? row.loc.name,
    locationSlug: row.parentSlug ?? row.loc.slug,
    districtName: row.parentName ? row.loc.name : null,
    services: svc,
    staff: stf,
    images: imgs,
    reviews: revs,
    breakdown,
  };
}

export async function getSavedIds(userId: string | null | undefined): Promise<string[]> {
  if (!userId) return [];
  const db = await getDb();
  const rows = await db.select({ id: savedBusinesses.businessId }).from(savedBusinesses).where(eq(savedBusinesses.userId, userId));
  return rows.map((r) => r.id);
}

export async function getSlugs(): Promise<Array<{ slug: string; updatedAt: Date }>> {
  const db = await getDb();
  const rows = await db.select({ slug: businesses.slug, createdAt: businesses.createdAt }).from(businesses).where(eq(businesses.status, "ACTIVE"));
  return rows.map((r) => ({ slug: r.slug, updatedAt: r.createdAt }));
}

export async function getUserBookings(userId: string) {
  const db = await getDb();
  return db
    .select({ b: bookings, businessName: businesses.name, businessSlug: businesses.slug, logoUrl: businesses.logoUrl })
    .from(bookings)
    .innerJoin(businesses, eq(bookings.businessId, businesses.id))
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.startsAt));
}

export async function getUserReviews(userId: string) {
  const db = await getDb();
  return db
    .select({ r: reviews, businessName: businesses.name, businessSlug: businesses.slug })
    .from(reviews)
    .innerJoin(businesses, eq(reviews.businessId, businesses.id))
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt));
}

export async function getOwnedBusinesses(userId: string) {
  const db = await getDb();
  return db
    .select({ b: businesses, categoryName: categories.name })
    .from(businessOwners)
    .innerJoin(businesses, eq(businessOwners.businessId, businesses.id))
    .innerJoin(categories, eq(businesses.categoryId, categories.id))
    .where(eq(businessOwners.userId, userId))
    .orderBy(asc(businesses.name));
}

export async function ownsBusiness(userId: string, businessId: string): Promise<boolean> {
  const db = await getDb();
  const [o] = await db.select().from(businessOwners).where(and(eq(businessOwners.userId, userId), eq(businessOwners.businessId, businessId))).limit(1);
  return !!o;
}

export async function getOwnerOverview(businessId: string) {
  const db = await getDb();
  const since = addDays(ubParts(new Date()).ymd, -29);
  const stats = await db.select().from(dailyStats).where(and(eq(dailyStats.businessId, businessId), gte(dailyStats.day, since))).orderBy(asc(dailyStats.day));
  const totals = stats.reduce((a, s) => ({ impressions: a.impressions + s.impressions, profileViews: a.profileViews + s.profileViews, contacts: a.contacts + s.contacts }), { impressions: 0, profileViews: 0, contacts: 0 });
  const bks = await db.select().from(bookings).where(eq(bookings.businessId, businessId)).orderBy(desc(bookings.startsAt));
  const revenue = bks.filter((b) => b.status === "COMPLETED" || b.status === "CONFIRMED").reduce((a, b) => a + b.priceMnt, 0);
  const msgs = await db.select().from(contactRequests).where(eq(contactRequests.businessId, businessId)).orderBy(desc(contactRequests.createdAt)).limit(20);
  const revs = await db.select().from(reviews).where(eq(reviews.businessId, businessId)).orderBy(desc(reviews.createdAt)).limit(20);
  const svc = await db.select().from(services).where(eq(services.businessId, businessId)).orderBy(asc(services.sortOrder));
  const imgs = await db.select().from(images).where(eq(images.businessId, businessId)).orderBy(asc(images.sortOrder));
  return { stats, totals, bookings: bks, revenue, messages: msgs, reviews: revs, services: svc, images: imgs };
}

export async function getAdminOverview() {
  const db = await getDb();
  const one = async (t: typeof businesses | typeof users | typeof reviews | typeof bookings | typeof reports) => (await db.select({ n: count() }).from(t))[0].n;
  const [nb, nu, nr, nk, nrep] = await Promise.all([one(businesses), one(users), one(reviews), one(bookings), one(reports)]);
  const pending = (await db.select({ n: count() }).from(businesses).where(eq(businesses.status, "PENDING")))[0].n;
  const openReports = (await db.select({ n: count() }).from(reports).where(eq(reports.status, "OPEN")))[0].n;
  return { businesses: nb, users: nu, reviews: nr, bookings: nk, reports: nrep, pending, openReports };
}

export async function adminBusinesses() {
  const db = await getDb();
  return db
    .select({ b: businesses, categoryName: categories.name, locName: locations.name })
    .from(businesses)
    .innerJoin(categories, eq(businesses.categoryId, categories.id))
    .innerJoin(locations, eq(businesses.locationId, locations.id))
    .orderBy(desc(businesses.createdAt));
}

export async function adminUsers() {
  const db = await getDb();
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status, createdAt: users.createdAt, isDemo: users.isDemo }).from(users).orderBy(desc(users.createdAt));
}

export async function adminReviews() {
  const db = await getDb();
  return db
    .select({ r: reviews, businessName: businesses.name, businessSlug: businesses.slug })
    .from(reviews)
    .innerJoin(businesses, eq(reviews.businessId, businesses.id))
    .orderBy(desc(reviews.createdAt))
    .limit(120);
}

export async function adminBookings() {
  const db = await getDb();
  return db
    .select({ b: bookings, businessName: businesses.name })
    .from(bookings)
    .innerJoin(businesses, eq(bookings.businessId, businesses.id))
    .orderBy(desc(bookings.createdAt))
    .limit(120);
}

export async function adminReports() {
  const db = await getDb();
  const rows = await db.select().from(reports).orderBy(desc(reports.createdAt)).limit(100);
  const reviewIds = rows.filter((r) => r.targetType === "REVIEW").map((r) => r.targetId);
  const bizIds = rows.filter((r) => r.targetType === "BUSINESS").map((r) => r.targetId);
  const revs = reviewIds.length ? await db.select().from(reviews).where(inArray(reviews.id, reviewIds)) : [];
  const biz = bizIds.length ? await db.select({ id: businesses.id, name: businesses.name, slug: businesses.slug }).from(businesses).where(inArray(businesses.id, bizIds)) : [];
  return rows.map((r) => ({
    report: r,
    review: revs.find((x) => x.id === r.targetId) ?? null,
    business: biz.find((x) => x.id === r.targetId) ?? null,
  }));
}

/** Тухайн цагт давхцсан захиалгын тоо. Захиалгын цонхны завсарлагааг тооцохдоо ашиглана. */
export async function busySlots(businessId: string, fromIso: string, toIso: string, staffId?: string | null) {
  const db = await getDb();
  const rows = await db
    .select({ startsAt: bookings.startsAt, durationMin: bookings.durationMin, staffId: bookings.staffId })
    .from(bookings)
    .where(and(eq(bookings.businessId, businessId), sql`${bookings.status} in ('PENDING','CONFIRMED')`, sql`${bookings.startsAt} >= ${fromIso}::timestamptz`, sql`${bookings.startsAt} < ${toIso}::timestamptz`));
  return staffId ? rows.filter((r) => r.staffId === staffId) : rows;
}
