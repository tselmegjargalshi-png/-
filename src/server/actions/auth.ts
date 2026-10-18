"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { clientIp, createSession, destroySession, hashPassword, verifyPassword } from "../auth";
import { fieldErrors } from "../guard";
import { rateLimit } from "../ratelimit";
import type { ActionState } from "@/lib/types";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Нэрээ оруулна уу.").max(60, "Нэр хэт урт байна."),
  email: z.string().trim().toLowerCase().email("Имэйл хаяг буруу байна."),
  password: z.string().min(8, "Нууц үг хамгийн багадаа 8 тэмдэгттэй байх ёстой.").max(100, "Нууц үг хэт урт байна."),
  role: z.enum(["USER", "OWNER"]).default("USER"),
});

function safeNext(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : null;
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ip = await clientIp();
  if (!rateLimit(`register:${ip}`, 8, 10 * 60_000)) return { ok: false, message: "Хэт олон оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу." };
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const { name, email, password, role } = parsed.data;
  const db = await getDb();
  const [exists] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (exists) return { ok: false, fieldErrors: { email: "Энэ имэйл хаягаар бүртгүүлсэн байна." } };
  const [u] = await db.insert(schema.users).values({ name, email, passwordHash: await hashPassword(password), role }).returning({ id: schema.users.id });
  await createSession(u.id);
  redirect(safeNext(formData.get("next")) ?? (role === "OWNER" ? "/biznes-burtguuleh" : "/"));
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Имэйл хаяг буруу байна."),
  password: z.string().min(1, "Нууц үгээ оруулна уу."),
});

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ip = await clientIp();
  if (!rateLimit(`login:${ip}`, 10, 10 * 60_000)) return { ok: false, message: "Хэт олон оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу." };
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, parsed.data.email)).limit(1);
  if (!u || !(await verifyPassword(parsed.data.password, u.passwordHash))) return { ok: false, message: "Имэйл эсвэл нууц үг буруу байна." };
  if (u.status !== "ACTIVE") return { ok: false, message: "Таны эрхийг түр хаасан байна. Тусламж авахын тулд бидэнтэй холбогдоно уу." };
  await createSession(u.id);
  redirect(safeNext(formData.get("next")) ?? (u.role === "ADMIN" ? "/udirdlaga" : u.role === "OWNER" ? "/biznes" : "/"));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Нэрээ оруулна уу.").max(60, "Нэр хэт урт байна."),
  phone: z.string().trim().max(20, "Утасны дугаар хэт урт байна.").optional(),
});

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { getViewer } = await import("../auth");
  const v = await getViewer();
  if (!v) return { ok: false, message: "Нэвтэрч орно уу." };
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const db = await getDb();
  await db.update(schema.users).set({ name: parsed.data.name, phone: parsed.data.phone || null }).where(eq(schema.users.id, v.id));
  return { ok: true, message: "Профайл шинэчлэгдлээ." };
}

const passwordSchema = z.object({
  current: z.string().min(1, "Одоогийн нууц үгээ оруулна уу."),
  next: z.string().min(8, "Шинэ нууц үг хамгийн багадаа 8 тэмдэгттэй байх ёстой.").max(100),
});

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { getViewer } = await import("../auth");
  const v = await getViewer();
  if (!v) return { ok: false, message: "Нэвтэрч орно уу." };
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, v.id)).limit(1);
  if (!u || !(await verifyPassword(parsed.data.current, u.passwordHash))) return { ok: false, fieldErrors: { current: "Одоогийн нууц үг буруу байна." } };
  await db.update(schema.users).set({ passwordHash: await hashPassword(parsed.data.next) }).where(eq(schema.users.id, v.id));
  return { ok: true, message: "Нууц үг амжилттай солигдлоо." };
}
