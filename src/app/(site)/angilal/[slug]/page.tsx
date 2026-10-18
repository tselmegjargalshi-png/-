import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { formatRating } from "@/lib/format";
import { getCategories, getSummariesByCategory } from "@/server/queries";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  if (!cat) return { title: "Ангилал олдсонгүй" };
  return { title: `${cat.name}, Монгол даяар`, description: `${cat.description} Газрын зураг дээрээс ${cat.name.toLowerCase()} ангиллын бизнесүүдийг үзээрэй.`, alternates: { canonical: `/angilal/${slug}` } };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  if (!cat) notFound();
  const list = await getSummariesByCategory(slug);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <p className="eyebrow">Ангилал</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">{cat.name}</h1>
      <p className="mt-3 max-w-prose text-ink-2">{cat.description}</p>
      <Link href={`/?c=${cat.slug}`} className="btn btn-accent mt-5">Газрын зураг дээр харах</Link>
      {list.length === 0 ? (
        <p className="mt-10 text-ink-2">Энэ ангилалд одоогоор бизнес бүртгэгдээгүй байна.</p>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <li key={b.id}>
              <Link href={`/biznes/${b.slug}`} className="group block overflow-hidden rounded-[1.5rem] border border-line bg-surface transition-shadow hover:shadow-card">
                <div className="aspect-[16/10] overflow-hidden bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-bold tracking-tight">{b.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-2">{b.tagline}</p>
                  <p className="mt-3 flex items-center gap-3 text-sm"><span className="flex items-center gap-1 font-semibold"><Star size={14} className="fill-accent text-accent" aria-hidden="true" /> {formatRating(b.ratingAvg)}</span><span className="text-ink-3">{b.locationName}</span></p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
