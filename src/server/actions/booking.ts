"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { clientIp, getViewer } from "../auth";
import { PHONE_RE, fieldErrors } from "../guard";
import { rateLimit } from "../ratelimit";
import { busySlots, ownsBusiness } from "../queries";
import { addDays, formatMinutes, parseHm, ubDate, ubParts, weekdayOf } from "@/lib/format";
import { bookingCode } from "@/lib/ids";
import type { ActionState } from "@/lib/types";

export type Slot = { time: string; available: boolean };

const MIN_LEAD_MIN = 30;
const MAX_DAYS_AHEAD = 60;

async function loadContext(businessId: string, serviceId: string, staffId?: string | null) {
  const db = await getDb();
  const [biz] = await db.select().from(schema.businesses).where(eq(schema.businesses.id, businessId)).limit(1);
  if (!biz || biz.status !== "ACTIVE") return null;
  const [svc] = await db.select().from(schema.services).where(and(eq(schema.services.id, serviceId), eq(schema.services.businessId, businessId))).limit(1);
  if (!svc || !svc.bookable) return null;
  const staffRows = await db.select().from(schema.staff).where(eq(schema.staff.businessId, businessId));
  const chosen = staffId ? staffRows.find((s) => s.id === staffId) ?? null : null;
  if (staffId && !chosen) return null;
  return { biz, svc, staffRows, chosen };
}

function computeSlots(hours: [string, string] | null, ymd: string, durationMin: number, now: Date) {
  if (!hours) return [] as number[];
  const open = parseHm(hours[0]);
  const close = Math.min(parseHm(hours[1]), 1440);
  const step = close - open > 14 * 60 ? 60 : 30;
  const out: number[] = [];
  for (let m = open; m + durationMin <= close; m += step) {
    if (ubDate(ymd, m).getTime() >= now.getTime() + MIN_LEAD_MIN * 60_000) out.push(m);
  }
  return out;
}

function overlaps(start: number, dur: number, otherStart: number, otherDur: number) {
  return start < otherStart + otherDur && otherStart < start + dur;
}

export async function availabilityAction(input: { businessId: string; serviceId: string; staffId?: string | null; date: string }): Promise<{ slots: Slot[] }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { slots: [] };
  const ctx = await loadContext(input.businessId, input.serviceId, input.staffId);
  if (!ctx) return { slots: [] };
  const now = new Date();
  const today = ubParts(now).ymd;
  if (input.date < today || input.date > addDays(today, MAX_DAYS_AHEAD)) return { slots: [] };
  const candidates = computeSlots(ctx.biz.hours[weekdayOf(input.date)], input.date, ctx.svc.durationMin, now);
  const dayStart = ubDate(input.date, 0);
  const busy = await busySlots(input.businessId, dayStart.toISOString(), ubDate(addDays(input.date, 1), 0).toISOString(), ctx.chosen?.id ?? null);
  const capacity = ctx.chosen ? 1 : Math.max(ctx.staffRows.length, 3);
  const slots = candidates.map((m) => {
    const concurrent = busy.filter((b) => {
      const bm = ubParts(b.startsAt).minutes;
      return overlaps(m, ctx.svc.durationMin, bm, b.durationMin);
    }).length;
    return { time: formatMinutes(m), available: concurrent < capacity };
  });
  return { slots };
}

const bookingSchema = z.object({
  businessId: z.string().min(1),
  serviceId: z.string().min(1),
  staffId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Огноогоо сонгоно уу."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Цагаа сонгоно уу."),
  name: z.string().trim().min(2, "Нэрээ оруулна уу.").max(60, "Нэр хэт урт байна."),
  phone: z.string().trim().regex(PHONE_RE, "Утасны дугаар 8 оронтой байх ёстой."),
  note: z.string().trim().max(300, "Тэмдэглэл хэт урт байна.").optional(),
});

export type BookingResult = ActionState & {
  data?: { code: string; serviceName: string; when: string; businessName: string; staffName: string | null; price: number };
};

export async function createBookingAction(_prev: ActionState, formData: FormData): Promise<BookingResult> {
  const ip = await clientIp();
  if (!rateLimit(`booking:${ip}`, 8, 10 * 60_000)) return { ok: false, message: "Хэт олон захиалга илгээлээ. Түр хүлээгээд дахин оролдоно уу." };
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const ctx = await loadContext(d.businessId, d.serviceId, d.staffId || null);
  if (!ctx) return { ok: false, message: "Сонгосон үйлчилгээ захиалах боломжгүй байна." };

  const now = new Date();
  const today = ubParts(now).ymd;
  if (d.date < today || d.date > addDays(today, MAX_DAYS_AHEAD)) return { ok: false, fieldErrors: { date: "Энэ огноог сонгох боломжгүй." } };
  const minutes = parseHm(d.time);
  const valid = computeSlots(ctx.biz.hours[weekdayOf(d.date)], d.date, ctx.svc.durationMin, now);
  if (!valid.includes(minutes)) return { ok: false, fieldErrors: { time: "Сонгосон цагт захиалах боломжгүй байна." } };

  // Цаг давхцсан эсэхийг дахин шалгана.
  const availability = await availabilityAction({ businessId: d.businessId, serviceId: d.serviceId, staffId: d.staffId || null, date: d.date });
  if (!availability.slots.find((s) => s.time === d.time)?.available) {
    return { ok: false, fieldErrors: { time: "Энэ цаг дөнгөж сая захиалагдлаа. Өөр цаг сонгоно уу." } };
  }

  const v = await getViewer();
  const db = await getDb();
  const startsAt = ubDate(d.date, minutes);
  let code = bookingCode();
  for (let i = 0; i < 3; i++) {
    const [clash] = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(eq(schema.bookings.code, code)).limit(1);
    if (!clash) break;
    code = bookingCode();
  }
  await db.insert(schema.bookings).values({
    code, businessId: d.businessId, serviceId: ctx.svc.id, staffId: ctx.chosen?.id ?? null, userId: v?.id ?? null,
    serviceName: ctx.svc.name, priceMnt: ctx.svc.priceMnt, customerName: d.name, phone: d.phone, note: d.note ?? "",
    startsAt, durationMin: ctx.svc.durationMin, status: "PENDING",
  });
  revalidatePath("/hereglegch");
  revalidatePath("/biznes");
  return {
    ok: true,
    message: "Захиалга амжилттай баталгаажлаа.",
    data: {
      code, serviceName: ctx.svc.name, businessName: ctx.biz.name, staffName: ctx.chosen?.name ?? null, price: ctx.svc.priceMnt,
      when: `${d.date} ${d.time}`,
    },
  };
}

const statusSchema = z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]);

/** Захиалгын төлөвийг өөрчилнө: эзэмшигч/админ бүх төлөв, захиалсан хэрэглэгч зөвхөн цуцлах эрхтэй. */
export async function setBookingStatusAction(bookingId: string, status: string): Promise<{ ok: boolean; message: string }> {
  const parsedStatus = statusSchema.safeParse(status);
  if (!parsedStatus.success) return { ok: false, message: "Төлөв буруу байна." };
  const v = await getViewer();
  if (!v) return { ok: false, message: "Нэвтэрч орно уу." };
  const db = await getDb();
  const [b] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, bookingId)).limit(1);
  if (!b) return { ok: false, message: "Захиалга олдсонгүй." };
  const isManager = v.role === "ADMIN" || (await ownsBusiness(v.id, b.businessId));
  const isGuestOwner = b.userId === v.id;
  if (!isManager && !(isGuestOwner && parsedStatus.data === "CANCELLED")) return { ok: false, message: "Танд энэ үйлдлийг хийх эрх байхгүй." };
  await db.update(schema.bookings).set({ status: parsedStatus.data }).where(eq(schema.bookings.id, bookingId));
  revalidatePath("/hereglegch");
  revalidatePath("/biznes");
  revalidatePath("/udirdlaga");
  return { ok: true, message: parsedStatus.data === "CANCELLED" ? "Захиалга цуцлагдлаа." : "Төлөв шинэчлэгдлээ." };
}
