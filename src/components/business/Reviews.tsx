"use client";

import { Camera, Flag, Loader2, Star, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { reportAction, submitReviewAction } from "@/server/actions/engage";
import { formatDateShort, formatRating, initials, pluralReviews } from "@/lib/format";
import { resizeImage } from "@/lib/image";
import { initialState } from "@/lib/types";
import { useFormAction } from "@/lib/useFormAction";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { useDiscovery } from "../shell/DiscoveryProvider";

export type ReviewItem = { id: string; authorName: string; rating: number; body: string; photos: string[]; createdAt: Date | string };

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} од`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= value ? "fill-accent text-accent" : "text-stone"} aria-hidden="true" />
      ))}
    </span>
  );
}

function ReviewForm({ businessId, slug }: { businessId: string; slug: string }) {
  const d = useDiscovery();
  const [rating, setRating] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [state, onSubmit, pending] = useFormAction(submitReviewAction, initialState, (fd) => {
    fd.delete("photos");
    for (const f of files) fd.append("photos", f);
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const fe = state.fieldErrors ?? {};

  if (!d.viewer) {
    return (
      <div className="card p-5">
        <p className="text-[15px] text-ink-2">Сэтгэгдэл бичихийн тулд нэвтэрч орно уу.</p>
        <button type="button" className="btn btn-primary btn-sm mt-3" onClick={() => d.setAuthPrompt(true)}>Нэвтрэх</button>
      </div>
    );
  }
  if (state.ok) {
    return <p className="card p-5 text-[15px] font-medium text-ok" role="status">{state.message}</p>;
  }

  const onPick = async (list: FileList | null) => {
    if (!list) return;
    const picked = [...list].slice(0, 2 - files.length);
    const resized = await Promise.all(picked.map((f) => resizeImage(f, 1400)));
    setFiles((cur) => [...cur, ...resized].slice(0, 2));
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <form
      className="card p-5"
      noValidate
      onSubmit={onSubmit}
    >
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />
      <p className="label">Таны үнэлгээ</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Үнэлгээ">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} од`} onClick={() => setRating(n)} className="rounded p-1">
            <Star size={28} className={n <= rating ? "fill-accent text-accent" : "text-stone hover:text-accent"} />
          </button>
        ))}
      </div>
      {fe.rating && <p className="field-error">{fe.rating}</p>}
      <label className="label mt-4" htmlFor="rv-body">Сэтгэгдэл</label>
      <textarea id="rv-body" name="body" rows={4} maxLength={1000} className="field" placeholder="Таны туршлага ямар байсан бэ?" aria-invalid={!!fe.body} />
      {fe.body && <p className="field-error">{fe.body}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {files.map((f, i) => (
          <span key={i} className="relative h-16 w-16 overflow-hidden rounded-xl border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={URL.createObjectURL(f)} alt={`Сонгосон зураг ${i + 1}`} className="h-full w-full object-cover" />
            <button type="button" aria-label="Зургийг хасах" onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))} className="absolute right-0.5 top-0.5 rounded-full bg-night/80 p-0.5 text-white"><X size={12} /></button>
          </span>
        ))}
        {files.length < 2 && (
          <>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" id="rv-photos" onChange={(e) => void onPick(e.target.files)} />
            <label htmlFor="rv-photos" className="btn btn-ghost btn-sm cursor-pointer"><Camera size={15} aria-hidden="true" /> Зураг нэмэх</label>
          </>
        )}
      </div>
      {state.message && !state.ok && <p className="field-error mt-3" role="alert">{state.message}</p>}
      <button type="submit" className="btn btn-primary mt-4" disabled={pending}>
        {pending ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Илгээж байна</> : "Сэтгэгдэл илгээх"}
      </button>
    </form>
  );
}

export function Reviews({
  businessId, slug, reviews, breakdown, ratingAvg, reviewCount,
}: {
  businessId: string;
  slug: string;
  reviews: ReviewItem[];
  breakdown: Array<{ star: number; count: number }>;
  ratingAvg: number;
  reviewCount: number;
}) {
  const { toast } = useToast();
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [sending, startSend] = useTransition();
  const [onlyPhotos, setOnlyPhotos] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const max = Math.max(1, ...breakdown.map((b) => b.count));
  const shown = onlyPhotos ? reviews.filter((r) => r.photos.length) : reviews;

  return (
    <section aria-labelledby="reviews-h" className="mt-12">
      <h2 id="reviews-h" className="text-2xl font-extrabold tracking-tight">Сэтгэгдэл</h2>
      <div className="mt-5 grid gap-6 sm:grid-cols-[180px_1fr]">
        <div>
          <p className="text-5xl font-extrabold tracking-tight">{reviewCount ? formatRating(ratingAvg) : "-"}</p>
          <Stars value={Math.round(ratingAvg)} size={16} />
          <p className="mt-1 text-sm text-ink-3">{pluralReviews(reviewCount)}</p>
        </div>
        <ul className="grid gap-1.5" aria-label="Үнэлгээний задаргаа">
          {breakdown.map((b) => (
            <li key={b.star} className="flex items-center gap-3 text-sm">
              <span className="w-8 shrink-0 font-mono text-ink-2">{b.star} од</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${(b.count / max) * 100}%` }} />
              </span>
              <span className="w-8 shrink-0 text-right font-mono text-ink-3">{b.count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <ReviewForm businessId={businessId} slug={slug} />
      </div>

      {reviews.some((r) => r.photos.length) && (
        <div className="mt-6">
          <button type="button" className="chip" aria-pressed={onlyPhotos} onClick={() => setOnlyPhotos((v) => !v)}>
            <Camera size={14} aria-hidden="true" /> Зурагтай
          </button>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="mt-6 text-ink-2">Одоогоор сэтгэгдэл алга. Эхний сэтгэгдлийг та бичээрэй.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {shown.map((r) => (
            <li key={r.id} className="py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-ink-2" aria-hidden="true">{initials(r.authorName)}</span>
                  <div>
                    <p className="text-[15px] font-semibold">{r.authorName}</p>
                    <p className="flex items-center gap-2 text-xs text-ink-3"><Stars value={r.rating} size={12} /> {formatDateShort(r.createdAt)}</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setReportFor(r.id); setReason(""); }} className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-ink-3 hover:text-danger" aria-label={`${r.authorName}-ийн сэтгэгдлийн талаар гомдол гаргах`}>
                  <Flag size={13} aria-hidden="true" /> Гомдол гаргах
                </button>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{r.body}</p>
              {r.photos.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {r.photos.map((p, i) => (
                    <button key={p} type="button" onClick={() => setLightbox(p)} className="h-20 w-20 overflow-hidden rounded-xl border border-line" aria-label={`Сэтгэгдлийн зураг ${i + 1}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!reportFor} onClose={() => setReportFor(null)} title="Сэтгэгдлийн талаар гомдол гаргах" size="sm">
        <label className="label" htmlFor="rp-reason">Шалтгаан</label>
        <textarea id="rp-reason" className="field" rows={4} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Яагаад зохисгүй гэж бодож байна вэ?" data-autofocus />
        <button
          type="button"
          className="btn btn-primary mt-4 w-full"
          disabled={sending}
          onClick={() =>
            startSend(async () => {
              const res = await reportAction("REVIEW", reportFor!, reason);
              toast(res.message, res.ok ? "ok" : "error");
              if (res.ok) setReportFor(null);
            })
          }
        >
          Илгээх
        </button>
      </Modal>
      <Modal open={!!lightbox} onClose={() => setLightbox(null)} title="Зураг" size="lg" hideTitle>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {lightbox && <img src={lightbox} alt="Сэтгэгдлийн зураг" className="max-h-[70dvh] w-full rounded-2xl object-contain" />}
      </Modal>
    </section>
  );
}
