"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { loginAction, registerAction } from "@/server/actions/auth";
import { initialState } from "@/lib/types";
import { useFormAction } from "@/lib/useFormAction";

function Err({ id, msg }: { id: string; msg?: string }) {
  return msg ? <p id={id} className="field-error">{msg}</p> : null;
}

export function LoginForm({ next }: { next: string }) {
  const [state, onSubmit, pending] = useFormAction(loginAction, initialState);
  const fe = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="l-email">Имэйл</label>
        <input id="l-email" name="email" type="email" className="field" autoComplete="email" aria-invalid={!!fe.email} aria-describedby={fe.email ? "l-email-e" : undefined} />
        <Err id="l-email-e" msg={fe.email} />
      </div>
      <div>
        <label className="label" htmlFor="l-pass">Нууц үг</label>
        <input id="l-pass" name="password" type="password" className="field" autoComplete="current-password" aria-invalid={!!fe.password} aria-describedby={fe.password ? "l-pass-e" : undefined} />
        <Err id="l-pass-e" msg={fe.password} />
      </div>
      {state.message && <p className="rounded-xl bg-[#f4dcd8] px-4 py-3 text-sm font-medium text-danger" role="alert">{state.message}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Нэвтэрч байна</> : "Нэвтрэх"}
      </button>
      <p className="text-center text-sm text-ink-2">
        Бүртгэлгүй юу? <Link href={`/burtgel?next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline underline-offset-4">Бүртгүүлэх</Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next, defaultRole }: { next: string; defaultRole: "USER" | "OWNER" }) {
  const [state, onSubmit, pending] = useFormAction(registerAction, initialState);
  const [role, setRole] = useState(defaultRole);
  const fe = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <fieldset>
        <legend className="label">Бүртгэлийн төрөл</legend>
        <div className="grid grid-cols-2 gap-2">
          {([["USER", "Хэрэглэгч", "Бизнес хайж, цаг захиалах"], ["OWNER", "Бизнес эзэмшигч", "Бизнесээ бүртгүүлэх"]] as const).map(([v, t, sub]) => (
            <label key={v} className={`cursor-pointer rounded-2xl border p-3.5 transition-colors ${role === v ? "border-ink bg-surface-2" : "border-line hover:border-stone"}`}>
              <input type="radio" name="role" value={v} checked={role === v} onChange={() => setRole(v)} className="sr-only" />
              <span className="block text-[15px] font-bold">{t}</span>
              <span className="mt-0.5 block text-xs text-ink-3">{sub}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="r-name">Нэр</label>
        <input id="r-name" name="name" className="field" autoComplete="name" aria-invalid={!!fe.name} />
        <Err id="r-name-e" msg={fe.name} />
      </div>
      <div>
        <label className="label" htmlFor="r-email">Имэйл</label>
        <input id="r-email" name="email" type="email" className="field" autoComplete="email" aria-invalid={!!fe.email} />
        <Err id="r-email-e" msg={fe.email} />
      </div>
      <div>
        <label className="label" htmlFor="r-pass">Нууц үг</label>
        <input id="r-pass" name="password" type="password" className="field" autoComplete="new-password" aria-invalid={!!fe.password} aria-describedby="r-pass-h" />
        <p id="r-pass-h" className="mt-1 text-xs text-ink-3">Хамгийн багадаа 8 тэмдэгт.</p>
        <Err id="r-pass-e" msg={fe.password} />
      </div>
      {state.message && <p className="rounded-xl bg-[#f4dcd8] px-4 py-3 text-sm font-medium text-danger" role="alert">{state.message}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Бүртгэж байна</> : "Бүртгүүлэх"}
      </button>
      <p className="text-center text-sm text-ink-2">
        Бүртгэлтэй юу? <Link href={`/nevtreh?next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline underline-offset-4">Нэвтрэх</Link>
      </p>
    </form>
  );
}
