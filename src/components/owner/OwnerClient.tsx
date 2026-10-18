"use client";

import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { setBookingStatusAction } from "@/server/actions/booking";
import { deleteImageAction, deleteServiceAction, saveServiceAction } from "@/server/actions/owner";
import { initialState } from "@/lib/types";
import { useFormAction } from "@/lib/useFormAction";
import { formatMnt } from "@/lib/format";
import { useToast } from "../ui/Toast";

export function BookingActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const set = (s: string) =>
    start(async () => {
      const r = await setBookingStatusAction(id, s);
      toast(r.message, r.ok ? "ok" : "error");
      router.refresh();
    });
  if (status === "CANCELLED" || status === "COMPLETED") return null;
  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING" && <button type="button" disabled={pending} className="btn btn-primary btn-sm" onClick={() => set("CONFIRMED")}>Баталгаажуулах</button>}
      {status === "CONFIRMED" && <button type="button" disabled={pending} className="btn btn-ghost btn-sm" onClick={() => set("COMPLETED")}>Дууссан гэж тэмдэглэх</button>}
      <button type="button" disabled={pending} className="btn btn-danger btn-sm" onClick={() => window.confirm("Захиалгыг цуцлах уу?") && set("CANCELLED")}>Цуцлах</button>
    </div>
  );
}

type Svc = { id: string; name: string; priceMnt: number; durationMin: number; bookable: boolean };

export function ServiceManager({ businessId, services }: { businessId: string; services: Svc[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Svc | null>(null);
  const [state, onSubmit, pending] = useFormAction(
    async (prev: typeof initialState, fd: FormData) => {
      const res = await saveServiceAction(prev, fd);
      if (res.ok) {
        setEditing(null);
        router.refresh();
      }
      return res;
    },
    initialState,
  );
  const [delPending, startDel] = useTransition();
  const fe = state.fieldErrors ?? {};

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <ul className="divide-y divide-line rounded-[1.25rem] border border-line bg-surface">
        {services.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-ink-3">{s.durationMin} мин · <span className="font-mono">{formatMnt(s.priceMnt)}</span> · {s.bookable ? "Онлайн захиалгатай" : "Захиалгагүй"}</p>
            </div>
            <div className="flex gap-1">
              <button type="button" aria-label={`${s.name} засах`} className="rounded-full p-2 text-ink-2 hover:bg-surface-2" onClick={() => setEditing(s)}><Pencil size={16} /></button>
              <button
                type="button"
                aria-label={`${s.name} устгах`}
                disabled={delPending}
                className="rounded-full p-2 text-ink-2 hover:bg-surface-2 hover:text-danger"
                onClick={() => {
                  if (!window.confirm(`"${s.name}" үйлчилгээг устгах уу?`)) return;
                  startDel(async () => {
                    const r = await deleteServiceAction(s.id);
                    toast(r.message, r.ok ? "ok" : "error");
                    router.refresh();
                  });
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <form key={editing?.id ?? "new"} onSubmit={onSubmit} className="card grid h-fit gap-3.5 p-5" noValidate>
        <h3 className="text-lg font-bold">{editing ? "Үйлчилгээ засах" : "Үйлчилгээ нэмэх"}</h3>
        <input type="hidden" name="businessId" value={businessId} />
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div>
          <label className="label" htmlFor="sv-name">Нэр</label>
          <input id="sv-name" name="name" className="field" defaultValue={editing?.name ?? ""} aria-invalid={!!fe.name} />
          {fe.name && <p className="field-error">{fe.name}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="sv-price">Үнэ (₮)</label>
            <input id="sv-price" name="price" inputMode="numeric" className="field" defaultValue={editing?.priceMnt ?? ""} aria-invalid={!!fe.price} />
            {fe.price && <p className="field-error">{fe.price}</p>}
          </div>
          <div>
            <label className="label" htmlFor="sv-dur">Минут</label>
            <input id="sv-dur" name="duration" inputMode="numeric" className="field" defaultValue={editing?.durationMin ?? 30} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-2"><input type="checkbox" name="bookable" defaultChecked={editing?.bookable ?? true} className="h-4 w-4 accent-[var(--color-accent)]" /> Онлайн захиалга авах</label>
        {state.message && <p className={`text-sm font-medium ${state.ok ? "text-ok" : "text-danger"}`} role="status">{state.message}</p>}
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>{pending ? <Loader2 size={15} className="animate-spin" /> : "Хадгалах"}</button>
          {editing && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Болих</button>}
        </div>
      </form>
    </div>
  );
}

export function ImageGrid({ images }: { images: Array<{ id: string; url: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {images.map((im) => (
        <li key={im.id} className="group relative overflow-hidden rounded-xl border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={im.url} alt="" className="aspect-square w-full object-cover" loading="lazy" />
          <button
            type="button"
            aria-label="Зургийг устгах"
            disabled={pending}
            className="absolute right-1.5 top-1.5 rounded-full bg-night/80 p-1.5 text-white opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
            onClick={() =>
              start(async () => {
                const r = await deleteImageAction(im.id);
                toast(r.message, r.ok ? "ok" : "error");
                router.refresh();
              })
            }
          >
            <Trash2 size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}
