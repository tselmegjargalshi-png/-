"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { changePasswordAction, logoutAction, updateProfileAction } from "@/server/actions/auth";
import { setBookingStatusAction } from "@/server/actions/booking";
import { toggleSaveAction } from "@/server/actions/engage";
import { initialState } from "@/lib/types";
import { useFormAction } from "@/lib/useFormAction";
import { useToast } from "../ui/Toast";

export function UnsaveButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      disabled={pending}
      aria-label={`Хадгалсан жагсаалтаас хасах: ${name}`}
      onClick={() =>
        start(async () => {
          const res = await toggleSaveAction(id);
          if (res.ok) {
            toast("Хадгалсан жагсаалтаас хасагдлаа", "ok");
            router.refresh();
          } else toast("Үйлдэл амжилтгүй боллоо", "error");
        })
      }
    >
      Хасах
    </button>
  );
}

export function CancelBookingButton({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="btn btn-danger btn-sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Энэ захиалгыг цуцлах уу?")) return;
        start(async () => {
          const res = await setBookingStatusAction(id, "CANCELLED");
          toast(res.message, res.ok ? "ok" : "error");
          router.refresh();
        });
      }}
    >
      Цуцлах
    </button>
  );
}

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string }) {
  const [state, onSubmit, pending] = useFormAction(updateProfileAction, initialState);
  const fe = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="card grid max-w-xl gap-4 p-5 sm:p-6" noValidate>
      <div>
        <label className="label" htmlFor="p-name">Нэр</label>
        <input id="p-name" name="name" className="field" defaultValue={name} autoComplete="name" aria-invalid={!!fe.name} />
        {fe.name && <p className="field-error">{fe.name}</p>}
      </div>
      <div>
        <label className="label" htmlFor="p-email">Имэйл</label>
        <input id="p-email" className="field" value={email} readOnly aria-readonly="true" />
      </div>
      <div>
        <label className="label" htmlFor="p-phone">Утасны дугаар</label>
        <input id="p-phone" name="phone" className="field" defaultValue={phone} inputMode="tel" autoComplete="tel" />
        {fe.phone && <p className="field-error">{fe.phone}</p>}
      </div>
      {state.message && <p className={`text-sm font-medium ${state.ok ? "text-ok" : "text-danger"}`} role="status">{state.message}</p>}
      <div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Хадгалж байна</> : "Хадгалах"}
        </button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, onSubmit, pending] = useFormAction(changePasswordAction, initialState);
  const fe = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="card grid max-w-xl gap-4 p-5 sm:p-6" noValidate>
      <h3 className="text-lg font-bold">Нууц үг солих</h3>
      <div>
        <label className="label" htmlFor="pw-cur">Одоогийн нууц үг</label>
        <input id="pw-cur" name="current" type="password" className="field" autoComplete="current-password" aria-invalid={!!fe.current} />
        {fe.current && <p className="field-error">{fe.current}</p>}
      </div>
      <div>
        <label className="label" htmlFor="pw-new">Шинэ нууц үг</label>
        <input id="pw-new" name="next" type="password" className="field" autoComplete="new-password" aria-invalid={!!fe.next} />
        {fe.next && <p className="field-error">{fe.next}</p>}
      </div>
      {state.message && <p className={`text-sm font-medium ${state.ok ? "text-ok" : "text-danger"}`} role="status">{state.message}</p>}
      <div>
        <button type="submit" className="btn btn-primary" disabled={pending}>Нууц үг солих</button>
      </div>
    </form>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="btn btn-ghost">Гарах</button>
    </form>
  );
}
