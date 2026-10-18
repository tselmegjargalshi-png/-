import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { CancelBookingButton, LogoutButton, PasswordForm, ProfileForm, UnsaveButton } from "@/components/account/AccountClient";
import { formatDateShort, formatDateTime, formatMnt, formatRating } from "@/lib/format";
import { BOOKING_LABEL, BOOKING_TONE } from "@/lib/labels";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getViewer } from "@/server/auth";
import { getSavedIds, getSummariesByIds, getUserBookings, getUserReviews } from "@/server/queries";

export const metadata: Metadata = { title: "Миний бүртгэл", robots: { index: false } };
export const dynamic = "force-dynamic";

const nowMs = () => Date.now();

const TABS = [
  ["hadgalsan", "Хадгалсан бизнесүүд"],
  ["zahialga", "Миний захиалгууд"],
  ["setgegdel", "Сэтгэгдлүүд"],
  ["profail", "Профайл"],
  ["tohirgoo", "Тохиргоо"],
] as const;

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: rawTab } = await searchParams;
  const v = await getViewer();
  if (!v) redirect(`/nevtreh?next=${encodeURIComponent("/hereglegch" + (rawTab ? `?tab=${rawTab}` : ""))}`);
  const tab = TABS.some(([k]) => k === rawTab) ? rawTab! : "hadgalsan";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <p className="eyebrow">Миний бүртгэл</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.03em]">Сайн уу, {v.name.split(" ")[0]}</h1>
      <nav aria-label="Бүртгэлийн хэсгүүд" className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/hereglegch?tab=${k}`} className="chip" aria-current={tab === k ? "true" : undefined}>{label}</Link>
        ))}
      </nav>
      <div className="mt-8">
        {tab === "hadgalsan" && <Saved userId={v.id} />}
        {tab === "zahialga" && <Bookings userId={v.id} />}
        {tab === "setgegdel" && <MyReviews userId={v.id} />}
        {tab === "profail" && <Profile userId={v.id} name={v.name} email={v.email} />}
        {tab === "tohirgoo" && (
          <div className="grid gap-6">
            <PasswordForm />
            <div className="card max-w-xl p-5 sm:p-6">
              <h3 className="text-lg font-bold">Бизнесийн удирдлага</h3>
              <p className="mt-1 text-sm text-ink-2">Бизнес эзэмшигч бол удирдлагын самбар руу орно уу.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/biznes" className="btn btn-ghost">Бизнесийн самбар</Link>
                <Link href="/biznes-burtguuleh" className="btn btn-ghost">Бизнесээ бүртгүүлэх</Link>
                {v.role === "ADMIN" && <Link href="/udirdlaga" className="btn btn-ghost">Админ</Link>}
              </div>
            </div>
            <LogoutButton />
          </div>
        )}
      </div>
    </div>
  );
}

async function Saved({ userId }: { userId: string }) {
  const list = await getSummariesByIds(await getSavedIds(userId));
  if (list.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-lg font-bold">Хадгалсан бизнес алга.</p>
        <p className="mt-1 text-ink-2">Дуртай бизнесээ зүрхний дүрс дээр дарж хадгалаарай.</p>
        <Link href="/" className="btn btn-primary mt-5">Бизнес хайх</Link>
      </div>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {list.map((b) => (
        <li key={b.id} className="card flex gap-4 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.coverUrl} alt="" className="h-24 w-24 shrink-0 rounded-2xl object-cover" />
          <div className="min-w-0 flex-1">
            <p className="eyebrow">{b.categoryName}</p>
            <Link href={`/biznes/${b.slug}`} className="block truncate text-lg font-bold tracking-tight hover:underline">{b.name}</Link>
            <p className="flex items-center gap-1 text-sm text-ink-2"><Star size={13} className="fill-accent text-accent" aria-hidden="true" /> {formatRating(b.ratingAvg)} · {b.locationName}</p>
            <div className="mt-2"><UnsaveButton id={b.id} name={b.name} /></div>
          </div>
        </li>
      ))}
    </ul>
  );
}

async function Bookings({ userId }: { userId: string }) {
  const rows = await getUserBookings(userId);
  if (rows.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-lg font-bold">Захиалга алга.</p>
        <p className="mt-1 text-ink-2">Бизнесийн хуудаснаас цагаа захиалаарай.</p>
        <Link href="/" className="btn btn-primary mt-5">Бизнес хайх</Link>
      </div>
    );
  }
  const now = nowMs();
  return (
    <ul className="grid gap-3">
      {rows.map(({ b, businessName, businessSlug }) => {
        const upcoming = b.startsAt.getTime() > now && (b.status === "PENDING" || b.status === "CONFIRMED");
        return (
          <li key={b.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${BOOKING_TONE[b.status]}`}>{BOOKING_LABEL[b.status]}</span>
                <span className="font-mono text-xs text-ink-3">{b.code}</span>
              </p>
              <Link href={`/biznes/${businessSlug}`} className="mt-2 block text-lg font-bold tracking-tight hover:underline">{businessName}</Link>
              <p className="text-sm text-ink-2">{b.serviceName} · {formatMnt(b.priceMnt)}</p>
              <p className="text-sm font-semibold">{formatDateTime(b.startsAt)}</p>
            </div>
            {upcoming && <CancelBookingButton id={b.id} />}
          </li>
        );
      })}
    </ul>
  );
}

async function MyReviews({ userId }: { userId: string }) {
  const rows = await getUserReviews(userId);
  if (rows.length === 0) return <div className="card p-8 text-center"><p className="text-lg font-bold">Сэтгэгдэл бичээгүй байна.</p><p className="mt-1 text-ink-2">Очсон газрынхаа тухай бусдад зөвлөөрэй.</p></div>;
  return (
    <ul className="grid gap-3">
      {rows.map(({ r, businessName, businessSlug }) => (
        <li key={r.id} className="card p-4">
          <div className="flex items-center justify-between gap-3">
            <Link href={`/biznes/${businessSlug}`} className="font-bold hover:underline">{businessName}</Link>
            <span className="text-xs text-ink-3">{formatDateShort(r.createdAt)}</span>
          </div>
          <p className="mt-1 flex gap-0.5" role="img" aria-label={`${r.rating} од`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} className={n <= r.rating ? "fill-accent text-accent" : "text-stone"} aria-hidden="true" />)}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{r.body}</p>
          {r.status === "HIDDEN" && <p className="mt-2 text-xs font-semibold text-warn">Энэ сэтгэгдлийг модераторууд нуусан байна.</p>}
        </li>
      ))}
    </ul>
  );
}

async function Profile({ userId, name, email }: { userId: string; name: string; email: string }) {
  const db = await getDb();
  const [u] = await db.select({ phone: schema.users.phone }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  return <ProfileForm name={name} email={email} phone={u?.phone ?? ""} />;
}
