"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronUp, PanelLeftOpen, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useWindowWidth } from "@/lib/hooks";
import { MapView, PANEL_WIDTH, profileWidth } from "../map/MapView";
import { MobileNav } from "../MobileNav";
import { AuthPrompt } from "./AuthPrompt";
import { BusinessCard } from "./BusinessCard";
import { useDiscovery, type ViewMode } from "./DiscoveryProvider";
import { SearchPanel } from "./SearchPanel";

const VIEWS: Array<[ViewMode, string]> = [
  ["split", "Хуваасан"],
  ["list", "Жагсаалт"],
  ["map", "Газрын зураг"],
];

function ViewSwitchLight() {
  const d = useDiscovery();
  return (
    <div className="inline-flex rounded-full border border-line bg-surface p-1" role="group" aria-label="Харагдац">
      {VIEWS.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={d.view === v}
          onClick={() => d.setView(v)}
          className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${d.view === v ? "bg-ink text-bg" : "text-ink-2 hover:text-ink"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function MobileCarousel() {
  const d = useDiscovery();
  const ref = useRef<HTMLDivElement>(null);
  const lock = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const items = d.results.slice(0, 40);

  // Сонгосон картыг төвд авчирна.
  useEffect(() => {
    if (!d.selectedId || !ref.current) return;
    const el = ref.current.querySelector<HTMLElement>(`[data-card-id="${d.selectedId}"]`);
    if (!el) return;
    lock.current = Date.now() + 700;
    const left = el.offsetLeft - (ref.current.clientWidth - el.clientWidth) / 2;
    ref.current.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [d.selectedId]);

  const onScroll = () => {
    if (Date.now() < lock.current) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const box = ref.current;
      if (!box) return;
      const mid = box.scrollLeft + box.clientWidth / 2;
      let best: { id: string; dist: number } | null = null;
      for (const el of box.querySelectorAll<HTMLElement>("[data-card-id]")) {
        const dist = Math.abs(el.offsetLeft + el.clientWidth / 2 - mid);
        if (!best || dist < best.dist) best = { id: el.dataset.cardId!, dist };
      }
      if (best && best.id !== d.selectedId) d.select(best.id);
    }, 140);
  };

  if (items.length === 0) {
    return (
      <div className="mx-4 rounded-2xl bg-surface p-4 text-center text-sm text-ink-2 shadow-pop">Таны хайлттай тохирох бизнес олдсонгүй.</div>
    );
  }
  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-[8vw] pb-3 pt-1"
      role="region"
      aria-label="Бизнесийн картууд, хуруугаараа гүйлгэнэ"
    >
      {items.map((b, i) => (
        <BusinessCard key={b.id} b={b} variant="carousel" index={i > 4 ? 0 : i} />
      ))}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Ачаалж байна" className="p-5">
      <div className="skeleton aspect-[2/1] w-full" />
      <div className="skeleton mt-6 h-8 w-2/3" />
      <div className="skeleton mt-3 h-4 w-1/2" />
      <div className="skeleton mt-8 h-32 w-full" />
    </div>
  );
}

function ProfilePanel({ children }: { children: ReactNode }) {
  const d = useDiscovery();
  const vw = useWindowWidth();
  const open = !!d.profileSlug;
  const waiting = open && d.navigating && d.profileLoaded !== d.profileSlug;
  const [kept, setKept] = useState<ReactNode>(children);
  if (open && children !== kept) setKept(children);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.querySelector('[role="dialog"]')) return;
      d.closeProfile();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, d]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="profile"
          aria-label="Бизнесийн дэлгэрэнгүй"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ ["--pw" as string]: `${profileWidth(vw)}px` }}
          className="fixed inset-0 z-[60] flex flex-col bg-bg lg:absolute lg:inset-y-0 lg:left-0 lg:right-auto lg:z-40 lg:w-[var(--pw)] lg:border-r lg:border-line lg:shadow-pop"
        >
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-bg px-3 lg:h-14 lg:px-4">
            <button type="button" onClick={d.closeProfile} className="flex items-center gap-2 rounded-full py-2 pl-2 pr-3 text-sm font-semibold text-ink-2 hover:bg-surface-2 hover:text-ink">
              <ArrowLeft size={17} aria-hidden="true" /> Жагсаалт руу буцах
            </button>
            <button type="button" onClick={d.closeProfile} aria-label="Хаах" className="hidden h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 hover:border-ink hover:text-ink lg:flex">
              <X size={16} />
            </button>
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain" data-profile-scroll>
            {waiting && <ProfileSkeleton />}
            <div hidden={waiting}>{kept}</div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export function Shell({ header, children }: { header: ReactNode; children: ReactNode }) {
  const d = useDiscovery();
  const vw = useWindowWidth();
  const tab = d.mobileTab;
  const hideMobileHeader = tab === "map" || !!d.profileSlug;
  const panelWidth = d.view === "list" ? "100%" : d.view === "map" ? "0px" : `${PANEL_WIDTH}px`;

  const mapBox =
    tab === "home" ? "h-[44%] max-lg:bottom-auto" : tab === "search" ? "h-[44%] max-lg:invisible max-lg:pointer-events-none" : "h-full";
  const panelBox =
    tab === "home"
      ? "max-lg:top-[38%] max-lg:bottom-16 max-lg:rounded-t-[1.75rem] max-lg:shadow-[0_-18px_40px_-20px_rgba(27,26,23,0.5)]"
      : tab === "search"
        ? "max-lg:top-0 max-lg:bottom-16"
        : "max-lg:hidden";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg">
      <div className={hideMobileHeader ? "max-lg:hidden" : ""}>{header}</div>
      <main id="main" className="relative min-h-0 flex-1">
        {/* Газрын зураг */}
        <div className={`absolute isolate inset-x-0 top-0 ${mapBox} lg:inset-0 lg:!h-full lg:!visible lg:!pointer-events-auto`} data-testid="map-region">
          <MapView />
        </div>

        {/* Хайлтын самбар */}
        <div
          style={{ ["--pw" as string]: panelWidth, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)" }}
          className={`absolute inset-x-0 z-20 overflow-hidden bg-bg lg:inset-y-0 lg:left-0 lg:right-auto lg:top-0 lg:w-[var(--pw)] lg:rounded-none lg:border-r lg:border-line lg:shadow-none ${panelBox}`}
          inert={d.view === "map"}
        >
          <div className="h-full lg:w-[var(--inner)]" style={{ ["--inner" as string]: d.view === "list" ? "100%" : `${PANEL_WIDTH}px` }}>
            {tab === "home" && (
              <button
                type="button"
                onClick={() => d.setMobileTab("search")}
                className="absolute left-1/2 top-1.5 z-40 flex h-6 w-16 -translate-x-1/2 items-center justify-center rounded-full text-ink-3 lg:hidden"
                aria-label="Жагсаалтыг дэлгэх"
              >
                <ChevronUp size={18} aria-hidden="true" />
              </button>
            )}
            <SearchPanel layout={d.view === "list" && vw >= 1024 ? "wide" : "panel"} />
          </div>
          {d.view === "list" && (
            <div className="absolute right-5 top-4 z-40 hidden lg:block">
              <ViewSwitchLight />
            </div>
          )}
        </div>

        {d.view === "map" && (
          <button
            type="button"
            onClick={() => d.setView("split")}
            className="absolute left-4 top-16 z-30 hidden items-center gap-2 rounded-full border border-white/10 bg-night/85 px-4 py-2.5 text-[13px] font-semibold text-[#f1ead9] shadow-lg backdrop-blur hover:bg-night lg:flex"
          >
            <PanelLeftOpen size={16} aria-hidden="true" /> Жагсаалт харуулах
          </button>
        )}

        {/* Гар утасны газрын зургийн дээрх хайлт ба карт */}
        {tab === "map" && !d.profileSlug && (
          <>
            <div className="absolute inset-x-3 top-3 z-30 lg:hidden">
              <button
                type="button"
                onClick={() => d.setMobileTab("search")}
                className="flex h-12 w-full items-center gap-3 rounded-full border border-line bg-surface px-4 text-left text-[15px] text-ink-3 shadow-pop"
              >
                <Search size={18} aria-hidden="true" />
                <span className="truncate">{d.query || "Кафе, ресторан, салон, үйлчилгээ хайх..."}</span>
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-[4.75rem] z-30 lg:hidden">
              <MobileCarousel />
            </div>
          </>
        )}

        <ProfilePanel>{children}</ProfilePanel>
      </main>
      <MobileNavSlot />
      <AuthPrompt />
    </div>
  );
}

function MobileNavSlot() {
  const d = useDiscovery();
  return d.profileSlug ? null : <MobileNav viewer={d.viewer} />;
}
