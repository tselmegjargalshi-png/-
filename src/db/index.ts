import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { __nomadDb?: Promise<Db> };

/**
 * DATABASE_URL тохируулсан бол PostgreSQL (Supabase, Railway, Neon гэх мэт) рүү холбогдоно.
 * Тохируулаагүй бол процесс доторх PGlite (WASM Postgres) нь үзүүлэнгийн өгөгдөлтэйгээр сэргэнэ.
 */
export function getDb(): Promise<Db> {
  return (globalForDb.__nomadDb ??= init());
}

async function init(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const client = postgres(url, {
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 15,
    });
    return drizzle(client, { schema }) as unknown as Db;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = new PGlite(process.env.PGLITE_DIR || undefined);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  const { seedDatabase } = await import("./seed");
  await seedDatabase(db as unknown as Db);
  return db as unknown as Db;
}

export { schema };
