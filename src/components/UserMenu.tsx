"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bookmark, CalendarDays, LayoutDashboard, LogOut, Shield, User } from "lucide-react";
import { logoutAction } from "@/server/actions/auth";
import { initials } from "@/lib/format";
import type { Viewer } from "@/lib/types";

export function UserMenu({ viewer }: { viewer: NonNullable<Viewer> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink";
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Хэрэглэгчийн цэс"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-bold text-white transition-transform hover:scale-105"
      >
        {initials(viewer.name)}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-2xl border border-line bg-surface p-2 shadow-pop">
          <div className="px-3 pb-2 pt-1.5">
            <p className="truncate text-sm font-semibold">{viewer.name}</p>
            <p className="truncate text-xs text-ink-3">{viewer.email}</p>
          </div>
          <div className="h-px bg-line" />
          <div className="py-1">
            <Link role="menuitem" href="/hereglegch" className={item} onClick={() => setOpen(false)}>
              <User size={16} /> Миний бүртгэл
            </Link>
            <Link role="menuitem" href="/hereglegch?tab=hadgalsan" className={item} onClick={() => setOpen(false)}>
              <Bookmark size={16} /> Хадгалсан бизнесүүд
            </Link>
            <Link role="menuitem" href="/hereglegch?tab=zahialga" className={item} onClick={() => setOpen(false)}>
              <CalendarDays size={16} /> Миний захиалгууд
            </Link>
            {(viewer.role === "OWNER" || viewer.role === "ADMIN") && (
              <Link role="menuitem" href="/biznes" className={item} onClick={() => setOpen(false)}>
                <LayoutDashboard size={16} /> Бизнесийн самбар
              </Link>
            )}
            {viewer.role === "ADMIN" && (
              <Link role="menuitem" href="/udirdlaga" className={item} onClick={() => setOpen(false)}>
                <Shield size={16} /> Админ самбар
              </Link>
            )}
          </div>
          <div className="h-px bg-line" />
          <form action={logoutAction} className="pt-1">
            <button type="submit" role="menuitem" className={`${item} w-full`}>
              <LogOut size={16} /> Гарах
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
