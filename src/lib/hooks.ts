"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export function useWindowWidth(): number {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => window.removeEventListener("resize", cb);
    },
    () => window.innerWidth,
    () => 1280,
  );
}

/** Курсорын байрлалаар зургийг бага зэрэг хөдөлгөнө. CSS хувьсагч ашигладаг тул дахин зурахгүй. */
export function useParallax<T extends HTMLElement>(strength = 8) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("(hover: none)").matches) return;
    let raf = 0;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--px", `${(-x * strength).toFixed(2)}px`);
        el.style.setProperty("--py", `${(-y * strength).toFixed(2)}px`);
      });
    };
    const leave = () => {
      el.style.setProperty("--px", "0px");
      el.style.setProperty("--py", "0px");
    };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", leave);
    };
  }, [strength]);
  return ref;
}

export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
