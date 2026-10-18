"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import {
  adminDeleteBusiness, adminDeleteCategory, adminDeleteReview, adminResolveReport, adminSaveCategory, adminSetBusinessStatus,
  adminSetReviewStatus, adminSetUserRole, adminSetUserStatus, adminToggleFeatured,
} from "@/server/actions/admin";
import { CATEGORY_ICON_KEYS } from "../ui/Icon";
import { initialState } from "@/lib/types";
import { useFormAction } from "@/lib/useFormAction";
import { useToast } from "../ui/Toast";

export type AdminOp =
  | { k: "bizStatus"; id: string; to: "PENDING" | "ACTIVE" | "SUSPENDED" }
  | { k: "featured"; id: string; to: boolean }
  | { k: "bizDelete"; id: string }
  | { k: "userStatus"; id: string; to: "ACTIVE" | "BANNED" }
  | { k: "userRole"; id: string; to: "USER" | "OWNER" | "ADMIN" }
  | { k: "reviewStatus"; id: string; to: "VISIBLE" | "HIDDEN" }
  | { k: "reviewDelete"; id: string }
  | { k: "report"; id: string; to: "RESOLVED" | "DISMISSED" }
  | { k: "catDelete"; id: string };

async function run(op: AdminOp) {
  switch (op.k) {
    case "bizStatus": return adminSetBusinessStatus(op.id, op.to);
    case "featured": return adminToggleFeatured(op.id, op.to);
    case "bizDelete": return adminDeleteBusiness(op.id);
    case "userStatus": return adminSetUserStatus(op.id, op.to);
    case "userRole": return adminSetUserRole(op.id, op.to);
    case "reviewStatus": return adminSetReviewStatus(op.id, op.to);
    case "reviewDelete": return adminDeleteReview(op.id);
    case "report": return adminResolveReport(op.id, op.to);
    case "catDelete": return adminDeleteCategory(op.id);
  }
}

export function AdminBtn({ op, label, tone = "ghost", confirm }: { op: AdminOp; label: string; tone?: "ghost" | "danger" | "primary"; confirm?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={`btn btn-sm ${tone === "danger" ? "btn-danger" : tone === "primary" ? "btn-primary" : "btn-ghost"}`}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const r = await run(op);
          toast(r.message, r.ok ? "ok" : "error");
          router.refresh();
        });
      }}
    >
      {label}
    </button>
  );
}

export function CategoryForm({ initial }: { initial?: { id: string; name: string; icon: string; description: string; keywords: string } }) {
  const router = useRouter();
  const [state, onSubmit, pending] = useFormAction(
    async (prev: typeof initialState, fd: FormData) => {
      const res = await adminSaveCategory(prev, fd);
      if (res.ok) router.refresh();
      return res;
    },
    initialState,
  );
  const [open, setOpen] = useState(!initial);
  const fe = state.fieldErrors ?? {};
  if (!open) return <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Засах</button>;
  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-line bg-surface p-4" noValidate>
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`c-n-${initial?.id ?? "new"}`}>Нэр</label>
          <input id={`c-n-${initial?.id ?? "new"}`} name="name" className="field" defaultValue={initial?.name} aria-invalid={!!fe.name} />
          {fe.name && <p className="field-error">{fe.name}</p>}
        </div>
        <div>
          <label className="label" htmlFor={`c-i-${initial?.id ?? "new"}`}>Дүрс</label>
          <select id={`c-i-${initial?.id ?? "new"}`} name="icon" className="field" defaultValue={initial?.icon ?? "store"}>
            {CATEGORY_ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor={`c-d-${initial?.id ?? "new"}`}>Тайлбар</label>
        <input id={`c-d-${initial?.id ?? "new"}`} name="description" className="field" defaultValue={initial?.description} />
      </div>
      <div>
        <label className="label" htmlFor={`c-k-${initial?.id ?? "new"}`}>Хайлтын түлхүүр үгс (таслалаар тусгаарла)</label>
        <input id={`c-k-${initial?.id ?? "new"}`} name="keywords" className="field" defaultValue={initial?.keywords} />
      </div>
      {state.message && <p className={`text-sm font-medium ${state.ok ? "text-ok" : "text-danger"}`} role="status">{state.message}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>{pending ? <Loader2 size={15} className="animate-spin" /> : "Хадгалах"}</button>
        {initial && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Хаах</button>}
      </div>
    </form>
  );
}
