/**
 * Өгөгдлийн сангийн тусгай команд.
 *   npm run db:migrate   migration-уудыг ажиллуулна
 *   npm run db:seed      хоосон сан дээр үзүүлэнгийн өгөгдөл оруулна (аль хэдийн өгөгдөлтэй бол юу ч хийхгүй)
 *   npm run db:setup     хоёуланг дараалуулна. DATABASE_URL байхгүй бол алгасна (демо горим PGlite-ээр ажиллана).
 */
import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "../src/db/schema";
import { seedDatabase } from "../src/db/seed";
import type { Db } from "../src/db";

async function main() {
  const cmd = process.argv[2] ?? "setup";
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL тохируулаагүй тул алгаслаа. Апп PGlite демо горимоор ажиллана.");
    return;
  }
  const client = postgres(url, { max: 1, prepare: false, connect_timeout: 20 });
  const db = drizzle(client, { schema });
  try {
    if (cmd === "migrate" || cmd === "setup") {
      await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
      console.log("Migration амжилттай.");
    }
    if (cmd === "seed" || cmd === "setup") {
      if (process.env.SEED_DATABASE === "false") console.log("SEED_DATABASE=false тул seed алгаслаа.");
      else {
        await seedDatabase(db as unknown as Db);
        console.log("Seed дууслаа (өгөгдөл байсан бол өөрчлөөгүй).");
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
