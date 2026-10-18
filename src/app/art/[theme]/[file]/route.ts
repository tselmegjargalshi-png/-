import { artSvg, isTheme, logoSvg } from "@/lib/art";

export const dynamic = "force-static";

export async function GET(_req: Request, ctx: { params: Promise<{ theme: string; file: string }> }) {
  const { theme, file } = await ctx.params;
  const seed = decodeURIComponent(file).replace(/\.svg$/, "");
  const isLogo = theme.startsWith("logo-");
  const t = isLogo ? theme.slice(5) : theme;
  if (!isTheme(t)) return new Response("Not found", { status: 404 });
  const svg = isLogo ? logoSvg(seed.replace(/-/g, " "), seed, t) : artSvg(t, seed);
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
