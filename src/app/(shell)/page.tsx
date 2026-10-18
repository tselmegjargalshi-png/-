import type { Metadata } from "next";
import { getCategories } from "@/server/queries";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const categories = await getCategories();
  const ld = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "NOMAD BUSINESS",
    inLanguage: "mn",
    description: "Монгол даяарх бизнесүүдийн газрын зураг ба захиалгын платформ.",
    keywords: categories.map((c) => c.name).join(", "),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />;
}
