import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bars, TrendChart } from "@/components/owner/Charts";
import { BusinessForm, DEFAULT_HOURS, type FormLocation } from "@/components/owner/BusinessForm";
import { BookingActions, ImageGrid, ServiceManager } from "@/components/owner/OwnerClient";
import { groupThousands, formatDateShort, formatDateTime, formatMnt, ubParts } from "@/lib/format";
import { BOOKING_LABEL, BOOKING_TONE, BUSINESS_STATUS_LABEL } from "@/lib/labels";
import { updateBusinessAction } from "@/server/actions/owner";
import { getViewer } from "@/server/auth";
import { getCategoriesFull, getLocationRows, getOwnedBusinesses, getOwnerOverview } from "@/server/queries";

export const metadata: Metadata = { title: "Бизнесийн самбар", robots: { index: false } };
export const dynamic = "force-dynamic";

const nowMs = () => Date.now();

const TABS = [
  ["toim", "Тойм"],
  ["zahialga", "Захиалгууд"],
  ["uilchilgee", "Үйлчилгээ"],
  ["profail", "Профайл"],
  ["zurvas", "Зурвас"],
  ["setgegdel", "Сэтгэгдэл"],
] as const;

export default async function OwnerPage({ searchParams }: { searchParams: Promise<{ b?: string; tab?: string; uusgesen?: string }> }) {
  const sp = await searchParams;
  const v = await getViewer();
  if (!v) redirect("/nevtreh?next=/biznes");
  const owned = await getOwnedBusinesses(v.id);
  if (owned.length === 0) redirect("/biznes-burtguuleh");
  const current = owned.find((o) => o.b.slug === (sp.b ?? sp.uusgesen)) ?? owned[0];
  const b = current.b;
  const tab = TABS.some(([k]) => k === sp.tab) ? sp.tab! : "toim";
  const data = await getOwnerOverview(b.id);
  const q = (t: string) => `/biznes?b=${b.slug}&tab=${t}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      {sp.uusgesen && (
        <p className="mb-6 rounded-2xl bg-[#d6e8dc] px-4 py-3 text-sm font-semibold text-ok" role="status">
          Бизнес амжилттай бүртгэгдлээ.{b.status === "PENDING" ? " Админ хянан баталсны дараа газрын зураг дээр гарна." : " Одоо газрын зураг дээр харагдаж байна."}
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Бизнесийн самбар</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.03em]">{b.name}</h1>
          <p className="mt-1 text-sm text-ink-2">{current.categoryName} · {BUSINESS_STATUS_LABEL[b.status]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {owned.length > 1 && owned.map((o) => <Link key={o.b.id} href={`/biznes?b=${o.b.slug}`} className="chip" aria-current={o.b.id === b.id ? "true" : undefined}>{o.b.name}</Link>)}
          <Link href={`/biznes/${b.slug}`} className="btn btn-ghost btn-sm">Нийтийн хуудас</Link>
          <Link href="/biznes-burtguuleh" className="btn btn-ghost btn-sm">Шинэ бизнес нэмэх</Link>
        </div>
      </div>

      <nav aria-label="Самбарын хэсгүүд" className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map(([k, label]) => <Link key={k} href={q(k)} className="chip" aria-current={tab === k ? "true" : undefined}>{label}</Link>)}
      </nav>

      <div className="mt-8">
        {tab === "toim" && <Overview data={data} />}
        {tab === "zahialga" && <BookingList data={data} />}
        {tab === "uilchilgee" && <ServiceManager businessId={b.id} services={data.services.map((s) => ({ id: s.id, name: s.name, priceMnt: s.priceMnt, durationMin: s.durationMin, bookable: s.bookable }))} />}
        {tab === "profail" && <EditProfile business={b} images={data.images} />}
        {tab === "zurvas" && (
          data.messages.length === 0 ? <p className="card p-8 text-center text-ink-2">Одоогоор зурвас ирээгүй байна.</p> : (
            <ul className="grid gap-3">
              {data.messages.map((m) => (
                <li key={m.id} className="card p-4">
                  <p className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold">{m.name}</span><span className="text-xs text-ink-3">{formatDateShort(m.createdAt)}</span></p>
                  <p className="mt-0.5 font-mono text-sm text-ink-2">{m.phone}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{m.message}</p>
                </li>
              ))}
            </ul>
          )
        )}
        {tab === "setgegdel" && (
          data.reviews.length === 0 ? <p className="card p-8 text-center text-ink-2">Одоогоор сэтгэгдэл алга.</p> : (
            <ul className="grid gap-3">
              {data.reviews.map((r) => (
                <li key={r.id} className="card p-4">
                  <p className="flex items-center justify-between gap-2"><span className="font-bold">{r.authorName}</span><span className="font-mono text-sm">{r.rating}/5</span></p>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{r.body}</p>
                  <p className="mt-2 text-xs text-ink-3">{formatDateShort(r.createdAt)}</p>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}

function Overview({ data }: { data: Awaited<ReturnType<typeof getOwnerOverview>> }) {
  const upcoming = data.bookings.filter((x) => x.startsAt.getTime() > nowMs() && (x.status === "PENDING" || x.status === "CONFIRMED")).length;
  const pending = data.bookings.filter((x) => x.status === "PENDING").length;
  const days = data.stats.map((s) => ({ day: s.day, impressions: s.impressions, profileViews: s.profileViews, contacts: s.contacts }));
  const conv = data.totals.profileViews > 0 ? Math.round((data.bookings.length / data.totals.profileViews) * 100) : 0;
  const tiles: Array<[string, string, string?]> = [
    ["Харагдсан (30 хоног)", groupThousands(data.totals.impressions)],
    ["Профайл үзсэн", groupThousands(data.totals.profileViews)],
    ["Холбогдсон", groupThousands(data.totals.contacts)],
    ["Ирэх захиалга", String(upcoming), pending ? `${pending} баталгаажуулах` : undefined],
    ["Орлого (баталгаажсан)", formatMnt(data.revenue)],
    ["Үзсэнээс захиалга", `${conv}%`],
  ];
  const byDow = Array.from({ length: 7 }, (_, i) => ({ label: ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"][i], value: 0 }));
  for (const bk of data.bookings) byDow[ubParts(bk.startsAt).weekdayIndex].value++;
  const svc = new Map<string, number>();
  for (const bk of data.bookings) svc.set(bk.serviceName, (svc.get(bk.serviceName) ?? 0) + 1);
  const top = [...svc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value }));
  return (
    <div className="grid gap-6">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {tiles.map(([label, value, note]) => (
          <li key={label} className="card p-4">
            <p className="eyebrow">{label}</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight">{value}</p>
            {note && <p className="mt-1 text-xs font-semibold text-warn">{note}</p>}
          </li>
        ))}
      </ul>
      <section className="card p-5" aria-labelledby="trend-h">
        <h2 id="trend-h" className="mb-3 text-lg font-bold">Сүүлийн 30 хоног</h2>
        {days.length ? <TrendChart data={days} /> : <p className="text-sm text-ink-2">Мэдээлэл хараахан цугларсангүй.</p>}
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5"><h2 className="mb-3 text-lg font-bold">Гарагаар захиалга</h2><Bars rows={byDow} /></section>
        <section className="card p-5"><h2 className="mb-3 text-lg font-bold">Эрэлттэй үйлчилгээ</h2>{top.length ? <Bars rows={top} /> : <p className="text-sm text-ink-2">Захиалга алга.</p>}</section>
      </div>
    </div>
  );
}

function BookingList({ data }: { data: Awaited<ReturnType<typeof getOwnerOverview>> }) {
  if (data.bookings.length === 0) return <p className="card p-8 text-center text-ink-2">Одоогоор захиалга алга.</p>;
  return (
    <ul className="grid gap-3">
      {data.bookings.slice(0, 60).map((x) => (
        <li key={x.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${BOOKING_TONE[x.status]}`}>{BOOKING_LABEL[x.status]}</span><span className="font-mono text-xs text-ink-3">{x.code}</span></p>
            <p className="mt-2 font-bold">{x.customerName} <span className="font-mono text-sm font-normal text-ink-2">{x.phone}</span></p>
            <p className="text-sm text-ink-2">{x.serviceName} · {formatMnt(x.priceMnt)}</p>
            <p className="text-sm font-semibold">{formatDateTime(x.startsAt)}</p>
            {x.note && <p className="mt-1 text-sm text-ink-3">Тэмдэглэл: {x.note}</p>}
          </div>
          <BookingActions id={x.id} status={x.status} />
        </li>
      ))}
    </ul>
  );
}

async function EditProfile({ business: b, images }: { business: Awaited<ReturnType<typeof getOwnedBusinesses>>[number]["b"]; images: Array<{ id: string; url: string }> }) {
  const [fullCats, rows] = await Promise.all([getCategoriesFull(), getLocationRows()]);
  const categories = fullCats.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon, description: c.description }));
  const byId = new Map(rows.map((r) => [r.id, r]));
  const locations: FormLocation[] = rows.map((r) => ({ slug: r.slug, name: r.name, kind: r.kind, parentSlug: r.parentId ? byId.get(r.parentId)?.slug ?? null : null }));
  const loc = byId.get(b.locationId);
  const parent = loc?.parentId ? byId.get(loc.parentId) : null;
  const catSlug = fullCats.find((c) => c.id === b.categoryId)?.slug ?? "";
  return (
    <div className="grid gap-8">
      <section aria-labelledby="img-h">
        <h2 id="img-h" className="mb-3 text-lg font-bold">Одоогийн зургууд</h2>
        <ImageGrid images={images} />
      </section>
      <BusinessForm
        mode="edit"
        categories={categories}
        locations={locations}
        action={updateBusinessAction}
        submitLabel="Өөрчлөлтийг хадгалах"
        initial={{
          businessId: b.id, name: b.name, categorySlug: catSlug, tagline: b.tagline, description: b.description,
          locationSlug: parent ? parent.slug : loc?.slug ?? "", district: parent ? loc?.slug ?? "" : "", address: b.address, phone: b.phone, email: b.email,
          website: b.website, instagram: b.instagram, facebook: b.facebook, priceLevel: b.priceLevel, hours: b.hours ?? DEFAULT_HOURS,
        }}
      />
    </div>
  );
}
