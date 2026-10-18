"use client";

import { Clock, Flag, MapPin, Navigation, Phone, Share2, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { OpeningHours } from "@/db/schema";
import { DAY_KEYS, DAY_NAMES, formatMnt, formatRating, pluralReviews, ubParts } from "@/lib/format";
import { hoursLabel, openState } from "@/lib/hours";
import { useParallax } from "@/lib/hooks";
import { reportAction, trackAction } from "@/server/actions/engage";
import { CategoryIcon } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { useDiscovery } from "../shell/DiscoveryProvider";
import { SaveButton } from "../shell/SaveButton";
import { BookingModal, type BookService, type BookStaff } from "./BookingModal";
import { ContactModal } from "./ContactModal";
import { Reviews, type ReviewItem } from "./Reviews";

export type ProfileData = {
  business: {
    id: string; slug: string; name: string; tagline: string; description: string; address: string; lat: number; lng: number;
    phone: string; email: string; website: string; instagram: string; facebook: string; priceLevel: number; isDemo: boolean;
    logoUrl: string; coverUrl: string; hours: OpeningHours; tags: string[]; ratingAvg: number; reviewCount: number; status: string;
  };
  category: { name: string; icon: string; slug: string };
  locationName: string;
  districtName: string | null;
  services: BookService[];
  staff: BookStaff[];
  images: Array<{ id: string; url: string; alt: string }>;
  reviews: ReviewItem[];
  breakdown: Array<{ star: number; count: number }>;
};

export function BusinessProfile({ data }: { data: ProfileData }) {
  const d = useDiscovery();
  const { toast } = useToast();
  const b = data.business;
  const [booking, setBooking] = useState<{ open: boolean; service: string | null }>({ open: false, service: null });
  const [contact, setContact] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reportText, setReportText] = useState("");
  const cover = useParallax<HTMLDivElement>(12);
  const tracked = useRef<string | null>(null);
  const st = openState(b.hours, d.now);
  const today = ubParts(d.now).day;
  const place = data.districtName ? `${data.locationName}, ${data.districtName}` : data.locationName;
  const hasBookable = data.services.some((s) => s.bookable);

  useEffect(() => {
    if (tracked.current === b.id) return;
    tracked.current = b.id;
    void trackAction(b.id, "profileViews").catch(() => {});
  }, [b.id]);

  const share = async () => {
    const url = `${window.location.origin}/biznes/${b.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: b.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Холбоос хуулагдлаа", "ok");
      }
    } catch {}
  };

  const openBooking = (serviceId: string | null) => setBooking({ open: true, service: serviceId });

  return (
    <article aria-labelledby="biz-h" className="pb-28 lg:pb-12">
      <div ref={cover} className="relative aspect-[16/9] max-h-[360px] w-full overflow-hidden bg-surface-2 lg:aspect-[2/1]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.coverUrl} alt="" className="h-full w-full scale-110 object-cover" style={{ transform: "translate3d(var(--px,0px), var(--py,0px), 0) scale(1.1)" }} fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-t from-night/60 via-transparent to-transparent" aria-hidden="true" />
      </div>

      <div className="px-5 lg:px-8">
        <div className="relative -mt-10 flex items-end justify-between gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.logoUrl} alt={`${b.name} лого`} className="h-20 w-20 rounded-[1.4rem] border-4 border-bg bg-surface object-cover shadow-card" />
          <div className="flex items-center gap-2 pb-1">
            <SaveButton id={b.id} name={b.name} variant="overlay" />
            <button type="button" onClick={share} aria-label="Хуваалцах" className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface hover:border-ink">
              <Share2 size={16} />
            </button>
          </div>
        </div>

        <p className="eyebrow mt-4 flex items-center gap-1.5"><CategoryIcon name={data.category.icon} size={12} /> {data.category.name}</p>
        <h1 id="biz-h" className="mt-1.5 text-[2rem] font-extrabold leading-[1.05] tracking-[-0.03em] lg:text-[2.6rem]">{b.name}</h1>
        <p className="mt-2 text-[17px] text-ink-2">{b.tagline}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px]">
          <span className="flex items-center gap-1.5 font-semibold"><Star size={16} className="fill-accent text-accent" aria-hidden="true" /> {b.reviewCount ? formatRating(b.ratingAvg) : "Шинэ"}{b.reviewCount > 0 && <span className="font-normal text-ink-3">({pluralReviews(b.reviewCount)})</span>}</span>
          <span className="font-mono"><span>{"₮".repeat(b.priceLevel)}</span><span className="text-stone">{"₮".repeat(4 - b.priceLevel)}</span></span>
          <span className={`flex items-center gap-1.5 font-semibold ${st.open ? "text-ok" : "text-ink-3"}`}><span className={`h-2 w-2 rounded-full ${st.open ? "bg-ok" : "bg-stone"}`} aria-hidden="true" /> {st.label}</span>
          <span className="flex items-center gap-1 text-ink-3"><MapPin size={15} aria-hidden="true" /> {place}</span>
        </div>

        {b.isDemo && (
          <p className="mt-4 rounded-2xl border border-dashed border-stone bg-surface px-4 py-3 text-[13px] leading-relaxed text-ink-2">
            Энэ бол жишээ бизнес. Бүх мэдээлэл зохиомол бөгөөд бодит бизнесийг төлөөлөхгүй.
          </p>
        )}

        <div className="mt-6 hidden gap-3 lg:flex">
          <button type="button" className="btn btn-accent" onClick={() => openBooking(null)} disabled={!hasBookable}>Цаг захиалах</button>
          <button type="button" className="btn btn-ghost" onClick={() => setContact(true)}><Phone size={16} aria-hidden="true" /> Холбогдох</button>
          <button type="button" className="btn btn-ghost" onClick={() => d.select(b.id)}><Navigation size={16} aria-hidden="true" /> Газрын зураг дээр</button>
        </div>

        <nav aria-label="Хуудасны хэсгүүд" className="no-scrollbar -mx-5 mt-6 flex gap-2 overflow-x-auto border-b border-line px-5 pb-3 lg:-mx-8 lg:px-8">
          {[["about", "Тухай"], ["services", "Үйлчилгээ"], ["gallery", "Зураг"], ["reviews-h", "Сэтгэгдэл"], ["place", "Байршил"]].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="chip" onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{label}</a>
          ))}
        </nav>

        <section id="about" className="scroll-mt-4 pt-8" aria-labelledby="about-h">
          <h2 id="about-h" className="text-2xl font-extrabold tracking-tight">Тухай</h2>
          <p className="mt-3 max-w-[62ch] whitespace-pre-line text-[16px] leading-[1.7] text-ink-2">{b.description}</p>
          {b.tags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Шошго">
              {b.tags.map((t) => <li key={t} className="rounded-full bg-surface-2 px-3 py-1 text-[13px] font-medium text-ink-2">{t}</li>)}
            </ul>
          )}
        </section>

        <section id="services" className="scroll-mt-4 pt-12" aria-labelledby="svc-h">
          <h2 id="svc-h" className="text-2xl font-extrabold tracking-tight">Үйлчилгээ ба үнэ</h2>
          {data.services.length === 0 ? (
            <p className="mt-3 text-ink-2">Үйлчилгээний жагсаалт удахгүй нэмэгдэнэ.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-[1.25rem] border border-line bg-surface">
              {data.services.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[16px] font-semibold">{s.name}</p>
                    {s.description && <p className="mt-0.5 line-clamp-2 text-sm text-ink-3">{s.description}</p>}
                    <p className="mt-1 flex items-center gap-1 text-[13px] text-ink-3"><Clock size={12} aria-hidden="true" /> {s.durationMin} мин</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="font-mono text-[15px] font-bold">{formatMnt(s.priceMnt)}</span>
                    {s.bookable && <button type="button" className="btn btn-primary btn-sm" onClick={() => openBooking(s.id)} aria-label={`${s.name} захиалах`}>Захиалах</button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {data.staff.length > 0 && (
            <div className="mt-5">
              <h3 className="eyebrow">Баг</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {data.staff.map((s) => <li key={s.id} className="rounded-full border border-line px-3.5 py-1.5 text-sm"><span className="font-semibold">{s.name}</span>{s.title && <span className="text-ink-3">, {s.title}</span>}</li>)}
              </ul>
            </div>
          )}
        </section>

        {data.images.length > 0 && (
          <section id="gallery" className="scroll-mt-4 pt-12" aria-labelledby="gal-h">
            <h2 id="gal-h" className="text-2xl font-extrabold tracking-tight">Зураг</h2>
            <ul className="mt-4 grid grid-cols-3 gap-2">
              {data.images.map((im, i) => (
                <li key={im.id} className={i === 0 ? "col-span-2 row-span-2" : ""}>
                  <button type="button" onClick={() => setLightbox(i)} className="group block h-full w-full overflow-hidden rounded-2xl" aria-label={`Зураг ${i + 1} томоор үзэх`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={im.url} alt={im.alt || `${b.name} зураг ${i + 1}`} loading="lazy" className="aspect-square h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Reviews businessId={b.id} slug={b.slug} reviews={data.reviews} breakdown={data.breakdown} ratingAvg={b.ratingAvg} reviewCount={b.reviewCount} />

        <section id="place" className="scroll-mt-4 pt-12" aria-labelledby="place-h">
          <h2 id="place-h" className="text-2xl font-extrabold tracking-tight">Байршил ба цаг</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="flex items-start gap-2 text-[15px] text-ink-2"><MapPin size={17} className="mt-0.5 shrink-0" aria-hidden="true" /> <span>{b.address}<br /><span className="text-ink-3">{place}</span></span></p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => d.select(b.id)}><Navigation size={14} aria-hidden="true" /> Газрын зураг дээр харах</button>
                {!b.isDemo && (
                  <a className="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`}>Чиглэл авах</a>
                )}
              </div>
              {b.isDemo && <p className="mt-2 text-xs text-ink-3">Жишээ бизнесийн байршил зохиомол тул чиглэл авах холбоос байхгүй.</p>}
            </div>
            <table className="w-full text-sm">
              <caption className="sr-only">Ажлын цаг</caption>
              <tbody>
                {DAY_KEYS.map((k) => (
                  <tr key={k} className={`border-b border-line last:border-0 ${k === today ? "font-bold text-ink" : "text-ink-2"}`}>
                    <th scope="row" className="py-2 text-left font-inherit">{DAY_NAMES[k]}{k === today && <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[10px] uppercase text-accent-ink">Өнөөдөр</span>}</th>
                    <td className="py-2 text-right font-mono">{hoursLabel(b.hours[k])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => { setReporting(true); setReportText(""); }} className="mt-8 flex items-center gap-1.5 text-xs text-ink-3 hover:text-danger"><Flag size={13} aria-hidden="true" /> Энэ хуудасны талаар гомдол гаргах</button>
        </section>
      </div>

      {/* Гар утасны тогтмол товчнууд */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-[65] flex gap-2.5 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur lg:hidden">
        <button type="button" className="btn btn-accent flex-1" onClick={() => openBooking(null)} disabled={!hasBookable}>Цаг захиалах</button>
        <button type="button" className="btn btn-ghost" onClick={() => setContact(true)}><Phone size={16} aria-hidden="true" /> Холбогдох</button>
      </div>

      <BookingModal
        key={booking.service ?? "any"}
        open={booking.open}
        onClose={() => setBooking((cur) => ({ ...cur, open: false }))}
        business={{ id: b.id, name: b.name, address: b.address }}
        services={data.services}
        staff={data.staff}
        initialServiceId={booking.service}
        hours={b.hours}
      />
      <ContactModal open={contact} onClose={() => setContact(false)} business={b} />

      <Modal open={lightbox !== null} onClose={() => setLightbox(null)} title={`${b.name} зургууд`} size="xl" hideTitle>
        {lightbox !== null && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.images[lightbox].url} alt={data.images[lightbox].alt || `${b.name} зураг`} className="max-h-[68dvh] w-full rounded-2xl object-contain" />
            <div className="mt-3 flex items-center justify-between">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLightbox((lightbox - 1 + data.images.length) % data.images.length)}>Өмнөх</button>
              <span className="font-mono text-sm text-ink-3">{lightbox + 1} / {data.images.length}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLightbox((lightbox + 1) % data.images.length)}>Дараах</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={reporting} onClose={() => setReporting(false)} title="Хуудасны талаар гомдол гаргах" size="sm">
        <label className="label" htmlFor="pr-reason">Шалтгаан</label>
        <textarea id="pr-reason" className="field" rows={4} maxLength={500} value={reportText} onChange={(e) => setReportText(e.target.value)} data-autofocus />
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={async () => { const r = await reportAction("BUSINESS", b.id, reportText); toast(r.message, r.ok ? "ok" : "error"); if (r.ok) setReporting(false); }}>Илгээх</button>
      </Modal>
    </article>
  );
}
