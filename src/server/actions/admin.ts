"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { slugify } from "@/lib/ids";
import type { ActionState } from "@/lib/types";
import { fieldErrors, recomputeRating, requireAdmin } from "../guard";

type R = { ok: boolean; message: string };

async function guard<T extends R>(fn: (adminId: string) => Promise<T>): Promise<R> {
  let admin: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, message: "Танд энэ үйлдлийг хийх эрх байхгүй." };
  }
  try {
    const res = await fn(admin.id);
    revalidatePath("/udirdlaga");
    revalidatePath("/");
    return res;
  } catch {
    return { ok: false, message: "Үйлдэл амжилтгүй боллоо. Дахин оролдоно уу." };
  }
}

export async function adminSetBusinessStatus(id: string, status: "PENDING" | "ACTIVE" | "SUSPENDED") {
  return guard(async () => {
    if (!["PENDING", "ACTIVE", "SUSPENDED"].includes(status)) return { ok: false, message: "Төлөв буруу байна." };
    const db = await getDb();
    await db.update(schema.businesses).set({ status }).where(eq(schema.businesses.id, id));
    return { ok: true, message: status === "ACTIVE" ? "Бизнес нийтлэгдлээ." : status === "SUSPENDED" ? "Бизнес түр хаагдлаа." : "Бизнес хүлээгдэж буй төлөвт орлоо." };
  });
}

export async function adminToggleFeatured(id: string, featured: boolean) {
  return guard(async () => {
    const db = await getDb();
    await db.update(schema.businesses).set({ featured }).where(eq(schema.businesses.id, id));
    return { ok: true, message: featured ? "Онцлох бизнесийн жагсаалтад нэмэгдлээ." : "Онцлох жагсаалтаас хасагдлаа." };
  });
}

export async function adminDeleteBusiness(id: string) {
  return guard(async () => {
    const db = await getDb();
    await db.delete(schema.businesses).where(eq(schema.businesses.id, id));
    return { ok: true, message: "Бизнес устгагдлаа." };
  });
}

export async function adminSetUserStatus(id: string, status: "ACTIVE" | "BANNED") {
  return guard(async (adminId) => {
    if (id === adminId) return { ok: false, message: "Өөрийн эрхийг өөрчлөх боломжгүй." };
    const db = await getDb();
    await db.update(schema.users).set({ status }).where(eq(schema.users.id, id));
    return { ok: true, message: status === "BANNED" ? "Хэрэглэгчийн эрх хаагдлаа." : "Хэрэглэгчийн эрх сэргээгдлээ." };
  });
}

export async function adminSetUserRole(id: string, role: "USER" | "OWNER" | "ADMIN") {
  return guard(async (adminId) => {
    if (id === adminId) return { ok: false, message: "Өөрийн эрхийг өөрчлөх боломжгүй." };
    if (!["USER", "OWNER", "ADMIN"].includes(role)) return { ok: false, message: "Эрх буруу байна." };
    const db = await getDb();
    await db.update(schema.users).set({ role }).where(eq(schema.users.id, id));
    return { ok: true, message: "Хэрэглэгчийн эрх шинэчлэгдлээ." };
  });
}

export async function adminSetReviewStatus(id: string, status: "VISIBLE" | "HIDDEN") {
  return guard(async () => {
    const db = await getDb();
    const [r] = await db.update(schema.reviews).set({ status }).where(eq(schema.reviews.id, id)).returning({ businessId: schema.reviews.businessId });
    if (r) await recomputeRating(r.businessId);
    return { ok: true, message: status === "HIDDEN" ? "Сэтгэгдэл нуугдлаа." : "Сэтгэгдэл дахин харагдана." };
  });
}

export async function adminDeleteReview(id: string) {
  return guard(async () => {
    const db = await getDb();
    const [r] = await db.delete(schema.reviews).where(eq(schema.reviews.id, id)).returning({ businessId: schema.reviews.businessId });
    if (r) await recomputeRating(r.businessId);
    return { ok: true, message: "Сэтгэгдэл устгагдлаа." };
  });
}

export async function adminResolveReport(id: string, status: "RESOLVED" | "DISMISSED") {
  return guard(async () => {
    const db = await getDb();
    await db.update(schema.reports).set({ status }).where(eq(schema.reports.id, id));
    return { ok: true, message: status === "RESOLVED" ? "Гомдол шийдвэрлэгдлээ." : "Гомдлыг хэрэгсэхгүй болголоо." };
  });
}

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Нэр хамгийн багадаа 2 тэмдэгттэй байх ёстой.").max(40),
  icon: z.string().trim().min(1, "Дүрс сонгоно уу.").max(30),
  description: z.string().trim().max(120).default(""),
  keywords: z.string().default(""),
});

export async function adminSaveCategory(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: "Танд энэ үйлдлийг хийх эрх байхгүй." };
  }
  const parsed = categorySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const db = await getDb();
  const keywords = parsed.data.keywords.split(",").map((k) => k.trim()).filter(Boolean);
  if (parsed.data.id) {
    await db.update(schema.categories).set({ name: parsed.data.name, icon: parsed.data.icon, description: parsed.data.description, keywords }).where(eq(schema.categories.id, parsed.data.id));
  } else {
    const slug = slugify(parsed.data.name) || `angilal-${Date.now().toString(36)}`;
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.categories);
    await db.insert(schema.categories).values({ slug, name: parsed.data.name, icon: parsed.data.icon, description: parsed.data.description, keywords, sortOrder: n });
  }
  revalidatePath("/udirdlaga");
  revalidatePath("/");
  return { ok: true, message: "Ангилал хадгалагдлаа." };
}

export async function adminDeleteCategory(id: string) {
  return guard(async () => {
    const db = await getDb();
    const [used] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.businesses).where(eq(schema.businesses.categoryId, id));
    if (used.n > 0) return { ok: false, message: "Энэ ангилалд бизнес бүртгэлтэй тул устгах боломжгүй." };
    await db.delete(schema.categories).where(eq(schema.categories.id, id));
    return { ok: true, message: "Ангилал устгагдлаа." };
  });
}
