"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import type { DayKey, OpeningHours } from "@/db/schema";
import { CATEGORY_THEME, artUrl, logoUrl } from "@/lib/art";
import { DAY_KEYS } from "@/lib/format";
import { slugify } from "@/lib/ids";
import type { ActionState } from "@/lib/types";
import { clientIp } from "../auth";
import { PHONE_RE, fieldErrors, requireBusinessAccess, requireViewer } from "../guard";
import { rateLimit } from "../ratelimit";
import { saveUpload } from "../storage";

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

const serviceInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Үйлчилгээний нэр хамгийн багадаа 2 тэмдэгттэй байх ёстой.").max(80),
  price: z.coerce.number().int().min(0, "Үнэ сөрөг байж болохгүй.").max(100_000_000),
  duration: z.coerce.number().int().min(5).max(1440).default(30),
  bookable: z.coerce.boolean().default(true),
});

const businessSchema = z.object({
  name: z.string().trim().min(2, "Бизнесийн нэрээ оруулна уу.").max(80, "Нэр хэт урт байна."),
  categorySlug: z.string().min(1, "Ангилал сонгоно уу."),
  tagline: z.string().trim().max(90, "Товч тайлбар 90 тэмдэгтээс хэтрэхгүй байх ёстой.").default(""),
  description: z.string().trim().min(20, "Тайлбар хамгийн багадаа 20 тэмдэгттэй байх ёстой.").max(1500, "Тайлбар хэт урт байна."),
  locationSlug: z.string().min(1, "Байршил сонгоно уу."),
  address: z.string().trim().min(3, "Хаягаа оруулна уу.").max(160),
  phone: z.string().trim().regex(PHONE_RE, "Утасны дугаар 8 оронтой байх ёстой."),
  email: z.string().trim().email("Имэйл хаяг буруу байна.").or(z.literal("")).default(""),
  website: z.string().trim().max(120).default(""),
  instagram: z.string().trim().max(60).default(""),
  facebook: z.string().trim().max(120).default(""),
  priceLevel: z.coerce.number().int().min(1).max(4).default(2),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

function cleanHandle(v: string) {
  const s = v.trim().replace(/^https?:\/\/(www\.)?(instagram\.com|facebook\.com)\//i, "").replace(/\/+$/, "");
  return s ? (s.startsWith("@") ? s : `@${s}`) : "";
}

function cleanWebsite(v: string) {
  return v.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function parseHours(fd: FormData): OpeningHours | null {
  const out = {} as OpeningHours;
  for (const d of DAY_KEYS) {
    if (fd.get(`hours_${d}_closed`)) {
      out[d] = null;
      continue;
    }
    const o = String(fd.get(`hours_${d}_open`) ?? "");
    const c = String(fd.get(`hours_${d}_close`) ?? "");
    if (!timeRe.test(o) || !(timeRe.test(c) || c === "24:00")) return null;
    if (c <= o && c !== "24:00") return null;
    out[d as DayKey] = [o, c];
  }
  return out;
}

function parseServices(fd: FormData) {
  try {
    const raw = JSON.parse(String(fd.get("services") ?? "[]"));
    const parsed = z.array(serviceInput).max(30).safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function resolveLocation(slug: string, district: string | null) {
  const db = await getDb();
  const rows = await db.select().from(schema.locations).where(inArray(schema.locations.slug, district ? [slug, district] : [slug]));
  const base = rows.find((r) => r.slug === slug);
  if (!base) return null;
  const dist = district ? rows.find((r) => r.slug === district && r.parentId === base.id) : undefined;
  return dist ?? base;
}

async function uniqueSlug(name: string) {
  const db = await getDb();
  const base = slugify(name) || "biznes";
  for (let i = 0; i < 6; i++) {
    const candidate = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const [hit] = await db.select({ id: schema.businesses.id }).from(schema.businesses).where(eq(schema.businesses.slug, candidate)).limit(1);
    if (!hit) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function coords(data: { lat?: number; lng?: number }, loc: { lat: number; lng: number }) {
  const ok = data.lat != null && data.lng != null && Number.isFinite(data.lat) && Number.isFinite(data.lng) && data.lat > 41 && data.lat < 52.5 && data.lng > 87 && data.lng < 120;
  if (ok) return { lat: data.lat!, lng: data.lng! };
  return { lat: loc.lat + (Math.random() - 0.5) * 0.01, lng: loc.lng + (Math.random() - 0.5) * 0.014 };
}

export async function createBusinessAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const v = await requireViewer().catch(() => null);
  if (!v) return { ok: false, message: "Бизнесээ бүртгүүлэхийн тулд нэвтэрч орно уу." };
  const ip = await clientIp();
  if (!rateLimit(`biz-create:${v.id}`, 5, 60 * 60_000) || !rateLimit(`biz-create-ip:${ip}`, 10, 60 * 60_000)) {
    return { ok: false, message: "Хэт олон бүртгэл илгээлээ. Түр хүлээгээд дахин оролдоно уу." };
  }
  const parsed = businessSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const hours = parseHours(fd);
  if (!hours) return { ok: false, fieldErrors: { hours: "Ажлын цагаа зөв оруулна уу (хаах цаг нээх цагаас хойш байх ёстой)." } };
  const svc = parseServices(fd);
  if (!svc || svc.length === 0) return { ok: false, fieldErrors: { services: "Хамгийн багадаа нэг үйлчилгээ нэмнэ үү." } };

  const db = await getDb();
  const [cat] = await db.select().from(schema.categories).where(eq(schema.categories.slug, parsed.data.categorySlug)).limit(1);
  if (!cat) return { ok: false, fieldErrors: { categorySlug: "Ангилал олдсонгүй." } };
  const district = String(fd.get("district") ?? "") || null;
  const loc = await resolveLocation(parsed.data.locationSlug, district);
  if (!loc) return { ok: false, fieldErrors: { locationSlug: "Байршил олдсонгүй." } };

  const theme = CATEGORY_THEME[cat.slug] ?? "other";
  const slug = await uniqueSlug(parsed.data.name);
  const logo = await saveUpload(fd.get("logo") as File | null, v.id);
  const photos: string[] = [];
  for (const f of fd.getAll("photos").slice(0, 6)) {
    const url = await saveUpload(f as File, v.id);
    if (url) photos.push(url);
  }
  const { lat, lng } = coords(parsed.data, loc);
  const popular = svc.find((s) => s.bookable) ?? svc[0];
  const id = crypto.randomUUID();
  const moderate = process.env.MODERATE_NEW_BUSINESSES === "true";

  await db.insert(schema.businesses).values({
    id, slug, name: parsed.data.name, tagline: parsed.data.tagline, description: parsed.data.description, categoryId: cat.id, locationId: loc.id,
    address: parsed.data.address, lat, lng, phone: parsed.data.phone, email: parsed.data.email, website: cleanWebsite(parsed.data.website),
    instagram: cleanHandle(parsed.data.instagram), facebook: cleanHandle(parsed.data.facebook).replace(/^@/, ""), priceLevel: parsed.data.priceLevel,
    status: moderate ? "PENDING" : "ACTIVE", featured: false, isDemo: false, logoUrl: logo ?? logoUrl(slug, theme),
    coverUrl: photos[0] ?? artUrl(theme, `${slug}-0`), hours, popularService: popular.name, tags: [],
  });
  await db.insert(schema.services).values(svc.map((s, i) => ({ businessId: id, name: s.name, priceMnt: s.price, durationMin: s.duration, bookable: s.bookable, popular: i === 0, sortOrder: i })));
  const imgs = photos.length ? photos : [0, 1, 2].map((i) => artUrl(theme, `${slug}-${i}`));
  await db.insert(schema.images).values(imgs.map((url, i) => ({ businessId: id, url, alt: `${parsed.data.name}, ${i + 1}-р зураг`, sortOrder: i })));
  await db.insert(schema.businessOwners).values({ userId: v.id, businessId: id });
  if (v.role === "USER") await db.update(schema.users).set({ role: "OWNER" }).where(eq(schema.users.id, v.id));
  revalidatePath("/");
  redirect(`/biznes?uusgesen=${slug}`);
}

export async function updateBusinessAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const businessId = String(fd.get("businessId") ?? "");
  const v = await requireBusinessAccess(businessId).catch(() => null);
  if (!v) return { ok: false, message: "Танд энэ бизнесийг засах эрх байхгүй." };
  const parsed = businessSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const hours = parseHours(fd);
  if (!hours) return { ok: false, fieldErrors: { hours: "Ажлын цагаа зөв оруулна уу (хаах цаг нээх цагаас хойш байх ёстой)." } };
  const db = await getDb();
  const [cat] = await db.select().from(schema.categories).where(eq(schema.categories.slug, parsed.data.categorySlug)).limit(1);
  if (!cat) return { ok: false, fieldErrors: { categorySlug: "Ангилал олдсонгүй." } };
  const loc = await resolveLocation(parsed.data.locationSlug, String(fd.get("district") ?? "") || null);
  if (!loc) return { ok: false, fieldErrors: { locationSlug: "Байршил олдсонгүй." } };
  const [current] = await db.select().from(schema.businesses).where(eq(schema.businesses.id, businessId)).limit(1);
  if (!current) return { ok: false, message: "Бизнес олдсонгүй." };

  const logo = await saveUpload(fd.get("logo") as File | null, v.id);
  const photos: string[] = [];
  for (const f of fd.getAll("photos").slice(0, 6)) {
    const url = await saveUpload(f as File, v.id);
    if (url) photos.push(url);
  }
  const co = parsed.data.lat != null && parsed.data.lng != null ? coords(parsed.data, loc) : { lat: current.lat, lng: current.lng };
  await db.update(schema.businesses).set({
    name: parsed.data.name, tagline: parsed.data.tagline, description: parsed.data.description, categoryId: cat.id, locationId: loc.id,
    address: parsed.data.address, lat: co.lat, lng: co.lng, phone: parsed.data.phone, email: parsed.data.email,
    website: cleanWebsite(parsed.data.website), instagram: cleanHandle(parsed.data.instagram),
    facebook: cleanHandle(parsed.data.facebook).replace(/^@/, ""), priceLevel: parsed.data.priceLevel, hours,
    ...(logo ? { logoUrl: logo } : {}),
  }).where(eq(schema.businesses.id, businessId));
  if (photos.length) {
    const existing = await db.select({ n: schema.images.id }).from(schema.images).where(eq(schema.images.businessId, businessId));
    await db.insert(schema.images).values(photos.map((url, i) => ({ businessId, url, alt: `${parsed.data.name}, зураг`, sortOrder: existing.length + i })));
    if (current.coverUrl.startsWith("/art/")) await db.update(schema.businesses).set({ coverUrl: photos[0] }).where(eq(schema.businesses.id, businessId));
  }
  revalidatePath("/");
  revalidatePath(`/biznes/${current.slug}`);
  revalidatePath("/biznes");
  return { ok: true, message: "Профайл шинэчлэгдлээ." };
}

export async function saveServiceAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const businessId = String(fd.get("businessId") ?? "");
  const v = await requireBusinessAccess(businessId).catch(() => null);
  if (!v) return { ok: false, message: "Танд энэ бизнесийг засах эрх байхгүй." };
  const parsed = serviceInput.safeParse({
    id: fd.get("id") || undefined, name: fd.get("name"), price: fd.get("price"), duration: fd.get("duration"), bookable: fd.get("bookable") === "on",
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const db = await getDb();
  if (parsed.data.id) {
    await db.update(schema.services).set({ name: parsed.data.name, priceMnt: parsed.data.price, durationMin: parsed.data.duration, bookable: parsed.data.bookable })
      .where(and(eq(schema.services.id, parsed.data.id), eq(schema.services.businessId, businessId)));
  } else {
    const existing = await db.select({ id: schema.services.id }).from(schema.services).where(eq(schema.services.businessId, businessId));
    await db.insert(schema.services).values({ businessId, name: parsed.data.name, priceMnt: parsed.data.price, durationMin: parsed.data.duration, bookable: parsed.data.bookable, sortOrder: existing.length });
  }
  revalidatePath("/biznes");
  return { ok: true, message: "Үйлчилгээ хадгалагдлаа." };
}

export async function deleteServiceAction(serviceId: string): Promise<{ ok: boolean; message: string }> {
  const db = await getDb();
  const [svc] = await db.select().from(schema.services).where(eq(schema.services.id, serviceId)).limit(1);
  if (!svc) return { ok: false, message: "Үйлчилгээ олдсонгүй." };
  const v = await requireBusinessAccess(svc.businessId).catch(() => null);
  if (!v) return { ok: false, message: "Танд энэ үйлдлийг хийх эрх байхгүй." };
  const left = await db.select({ id: schema.services.id }).from(schema.services).where(eq(schema.services.businessId, svc.businessId));
  if (left.length <= 1) return { ok: false, message: "Хамгийн багадаа нэг үйлчилгээ үлдэх ёстой." };
  await db.delete(schema.services).where(eq(schema.services.id, serviceId));
  revalidatePath("/biznes");
  return { ok: true, message: "Үйлчилгээ устгагдлаа." };
}

export async function deleteImageAction(imageId: string): Promise<{ ok: boolean; message: string }> {
  const db = await getDb();
  const [img] = await db.select().from(schema.images).where(eq(schema.images.id, imageId)).limit(1);
  if (!img) return { ok: false, message: "Зураг олдсонгүй." };
  const v = await requireBusinessAccess(img.businessId).catch(() => null);
  if (!v) return { ok: false, message: "Танд энэ үйлдлийг хийх эрх байхгүй." };
  await db.delete(schema.images).where(eq(schema.images.id, imageId));
  revalidatePath("/biznes");
  return { ok: true, message: "Зураг устгагдлаа." };
}
