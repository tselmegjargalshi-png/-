import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminBtn, CategoryForm } from "@/components/admin/AdminClient";
import { formatDateShort, formatDateTime, formatMnt } from "@/lib/format";
import { BOOKING_LABEL, BOOKING_TONE, BUSINESS_STATUS_LABEL, REPORT_STATUS_LABEL, REVIEW_STATUS_LABEL, ROLE_LABEL, USER_STATUS_LABEL } from "@/lib/labels";
import { getViewer } from "@/server/auth";
import { adminBookings, adminBusinesses, adminReports, adminReviews, adminUsers, getAdminOverview, getCategoriesFull } from "@/server/queries";

export const metadata: Metadata = { title: "Админ", robots: { index: false } };
export const dynamic = "force-dynamic";

const TABS = [
  ["toim", "Тойм"],
  ["biznes", "Бизнесүүд"],
  ["hereglegch", "Хэрэглэгчид"],
  ["setgegdel", "Сэтгэгдэл"],
  ["zahialga", "Захиалга"],
  ["angilal", "Ангилал"],
  ["medeelel", "Гомдол"],
] as const;

const th = "px-3 py-2.5 text-left font-mono text-[11px] font-medium uppercase tracking-wider text-ink-3";
const td = "px-3 py-3 align-top text-sm";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: raw } = await searchParams;
  const v = await getViewer();
  if (!v) redirect("/nevtreh?next=/udirdlaga");
  if (v.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Хандах эрх алга.</h1>
        <p className="mt-2 text-ink-2">Энэ хэсэг зөвхөн администраторт нээлттэй.</p>
        <Link href="/" className="btn btn-primary mt-6">Нүүр хуудас</Link>
      </div>
    );
  }
  const tab = TABS.some(([k]) => k === raw) ? raw! : "toim";
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <p className="eyebrow">Админ</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.03em]">Удирдлагын хэсэг</h1>
      <nav aria-label="Админы хэсгүүд" className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map(([k, label]) => <Link key={k} href={`/udirdlaga?tab=${k}`} className="chip" aria-current={tab === k ? "true" : undefined}>{label}</Link>)}
      </nav>
      <div className="mt-8">
        {tab === "toim" && <Overview />}
        {tab === "biznes" && <Businesses />}
        {tab === "hereglegch" && <Users selfId={v.id} />}
        {tab === "setgegdel" && <Reviews />}
        {tab === "zahialga" && <Bookings />}
        {tab === "angilal" && <Categories />}
        {tab === "medeelel" && <Reports />}
      </div>
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="scroll-thin overflow-x-auto rounded-[1.25rem] border border-line bg-surface">
      <table className="w-full min-w-[720px] border-collapse">
        <thead className="border-b border-line"><tr>{head.map((h) => <th key={h} scope="col" className={th}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

async function Overview() {
  const o = await getAdminOverview();
  const tiles: Array<[string, number, string?]> = [
    ["Бизнес", o.businesses, o.pending ? `${o.pending} хүлээгдэж байна` : undefined],
    ["Хэрэглэгч", o.users],
    ["Сэтгэгдэл", o.reviews],
    ["Захиалга", o.bookings],
    ["Гомдол", o.reports, o.openReports ? `${o.openReports} нээлттэй` : undefined],
  ];
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {tiles.map(([l, n, note]) => (
        <li key={l} className="card p-4"><p className="eyebrow">{l}</p><p className="mt-2 text-3xl font-extrabold tracking-tight">{n}</p>{note && <p className="mt-1 text-xs font-semibold text-warn">{note}</p>}</li>
      ))}
    </ul>
  );
}

async function Businesses() {
  const rows = await adminBusinesses();
  return (
    <Table head={["Бизнес", "Ангилал", "Төлөв", "Онцлох", "Үйлдэл"]}>
      {rows.map(({ b, categoryName, locName }) => (
        <tr key={b.id}>
          <td className={td}><Link href={`/biznes/${b.slug}`} className="font-semibold hover:underline">{b.name}</Link><p className="text-xs text-ink-3">{locName}{b.isDemo ? " · жишээ" : ""}</p></td>
          <td className={td}>{categoryName}</td>
          <td className={td}>{BUSINESS_STATUS_LABEL[b.status]}</td>
          <td className={td}><AdminBtn op={{ k: "featured", id: b.id, to: !b.featured }} label={b.featured ? "Онцлохоос хасах" : "Онцлох болгох"} /></td>
          <td className={td}>
            <div className="flex flex-wrap gap-2">
              {b.status !== "ACTIVE" && <AdminBtn op={{ k: "bizStatus", id: b.id, to: "ACTIVE" }} label="Нийтлэх" tone="primary" />}
              {b.status === "ACTIVE" && <AdminBtn op={{ k: "bizStatus", id: b.id, to: "SUSPENDED" }} label="Түр хаах" />}
              <AdminBtn op={{ k: "bizDelete", id: b.id }} label="Устгах" tone="danger" confirm={`"${b.name}" бизнесийг бүрмөсөн устгах уу?`} />
            </div>
          </td>
        </tr>
      ))}
    </Table>
  );
}

async function Users({ selfId }: { selfId: string }) {
  const rows = await adminUsers();
  return (
    <Table head={["Нэр", "Эрх", "Төлөв", "Бүртгүүлсэн", "Үйлдэл"]}>
      {rows.map((u) => (
        <tr key={u.id}>
          <td className={td}><p className="font-semibold">{u.name}</p><p className="text-xs text-ink-3">{u.email}{u.isDemo ? " · жишээ" : ""}</p></td>
          <td className={td}>{ROLE_LABEL[u.role]}</td>
          <td className={td}>{USER_STATUS_LABEL[u.status]}</td>
          <td className={td}>{formatDateShort(u.createdAt)}</td>
          <td className={td}>
            {u.id === selfId ? <span className="text-xs text-ink-3">Та өөрөө</span> : (
              <div className="flex flex-wrap gap-2">
                <AdminBtn op={{ k: "userStatus", id: u.id, to: u.status === "ACTIVE" ? "BANNED" : "ACTIVE" }} label={u.status === "ACTIVE" ? "Хориглох" : "Сэргээх"} tone={u.status === "ACTIVE" ? "danger" : "primary"} />
                {u.role !== "ADMIN" && <AdminBtn op={{ k: "userRole", id: u.id, to: "ADMIN" }} label="Админ болгох" confirm="Энэ хэрэглэгчийг админ болгох уу?" />}
              </div>
            )}
          </td>
        </tr>
      ))}
    </Table>
  );
}

async function Reviews() {
  const rows = await adminReviews();
  return (
    <Table head={["Сэтгэгдэл", "Бизнес", "Төлөв", "Үйлдэл"]}>
      {rows.map(({ r, businessName, businessSlug }) => (
        <tr key={r.id}>
          <td className={`${td} max-w-md`}><p className="font-semibold">{r.authorName} <span className="font-mono text-xs text-ink-3">{r.rating}/5</span></p><p className="mt-1 text-ink-2">{r.body}</p></td>
          <td className={td}><Link href={`/biznes/${businessSlug}`} className="hover:underline">{businessName}</Link></td>
          <td className={td}>{REVIEW_STATUS_LABEL[r.status]}</td>
          <td className={td}>
            <div className="flex flex-wrap gap-2">
              <AdminBtn op={{ k: "reviewStatus", id: r.id, to: r.status === "VISIBLE" ? "HIDDEN" : "VISIBLE" }} label={r.status === "VISIBLE" ? "Нуух" : "Харуулах"} />
              <AdminBtn op={{ k: "reviewDelete", id: r.id }} label="Устгах" tone="danger" confirm="Сэтгэгдлийг устгах уу?" />
            </div>
          </td>
        </tr>
      ))}
    </Table>
  );
}

async function Bookings() {
  const rows = await adminBookings();
  return (
    <Table head={["Код", "Бизнес", "Үйлчлүүлэгч", "Цаг", "Төлөв"]}>
      {rows.map(({ b, businessName }) => (
        <tr key={b.id}>
          <td className={`${td} font-mono`}>{b.code}</td>
          <td className={td}>{businessName}<p className="text-xs text-ink-3">{b.serviceName} · {formatMnt(b.priceMnt)}</p></td>
          <td className={td}>{b.customerName}<p className="font-mono text-xs text-ink-3">{b.phone}</p></td>
          <td className={td}>{formatDateTime(b.startsAt)}</td>
          <td className={td}><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${BOOKING_TONE[b.status]}`}>{BOOKING_LABEL[b.status]}</span></td>
        </tr>
      ))}
    </Table>
  );
}

async function Categories() {
  const rows = await getCategoriesFull();
  return (
    <div className="grid gap-6">
      <section className="card p-5">
        <h2 className="mb-3 text-lg font-bold">Шинэ ангилал</h2>
        <CategoryForm />
      </section>
      <ul className="grid gap-3">
        {rows.map((c) => (
          <li key={c.id} className="card flex flex-wrap items-start justify-between gap-4 p-4">
            <div className="min-w-0"><p className="font-bold">{c.name} <span className="font-mono text-xs font-normal text-ink-3">/{c.slug}</span></p><p className="text-sm text-ink-2">{c.description}</p></div>
            <div className="flex flex-wrap items-start gap-2">
              <CategoryForm initial={{ id: c.id, name: c.name, icon: c.icon, description: c.description, keywords: c.keywords.join(", ") }} />
              <AdminBtn op={{ k: "catDelete", id: c.id }} label="Устгах" tone="danger" confirm={`"${c.name}" ангиллыг устгах уу?`} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function Reports() {
  const rows = await adminReports();
  if (rows.length === 0) return <p className="card p-8 text-center text-ink-2">Гомдол алга.</p>;
  return (
    <ul className="grid gap-3">
      {rows.map(({ report: r, review, business }) => (
        <li key={r.id} className="card p-4">
          <p className="flex flex-wrap items-center gap-2 text-sm"><span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold">{r.targetType === "REVIEW" ? "Сэтгэгдэл" : "Бизнес"}</span><span className="text-ink-3">{REPORT_STATUS_LABEL[r.status]} · {formatDateShort(r.createdAt)}</span></p>
          <p className="mt-2 font-semibold">Шалтгаан: <span className="font-normal text-ink-2">{r.reason}</span></p>
          {review && <p className="mt-1 rounded-xl bg-surface-2 p-3 text-sm text-ink-2">{review.authorName}: {review.body}</p>}
          {business && <p className="mt-1 text-sm"><Link href={`/biznes/${business.slug}`} className="font-semibold hover:underline">{business.name}</Link></p>}
          {r.status === "OPEN" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <AdminBtn op={{ k: "report", id: r.id, to: "RESOLVED" }} label="Шийдвэрлэсэн" tone="primary" />
              <AdminBtn op={{ k: "report", id: r.id, to: "DISMISSED" }} label="Хэрэгсэхгүй" />
              {review && <AdminBtn op={{ k: "reviewStatus", id: review.id, to: "HIDDEN" }} label="Сэтгэгдлийг нуух" />}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
