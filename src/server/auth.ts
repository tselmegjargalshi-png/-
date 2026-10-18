import { cache } from "react";
import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { getDb, schema } from "@/db";
import type { Viewer } from "@/lib/types";

const COOKIE = "nb_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET тохируулаагүй байна.");
    return new TextEncoder().encode("nomad-business-dev-secret-not-for-production");
  }
  return new TextEncoder().encode(s);
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function createSession(userId: string) {
  const token = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(userId).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Одоогийн хэрэглэгч. Хүсэлт бүрт нэг л удаа өгөгдлийн сангаас уншина. */
export const getViewer = cache(async (): Promise<Viewer> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const db = await getDb();
    const [u] = await db.select().from(schema.users).where(eq(schema.users.id, payload.sub)).limit(1);
    if (!u || u.status !== "ACTIVE") return null;
    return { id: u.id, name: u.name, email: u.email, role: u.role };
  } catch {
    return null;
  }
});

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}
