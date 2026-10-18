"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { clientIp, getViewer } from "../auth";
import { PHONE_RE, bumpStat, fieldErrors, recomputeRating } from "../guard";
import { rateLimit } from "../ratelimit";
import { saveUpload } from "../storage";
import type { ActionState } from "@/lib/types";

export async function toggleSaveAction(businessId: string): Promise<{ ok: boolean; saved?: boolean; needAuth?: boolean }> {
  const v = await getViewer();
  if (!v) return { ok: false, needAuth: true };
  const db = await getDb();
  const [existing] = await db.select().from(schema.savedBusinesses).where(and(eq(schema.savedBusinesses.userId, v.id), eq(schema.savedBusinesses.businessId, businessId))).limit(1);
  if (existing) {
    await db.delete(schema.savedBusinesses).where(and(eq(schema.savedBusinesses.userId, v.id), eq(schema.savedBusinesses.businessId, businessId)));
    revalidatePath("/hereglegch");
    return { ok: true, saved: false };
  }
  await db.insert(schema.savedBusinesses).values({ userId: v.id, businessId }).onConflictDoNothing();
  revalidatePath("/hereglegch");
  return { ok: true, saved: true };
}

export async function trackAction(businessId: string, kind: "impressions" | "profileViews" | "contacts"): Promise<void> {
  const ip = await clientIp();
  if (!rateLimit(`track:${ip}:${businessId}:${kind}`, 6, 60_000)) return;
  await bumpStat(businessId, kind);
}

const reviewSchema = z.object({
  businessId: z.string().min(1),
  slug: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Үнэлгээгээ сонгоно уу.").max(5, "Үнэлгээгээ сонгоно уу."),
  body: z.string().trim().min(10, "Сэтгэгдэл хамгийн багадаа 10 тэмдэгттэй байх ёстой.").max(1000, "Сэтгэгдэл хэт урт байна."),
});

export async function submitReviewAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const v = await getViewer();
  if (!v) return { ok: false, message: "Сэтгэгдэл бичихийн тулд нэвтэрч орно уу." };
  const ip = await clientIp();
  if (!rateLimit(`review:${v.id}`, 5, 10 * 60_000) || !rateLimit(`review-ip:${ip}`, 12, 10 * 60_000)) {
    return { ok: false, message: "Хэт олон удаа илгээлээ. Түр хүлээгээд дахин оролдоно уу." };
  }
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const { businessId, slug, rating, body } = parsed.data;
  const db = await getDb();
  const [owned] = await db.select().from(schema.businessOwners).where(and(eq(schema.businessOwners.businessId, businessId), eq(schema.businessOwners.userId, v.id))).limit(1);
  if (owned) return { ok: false, message: "Өөрийн бизнест сэтгэгдэл бичих боломжгүй." };
  const [dup] = await db.select({ id: schema.reviews.id }).from(schema.reviews).where(and(eq(schema.reviews.businessId, businessId), eq(schema.reviews.userId, v.id))).limit(1);
  if (dup) return { ok: false, message: "Та энэ бизнест аль хэдийн сэтгэгдэл бичсэн байна." };

  const photos: string[] = [];
  for (const f of formData.getAll("photos").slice(0, 2)) {
    const url = await saveUpload(f as File, v.id);
    if (url) photos.push(url);
  }
  await db.insert(schema.reviews).values({ businessId, userId: v.id, authorName: v.name, rating, body, photos });
  await recomputeRating(businessId);
  revalidatePath(`/biznes/${slug}`);
  return { ok: true, message: "Сэтгэгдэл илгээгдлээ. Баярлалаа!" };
}

export async function reportAction(targetType: "BUSINESS" | "REVIEW", targetId: string, reason: string): Promise<{ ok: boolean; message: string }> {
  const v = await getViewer();
  const ip = await clientIp();
  if (!rateLimit(`report:${ip}`, 5, 10 * 60_000)) return { ok: false, message: "Хэт олон удаа илгээлээ. Түр хүлээнэ үү." };
  const text = reason.trim();
  if (text.length < 5) return { ok: false, message: "Шалтгаанаа бага зэрэг дэлгэрэнгүй бичнэ үү." };
  const db = await getDb();
  await db.insert(schema.reports).values({ targetType, targetId, reporterId: v?.id ?? null, reason: text.slice(0, 500) });
  return { ok: true, message: "Гомдол илгээгдлээ. Манай баг хянан үзнэ." };
}

const contactSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().trim().min(2, "Нэрээ оруулна уу.").max(60),
  phone: z.string().trim().regex(PHONE_RE, "Утасны дугаар 8 оронтой байх ёстой."),
  message: z.string().trim().min(5, "Зурвасаа бичнэ үү.").max(500, "Зурвас хэт урт байна."),
});

export async function sendContactAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ip = await clientIp();
  if (!rateLimit(`contact:${ip}`, 6, 10 * 60_000)) return { ok: false, message: "Хэт олон удаа илгээлээ. Түр хүлээгээд дахин оролдоно уу." };
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const v = await getViewer();
  const db = await getDb();
  await db.insert(schema.contactRequests).values({ ...parsed.data, userId: v?.id ?? null });
  await bumpStat(parsed.data.businessId, "contacts");
  return { ok: true, message: "Зурвас илгээгдлээ. Бизнес тантай удахгүй холбогдоно." };
}
