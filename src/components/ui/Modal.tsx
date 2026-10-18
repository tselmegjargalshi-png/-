"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMediaQuery, useMounted } from "@/lib/hooks";

const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input:not([type="hidden"]),select,[tabindex]:not([tabindex="-1"])';

export function Modal({
  open, onClose, title, children, size = "md", sheetOnMobile = true, hideTitle = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  sheetOnMobile?: boolean;
  hideTitle?: boolean;
}) {
  const mounted = useMounted();
  const panel = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement as HTMLElement | null;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      const el = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE);
      el?.focus();
    }, 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "Tab" && panel.current) {
        const nodes = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
        if (nodes.length === 0) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      body.style.overflow = prevOverflow;
      prevFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted) return null;
  const widths = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" };
  const sheet = sheetOnMobile && !isDesktop;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-night/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={sheet ? { y: "100%" } : { opacity: 0, y: 18, scale: 0.97 }}
            animate={sheet ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={sheet ? { y: "100%" } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-surface shadow-pop ${widths[size]} ${sheet ? "rounded-t-[1.75rem]" : "rounded-[1.5rem]"}`}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 px-5 pb-2 pt-4 sm:px-6 sm:pt-5">
              {hideTitle ? <span /> : <h2 className="text-lg font-bold tracking-tight">{title}</h2>}
              <button type="button" onClick={onClose} aria-label="Хаах" className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:border-ink hover:text-ink">
                <X size={16} />
              </button>
            </div>
            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
