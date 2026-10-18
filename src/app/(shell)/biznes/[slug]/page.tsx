import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BusinessProfile, type ProfileData } from "@/components/business/BusinessProfile";
import { ProfileBoundary } from "@/components/business/ProfileBoundary";
import { DAY_KEYS } from "@/lib/format";
import { getViewer } from "@/server/auth";
import { getBusinessDetail } from "@/server/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const v = await getViewer();
  return getBusinessDetail(slug, { includeInactiveFor: v?.id ?? null, isAdmin: v?.role === "ADMIN" });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const detail = await load(slug);
  if (!detail) return { title: "Бизнес олдсонгүй" };
  const b = detail.business;
  const title = `${b.name}, ${detail.category.name} | ${detail.locationName}`;
  const description = b.tagline || b.description.slice(0, 150);
  return {
    title,
    description,
    alternates: { canonical: `/biznes/${b.slug}` },
    openGraph: { title, description, type: "website", images: [{ url: b.coverUrl }] },
    robots: b.status === "ACTIVE" ? undefined : { index: false },
  };
}

export default async function BusinessPage({ params }: Props) {
  const { slug } = await params;
  const detail = await load(slug);
  if (!detail) notFound();
  const b = detail.business;

  const data: ProfileData = {
    business: {
      id: b.id, slug: b.slug, name: b.name, tagline: b.tagline, description: b.description, address: b.address, lat: b.lat, lng: b.lng,
      phone: b.phone, email: b.email, website: b.website, instagram: b.instagram, facebook: b.facebook, priceLevel: b.priceLevel, isDemo: b.isDemo,
      logoUrl: b.logoUrl, coverUrl: b.coverUrl, hours: b.hours, tags: b.tags, ratingAvg: b.ratingAvg, reviewCount: b.reviewCount, status: b.status,
    },
    category: { name: detail.category.name, icon: detail.category.icon, slug: detail.category.slug },
    locationName: detail.locationName,
    districtName: detail.districtName,
    services: detail.services.map((s) => ({ id: s.id, name: s.name, priceMnt: s.priceMnt, durationMin: s.durationMin, bookable: s.bookable, description: s.description })),
    staff: detail.staff.map((s) => ({ id: s.id, name: s.name, title: s.title })),
    images: detail.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt })),
    reviews: detail.reviews.map((r) => ({ id: r.id, authorName: r.authorName, rating: r.rating, body: r.body, photos: r.photos, createdAt: r.createdAt })),
    breakdown: detail.breakdown,
  };

  const dayMap: Record<string, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
  const ld = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: b.name,
    description: b.tagline,
    image: b.coverUrl,
    address: { "@type": "PostalAddress", streetAddress: b.address, addressLocality: detail.locationName, addressCountry: "MN" },
    geo: { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lng },
    priceRange: "₮".repeat(b.priceLevel),
    openingHoursSpecification: DAY_KEYS.filter((k) => b.hours[k]).map((k) => ({
      "@type": "OpeningHoursSpecification", dayOfWeek: dayMap[k], opens: b.hours[k]![0], closes: b.hours[k]![1] === "24:00" ? "23:59" : b.hours[k]![1],
    })),
    ...(b.reviewCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: b.ratingAvg.toFixed(1), reviewCount: b.reviewCount } } : {}),
  };

  return (
    <ProfileBoundary slug={b.slug}>
      <BusinessProfile key={b.slug} data={data} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </ProfileBoundary>
  );
}
