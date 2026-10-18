import { getActiveSummaries } from "@/server/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  let list = await getActiveSummaries();
  if (category) list = list.filter((b) => b.categorySlug === category);
  return Response.json({ count: list.length, items: list }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
