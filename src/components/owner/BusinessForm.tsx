"use client";

import { Loader2, LocateFixed, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { OpeningHours } from "@/db/schema";
import { DAY_KEYS, DAY_NAMES } from "@/lib/format";
import { resizeImage } from "@/lib/image";
import { initialState, type ActionState, type CategoryInfo } from "@/lib/types";
import { useFormAction } from "@/lib/useFormAction";
import { useToast } from "../ui/Toast";

export type FormLocation = { slug: string; name: string; kind: string; parentSlug: string | null };
export type FormInitial = {
  businessId?: string;
  name: string; categorySlug: string; tagline: string; description: string; locationSlug: string; district: string; address: string;
  phone: string; email: string; website: string; instagram: string; facebook: string; priceLevel: number; hours: OpeningHours;
  lat?: number; lng?: number;
};
type Svc = { name: string; price: string; duration: string; bookable: boolean };

export const DEFAULT_HOURS: OpeningHours = {
  mon: ["09:00", "18:00"], tue: ["09:00", "18:00"], wed: ["09:00", "18:00"], thu: ["09:00", "18:00"], fri: ["09:00", "18:00"], sat: ["10:00", "16:00"], sun: null,
};

export const EMPTY_INITIAL: FormInitial = {
  name: "", categorySlug: "", tagline: "", description: "", locationSlug: "ulaanbaatar", district: "", address: "", phone: "", email: "",
  website: "", instagram: "", facebook: "", priceLevel: 2, hours: DEFAULT_HOURS,
};

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="field-error">{msg}</p> : null;
}

export function BusinessForm({
  mode, categories, locations, initial, action: serverAction, submitLabel,
}: {
  mode: "create" | "edit";
  categories: CategoryInfo[];
  locations: FormLocation[];
  initial: FormInitial;
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  submitLabel: string;
}) {
  const { toast } = useToast();
  const [hours, setHours] = useState<OpeningHours>(initial.hours);
  const [loc, setLoc] = useState(initial.locationSlug);
  const [district, setDistrict] = useState(initial.district);
  const [svcs, setSvcs] = useState<Svc[]>([{ name: "", price: "", duration: "30", bookable: true }]);
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(initial.lat != null && initial.lng != null ? { lat: initial.lat, lng: initial.lng } : null);
  const [logo, setLogo] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [state, onSubmit, pending] = useFormAction(serverAction, initialState, (fd) => {
    fd.delete("logo");
    fd.delete("photos");
    if (logo) fd.append("logo", logo);
    for (const f of photos) fd.append("photos", f);
    if (mode === "create") {
      fd.set("services", JSON.stringify(svcs.filter((s) => s.name.trim()).map((s) => ({ name: s.name, price: Number(s.price || 0), duration: Number(s.duration || 30), bookable: s.bookable }))));
    }
  });
  const fe = state.fieldErrors ?? {};

  const cities = locations.filter((l) => l.kind !== "DISTRICT");
  const districts = useMemo(() => locations.filter((l) => l.kind === "DISTRICT" && l.parentSlug === loc), [locations, loc]);

  const locate = () => {
    if (!("geolocation" in navigator)) return toast("Төхөөрөмж байршил тодорхойлохыг дэмжихгүй байна.", "error");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoord({ lat: Number(p.coords.latitude.toFixed(6)), lng: Number(p.coords.longitude.toFixed(6)) });
        toast("Байршил тодорхойлогдлоо", "ok");
      },
      () => toast("Байршлыг тодорхойлж чадсангүй. Зөвшөөрлөө шалгана уу.", "error"),
      { timeout: 8000 },
    );
  };

  const setDay = (k: keyof OpeningHours, v: [string, string] | null) => setHours((h) => ({ ...h, [k]: v }));

  return (
    <form onSubmit={onSubmit} className="grid gap-8" noValidate>
      {initial.businessId && <input type="hidden" name="businessId" value={initial.businessId} />}
      {coord && (<><input type="hidden" name="lat" value={coord.lat} /><input type="hidden" name="lng" value={coord.lng} /></>)}

      <section className="card grid gap-4 p-5 sm:p-6" aria-labelledby="f-basic">
        <h2 id="f-basic" className="text-xl font-extrabold tracking-tight">Үндсэн мэдээлэл</h2>
        <div>
          <label className="label" htmlFor="b-name">Бизнесийн нэр</label>
          <input id="b-name" name="name" className="field" defaultValue={initial.name} aria-invalid={!!fe.name} />
          <FieldError msg={fe.name} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="b-cat">Ангилал</label>
            <select id="b-cat" name="categorySlug" className="field" defaultValue={initial.categorySlug} aria-invalid={!!fe.categorySlug}>
              <option value="">Сонгох</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <FieldError msg={fe.categorySlug} />
          </div>
          <div>
            <label className="label" htmlFor="b-price">Үнийн түвшин</label>
            <select id="b-price" name="priceLevel" className="field" defaultValue={initial.priceLevel}>
              <option value="1">₮ Хямд</option><option value="2">₮₮ Дунд</option><option value="3">₮₮₮ Үнэтэй</option><option value="4">₮₮₮₮ Тансаг</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="b-tag">Товч тайлбар</label>
          <input id="b-tag" name="tagline" className="field" defaultValue={initial.tagline} maxLength={90} placeholder="Жишээ: Гар аргаар шарсан кофе, тайван орчин" aria-invalid={!!fe.tagline} />
          <FieldError msg={fe.tagline} />
        </div>
        <div>
          <label className="label" htmlFor="b-desc">Дэлгэрэнгүй тайлбар</label>
          <textarea id="b-desc" name="description" rows={5} className="field" defaultValue={initial.description} maxLength={1500} aria-invalid={!!fe.description} />
          <FieldError msg={fe.description} />
        </div>
      </section>

      <section className="card grid gap-4 p-5 sm:p-6" aria-labelledby="f-loc">
        <h2 id="f-loc" className="text-xl font-extrabold tracking-tight">Байршил</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="b-loc">Хот, аймаг</label>
            <select id="b-loc" name="locationSlug" className="field" value={loc} onChange={(e) => { setLoc(e.target.value); setDistrict(""); }} aria-invalid={!!fe.locationSlug}>
              {cities.map((l) => <option key={l.slug} value={l.slug}>{l.name}</option>)}
            </select>
            <FieldError msg={fe.locationSlug} />
          </div>
          {districts.length > 0 && (
            <div>
              <label className="label" htmlFor="b-dist">Дүүрэг</label>
              <select id="b-dist" name="district" className="field" value={district} onChange={(e) => setDistrict(e.target.value)}>
                <option value="">Сонгох</option>
                {districts.map((l) => <option key={l.slug} value={l.slug}>{l.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div>
          <label className="label" htmlFor="b-addr">Хаяг</label>
          <input id="b-addr" name="address" className="field" defaultValue={initial.address} aria-invalid={!!fe.address} />
          <FieldError msg={fe.address} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-ghost btn-sm" onClick={locate}><LocateFixed size={15} aria-hidden="true" /> Миний байршлыг ашиглах</button>
          <span className="text-sm text-ink-3">{coord ? `Координат: ${coord.lat}, ${coord.lng}` : "Тодорхойлоогүй бол сонгосон хот, дүүргийн төвд байрлана."}</span>
        </div>
      </section>

      <section className="card grid gap-4 p-5 sm:p-6" aria-labelledby="f-contact">
        <h2 id="f-contact" className="text-xl font-extrabold tracking-tight">Холбоо барих</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="b-phone">Утасны дугаар</label>
            <input id="b-phone" name="phone" inputMode="tel" className="field" defaultValue={initial.phone} placeholder="99112233" aria-invalid={!!fe.phone} />
            <FieldError msg={fe.phone} />
          </div>
          <div>
            <label className="label" htmlFor="b-email">Имэйл (заавал биш)</label>
            <input id="b-email" name="email" type="email" className="field" defaultValue={initial.email} aria-invalid={!!fe.email} />
            <FieldError msg={fe.email} />
          </div>
          <div>
            <label className="label" htmlFor="b-web">Вэбсайт (заавал биш)</label>
            <input id="b-web" name="website" className="field" defaultValue={initial.website} placeholder="example.mn" />
          </div>
          <div>
            <label className="label" htmlFor="b-ig">Instagram (заавал биш)</label>
            <input id="b-ig" name="instagram" className="field" defaultValue={initial.instagram} placeholder="@tanybiznes" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="b-fb">Facebook (заавал биш)</label>
            <input id="b-fb" name="facebook" className="field" defaultValue={initial.facebook} />
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6" aria-labelledby="f-hours">
        <h2 id="f-hours" className="text-xl font-extrabold tracking-tight">Ажлын цаг</h2>
        <ul className="mt-4 grid gap-2.5">
          {DAY_KEYS.map((k) => {
            const range = hours[k];
            return (
              <li key={k} className="grid grid-cols-[5rem_1fr_auto] items-center gap-3 sm:grid-cols-[6rem_1fr_1fr_auto]">
                <span className="text-sm font-semibold">{DAY_NAMES[k]}</span>
                <input aria-label={`${DAY_NAMES[k]} нээх цаг`} type="time" name={`hours_${k}_open`} className="field !min-h-10 !py-1.5" value={range?.[0] ?? "09:00"} disabled={!range} onChange={(e) => setDay(k, [e.target.value, range?.[1] ?? "18:00"])} />
                <input aria-label={`${DAY_NAMES[k]} хаах цаг`} type="time" name={`hours_${k}_close`} className="field !min-h-10 !py-1.5 max-sm:hidden" value={range?.[1] === "24:00" ? "23:59" : range?.[1] ?? "18:00"} disabled={!range} onChange={(e) => setDay(k, [range?.[0] ?? "09:00", e.target.value])} />
                <label className="flex items-center gap-2 text-sm text-ink-2">
                  <input type="checkbox" name={`hours_${k}_closed`} checked={!range} onChange={(e) => setDay(k, e.target.checked ? null : ["09:00", "18:00"])} className="h-4 w-4 accent-[var(--color-accent)]" /> Амарна
                </label>
              </li>
            );
          })}
        </ul>
        {fe.hours && <p className="field-error mt-3">{fe.hours}</p>}
      </section>

      {mode === "create" && (
        <section className="card p-5 sm:p-6" aria-labelledby="f-svc">
          <h2 id="f-svc" className="text-xl font-extrabold tracking-tight">Үйлчилгээ ба үнэ</h2>
          <p className="mt-1 text-sm text-ink-3">Хамгийн багадаа нэг үйлчилгээ нэмнэ үү. Дараа нь самбараас засах боломжтой.</p>
          <ul className="mt-4 grid gap-3">
            {svcs.map((s, i) => (
              <li key={i} className="grid grid-cols-2 items-end gap-3 rounded-2xl border border-line p-3 sm:grid-cols-[1fr_7rem_6rem_auto]">
                <div className="col-span-2 sm:col-span-1">
                  <label className="label" htmlFor={`s-n-${i}`}>Нэр</label>
                  <input id={`s-n-${i}`} className="field" value={s.name} onChange={(e) => setSvcs((c) => c.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                </div>
                <div>
                  <label className="label" htmlFor={`s-p-${i}`}>Үнэ (₮)</label>
                  <input id={`s-p-${i}`} className="field" inputMode="numeric" value={s.price} onChange={(e) => setSvcs((c) => c.map((x, j) => (j === i ? { ...x, price: e.target.value.replace(/\D/g, "") } : x)))} />
                </div>
                <div>
                  <label className="label" htmlFor={`s-d-${i}`}>Минут</label>
                  <input id={`s-d-${i}`} className="field" inputMode="numeric" value={s.duration} onChange={(e) => setSvcs((c) => c.map((x, j) => (j === i ? { ...x, duration: e.target.value.replace(/\D/g, "") } : x)))} />
                </div>
                <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1">
                  <label className="flex items-center gap-2 text-sm text-ink-2"><input type="checkbox" checked={s.bookable} onChange={(e) => setSvcs((c) => c.map((x, j) => (j === i ? { ...x, bookable: e.target.checked } : x)))} className="h-4 w-4 accent-[var(--color-accent)]" /> Онлайн захиалга</label>
                  {svcs.length > 1 && <button type="button" aria-label="Үйлчилгээг хасах" className="rounded-full p-2 text-ink-3 hover:text-danger" onClick={() => setSvcs((c) => c.filter((_, j) => j !== i))}><Trash2 size={16} /></button>}
                </div>
              </li>
            ))}
          </ul>
          {fe.services && <p className="field-error mt-3">{fe.services}</p>}
          <button type="button" className="btn btn-ghost btn-sm mt-4" onClick={() => setSvcs((c) => [...c, { name: "", price: "", duration: "30", bookable: true }])}><Plus size={15} aria-hidden="true" /> Үйлчилгээ нэмэх</button>
        </section>
      )}

      <section className="card grid gap-4 p-5 sm:p-6" aria-labelledby="f-img">
        <h2 id="f-img" className="text-xl font-extrabold tracking-tight">Зураг</h2>
        <div>
          <label className="label" htmlFor="b-logo">Лого (заавал биш)</label>
          <input id="b-logo" type="file" accept="image/jpeg,image/png,image/webp" className="field !py-2.5" onChange={async (e) => { const f = e.target.files?.[0]; setLogo(f ? await resizeImage(f, 400) : null); }} />
        </div>
        <div>
          <label className="label" htmlFor="b-photos">Бизнесийн зургууд (6 хүртэл, заавал биш)</label>
          <input id="b-photos" type="file" multiple accept="image/jpeg,image/png,image/webp" className="field !py-2.5" onChange={async (e) => setPhotos(await Promise.all([...(e.target.files ?? [])].slice(0, 6).map((f) => resizeImage(f, 1400))))} />
          <p className="mt-1 text-xs text-ink-3">Зураг оруулахгүй бол бидний жишээ зураг түр харагдана. Зураг бүр хөтөч дээр автоматаар жижигрүүлэгдэнэ.</p>
        </div>
      </section>

      {state.message && <p className={`rounded-xl px-4 py-3 text-sm font-medium ${state.ok ? "bg-[#d6e8dc] text-ok" : "bg-[#f4dcd8] text-danger"}`} role={state.ok ? "status" : "alert"}>{state.message}</p>}
      <div>
        <button type="submit" className="btn btn-accent" disabled={pending}>
          {pending ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Хадгалж байна</> : submitLabel}
        </button>
      </div>
    </form>
  );
}
