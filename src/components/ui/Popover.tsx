"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Popover({
  label, active, children, align = "left", width = 280,
}: {
  label: ReactNode;
  active?: boolean;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" className="chip" aria-pressed={!!active} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div
          role="dialog"
          className={`absolute top-[calc(100%+0.5rem)] z-40 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-3 shadow-pop ${align === "right" ? "right-0" : "left-0"}`}
          style={{ width }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
