import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BusinessForm, EMPTY_INITIAL, type FormLocation } from "@/components/owner/BusinessForm";
import { createBusinessAction } from "@/server/actions/owner";
import { getViewer } from "@/server/auth";
import { getCategories, getLocationRows } from "@/server/queries";

export const metadata: Metadata = { title: "Бизнесээ бүртгүүлэх", description: "Бизнесээ NOMAD BUSINESS-д үнэгүй бүртгүүлж, Монгол даяарх хэрэглэгчдэд танигдаарай." };
export const dynamic = "force-dynamic";

export default async function RegisterBusinessPage() {
  const v = await getViewer();
  if (!v) redirect("/burtgel?role=OWNER&next=/biznes-burtguuleh");
  const [categories, rows] = await Promise.all([getCategories(), getLocationRows()]);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const locations: FormLocation[] = rows.map((r) => ({ slug: r.slug, name: r.name, kind: r.kind, parentSlug: r.parentId ? byId.get(r.parentId)?.slug ?? null : null }));
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
      <p className="eyebrow">Бизнес эзэмшигчид</p>
      <h1 className="mt-2 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">Бизнесээ бүртгүүлэх</h1>
      <p className="mt-3 max-w-prose text-ink-2">Мэдээллээ бөглөөд илгээнэ үү. Бүртгэл дууссаны дараа таны бизнес газрын зураг дээр гарч, хэрэглэгчид цаг захиалах боломжтой болно.</p>
      <div className="mt-8">
        <BusinessForm mode="create" categories={categories} locations={locations} initial={EMPTY_INITIAL} action={createBusinessAction} submitLabel="Бизнесээ бүртгүүлэх" />
      </div>
    </div>
  );
}
