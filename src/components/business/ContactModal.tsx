"use client";

import { Check, Copy, Globe, Loader2, Phone } from "lucide-react";
import { useState } from "react";
import { sendContactAction, trackAction } from "@/server/actions/engage";
import { formatPhone, telHref } from "@/lib/format";
import { initialState } from "@/lib/types";
import { useFormAction } from "@/lib/useFormAction";
import { FacebookIcon, InstagramIcon } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";

type B = { id: string; name: string; phone: string; email: string; website: string; instagram: string; facebook: string; isDemo: boolean };

function CopyRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const { toast } = useToast();
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-line p-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2">{icon}</span>
        <div className="min-w-0">
          <p className="eyebrow">{label}</p>
          {href ? <a href={href} className="block truncate text-[15px] font-semibold hover:underline">{value}</a> : <p className="truncate text-[15px] font-semibold">{value}</p>}
        </div>
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        aria-label={`${label} хуулах`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            toast("Хуулагдлаа", "ok");
          } catch {
            toast("Хуулж чадсангүй", "error");
          }
        }}
      >
        <Copy size={14} aria-hidden="true" /> Хуулах
      </button>
    </div>
  );
}

export function ContactModal({ open, onClose, business }: { open: boolean; onClose: () => void; business: B }) {
  const [state, onSubmit, pending] = useFormAction(sendContactAction, initialState);
  const [tracked, setTracked] = useState(false);
  const fe = state.fieldErrors ?? {};
  const note = () => {
    if (!tracked) {
      setTracked(true);
      void trackAction(business.id, "contacts").catch(() => {});
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Холбогдох" size="md">
      <div className="grid gap-2.5" onClick={note}>
        {business.phone && <CopyRow icon={<Phone size={16} />} label="Утас" value={formatPhone(business.phone)} href={business.isDemo ? undefined : telHref(business.phone)} />}
        {business.website && <CopyRow icon={<Globe size={16} />} label="Вэбсайт" value={business.website} href={business.isDemo ? undefined : `https://${business.website.replace(/^https?:\/\//, "")}`} />}
        {business.instagram && <CopyRow icon={<InstagramIcon size={16} />} label="Instagram" value={business.instagram} />}
        {business.facebook && <CopyRow icon={<FacebookIcon size={16} />} label="Facebook" value={business.facebook} />}
      </div>
      {business.isDemo && <p className="mt-3 text-xs leading-relaxed text-ink-3">Энэ бол жишээ бизнес. Дугаар, хаяг нь зохиомол тул залгах холбоос идэвхгүй, зөвхөн хуулах боломжтой.</p>}

      <h3 className="mt-6 text-base font-bold">Зурвас илгээх</h3>
      {state.ok ? (
        <p className="mt-3 flex items-center gap-2 rounded-2xl bg-surface-2 p-4 text-sm font-medium text-ok" role="status">
          <Check size={17} aria-hidden="true" /> {state.message}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 grid gap-3.5" noValidate>
          <input type="hidden" name="businessId" value={business.id} />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="ct-name">Нэр</label>
              <input id="ct-name" name="name" className="field" autoComplete="name" aria-invalid={!!fe.name} />
              {fe.name && <p className="field-error">{fe.name}</p>}
            </div>
            <div>
              <label className="label" htmlFor="ct-phone">Утасны дугаар</label>
              <input id="ct-phone" name="phone" className="field" inputMode="tel" autoComplete="tel" placeholder="99112233" aria-invalid={!!fe.phone} />
              {fe.phone && <p className="field-error">{fe.phone}</p>}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="ct-msg">Зурвас</label>
            <textarea id="ct-msg" name="message" className="field" rows={3} maxLength={500} aria-invalid={!!fe.message} />
            {fe.message && <p className="field-error">{fe.message}</p>}
          </div>
          {state.message && !state.ok && <p className="field-error" role="alert">{state.message}</p>}
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Илгээж байна</> : "Илгээх"}
          </button>
        </form>
      )}
    </Modal>
  );
}
