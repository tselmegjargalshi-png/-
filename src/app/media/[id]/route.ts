import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await getDb();
  const [row] = await db.select().from(schema.media).where(eq(schema.media.id, id)).limit(1);
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: { "Content-Type": row.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
