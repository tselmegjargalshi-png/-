"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircleCheck, Info, TriangleAlert } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type Tone = "ok" | "info" | "error";
type ToastItem = { id: number; text: string; tone: Tone };

const Ctx = createContext<{ toast: (text: string, tone?: Tone) => void }>({ toast: () => {} });

export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const toast = useCallback((text: string, tone: Tone = "ok") => {
    const id = ++seq.current;
    setItems((cur) => [...cur.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), 3800);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-6" role="status" aria-live="polite">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-bg shadow-pop"
            >
              {t.tone === "ok" ? <CircleCheck size={16} className="text-[#9fd3ae]" /> : t.tone === "error" ? <TriangleAlert size={16} className="text-[#f0a79b]" /> : <Info size={16} className="text-[#d9cfb8]" />}
              <span>{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
