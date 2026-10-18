"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EMPTY_FILTERS, SORT_LABELS, SUGGESTIONS, activeFilterCount, type SortKey } from "@/lib/discover";
import { CategoryIcon } from "../ui/Icon";
import { Popover } from "../ui/Popover";
import { BusinessCard } from "./BusinessCard";
import { useDiscovery } from "./DiscoveryProvider";

const SHORTCUT_COUNT = 8;

/** Бизнесийн профайл нээлттэй үед нүүрний гарчиг h1 байж болохгүй, хуудсанд нэг л h1 байна. */
function Heading({ asH1, className, children }: { asH1: boolean; className: string; children: React.ReactNode }) {
  return asH1 ? <h1 className={className}>{children}</h1> : <p className={className}>{children}</p>;
}

export function SearchPanel({ layout }: { layout: "panel" | "wide" }) {
  const d = useDiscovery();
  const [showAllCats, setShowAllCats] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const filterCount = activeFilterCount(d.filters);
  const catCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of d.all) m.set(b.categorySlug, (m.get(b.categorySlug) ?? 0) + 1);
    return m;
  }, [d.all]);

  // Газрын зургаас сонгосон бизнесийн картыг жагсаалтад харуулна.
  useEffect(() => {
    if (!d.scrollSignal) return;
    const el = scrollRef.current?.querySelector<HTMLElement>(`[data-card-id="${d.scrollSignal.id}"]`);
    el?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [d.scrollSignal]);

  const serviceOptions = useMemo(() => {
    const count = new Map<string, number>();
    for (const b of d.all) for (const s of b.serviceNames) count.set(s, (count.get(s) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name);
  }, [d.all]);

  const shortcuts = d.categories.slice(0, SHORTCUT_COUNT);
  const rest = d.categories.slice(SHORTCUT_COUNT);
  const featuredMode = d.sort === "recommended" && !d.query && filterCount === 0;

  const grid = layout === "wide";

  return (
    <section aria-label="Бизнес хайх" className="flex h-full min-h-0 flex-col bg-bg">
      <div ref={scrollRef} className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className={grid ? "mx-auto w-full max-w-6xl px-5 lg:px-8" : "px-4 sm:px-5"}>
          <Heading className={`${grid ? "pt-8 text-5xl" : "pt-7 text-[2rem] lg:pt-6 lg:text-[2.35rem]"} font-extrabold leading-[1.02] tracking-[-0.035em]`} asH1={!d.profileSlug}>
            Юу хайж байна<span className="text-accent">?</span>
          </Heading>
        </div>

        <div className={`sticky top-0 z-30 bg-bg/95 pb-3 pt-3 backdrop-blur ${grid ? "" : ""}`}>
          <div className={grid ? "mx-auto w-full max-w-6xl px-5 lg:px-8" : "px-4 sm:px-5"}>
            <div className="relative">
              <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={d.query}
                onChange={(e) => d.setQuery(e.target.value)}
                onFocus={() => {
                  setFocused(true);
                  if (d.mobileTab === "home") d.setMobileTab("search");
                }}
                onBlur={() => window.setTimeout(() => setFocused(false), 140)}
                placeholder="Кафе, ресторан, салон, үйлчилгээ хайх..."
                aria-label="Бизнес хайх"
                autoComplete="off"
                enterKeyHint="search"
                className="field !h-[3.4rem] !rounded-2xl !pl-12 !pr-12 text-[1.02rem] shadow-card"
              />
              {d.query && (
                <button type="button" aria-label="Хайлтыг цэвэрлэх" onClick={() => { d.setQuery(""); inputRef.current?.focus(); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink">
                  <X size={16} />
                </button>
              )}
              <AnimatePresence>
                {focused && !d.query && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 rounded-2xl border border-line bg-surface p-3 shadow-pop"
                  >
                    <p className="eyebrow mb-2 px-1">Түгээмэл хайлт</p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button key={s} type="button" className="chip" onMouseDown={(e) => e.preventDefault()} onClick={() => { d.setQuery(s); inputRef.current?.blur(); }}>
                          <Search size={13} aria-hidden="true" /> {s}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={`mt-3 flex gap-2 ${showAllCats ? "flex-wrap" : "no-scrollbar -mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5"}`} role="group" aria-label="Ангилал">
              {(showAllCats ? d.categories : shortcuts).map((c) => (
                <button key={c.slug} type="button" className="chip" aria-pressed={d.filters.categories.includes(c.slug)} onClick={() => d.toggleCategory(c.slug)}>
                  <CategoryIcon name={c.icon} size={15} /> {c.name}
                </button>
              ))}
              {rest.length > 0 && (
                <button type="button" className="chip !border-dashed" onClick={() => setShowAllCats((s) => !s)} aria-expanded={showAllCats}>
                  {showAllCats ? "Цөөлөх" : `Бусад (${rest.length})`}
                </button>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2" role="group" aria-label="Шүүлтүүр">
              <Popover label={d.filters.location ? d.locations.find((l) => l.slug === d.filters.location)?.name ?? "Байршил" : "Байршил"} active={!!d.filters.location}>
                {(close) => (
                  <div className="max-h-72 overflow-y-auto scroll-thin">
                    <OptionRow selected={!d.filters.location} onClick={() => { d.setFilters({ location: null }); d.resetView(); close(); }}>Бүх байршил</OptionRow>
                    {d.locations.map((l) => (
                      <OptionRow key={l.slug} selected={d.filters.location === l.slug} onClick={() => { d.setFilters({ location: l.slug }); d.flyToLocation(l.slug); close(); }}>
                        {l.name}
                        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-ink-3">{l.kind === "CITY" ? "Хот" : "Аймаг"}</span>
                      </OptionRow>
                    ))}
                  </div>
                )}
              </Popover>

              <Popover label={d.filters.prices.length ? `Үнэ: ${d.filters.prices.map((p) => "₮".repeat(p)).join(", ")}` : "Үнийн түвшин"} active={d.filters.prices.length > 0} width={300}>
                {() => (
                  <div>
                    <p className="eyebrow mb-2">Үнийн түвшин</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((p) => {
                        const on = d.filters.prices.includes(p);
                        return (
                          <button key={p} type="button" className="chip !justify-center font-mono" aria-pressed={on} onClick={() => d.setFilters({ prices: on ? d.filters.prices.filter((x) => x !== p) : [...d.filters.prices, p] })}>
                            {"₮".repeat(p)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Popover>

              <Popover label={d.filters.minRating ? `Үнэлгээ ${d.filters.minRating.toFixed(1)}+` : "Үнэлгээ"} active={d.filters.minRating > 0} width={240}>
                {(close) => (
                  <div>
                    {[0, 3.5, 4, 4.5].map((r) => (
                      <OptionRow key={r} selected={d.filters.minRating === r} onClick={() => { d.setFilters({ minRating: r }); close(); }}>
                        {r === 0 ? "Бүгд" : `${r.toFixed(1)} ба түүнээс дээш`}
                      </OptionRow>
                    ))}
                  </div>
                )}
              </Popover>

              <button type="button" className="chip" aria-pressed={d.filters.openNow} onClick={() => d.setFilters({ openNow: !d.filters.openNow })}>
                <span className={`h-2 w-2 rounded-full ${d.filters.openNow ? "bg-[#9fd3ae]" : "bg-ok"}`} aria-hidden="true" /> Нээлттэй
              </button>
              <button type="button" className="chip" aria-pressed={d.filters.featured} onClick={() => d.setFilters({ featured: !d.filters.featured })}>
                Онцлох
              </button>

              <ServiceFilter options={serviceOptions} value={d.filters.service} onChange={(s) => d.setFilters({ service: s })} />

              {(filterCount > 0 || d.query) && (
                <button type="button" className="chip !border-transparent !bg-transparent text-accent-ink hover:!border-line" onClick={() => { d.clearFilters(); d.resetView(); }}>
                  <X size={14} aria-hidden="true" /> Цэвэрлэх
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={`pb-28 pt-1 lg:pb-10 ${grid ? "mx-auto w-full max-w-6xl px-5 lg:px-8" : "px-4 sm:px-5"}`}>
          <div className="mb-3 flex items-center justify-between gap-3" aria-live="polite">
            <p className="text-sm text-ink-2">
              <span className="font-bold text-ink">{d.results.length}</span> бизнес олдлоо
            </p>
            <label className="flex items-center gap-2 text-[13px] text-ink-3">
              <SlidersHorizontal size={14} aria-hidden="true" />
              <span className="sr-only">Эрэмбэлэх</span>
              <select
                value={d.sort}
                onChange={(e) => d.setSort(e.target.value as SortKey)}
                className="cursor-pointer rounded-lg border-0 bg-transparent py-1 pr-1 text-[13px] font-semibold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <option key={k} value={k}>
                    {SORT_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {d.results.length === 0 ? (
            <EmptyState catCounts={catCounts} />
          ) : (
            <ul className={grid ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-3"}>
              {d.results.map((b, i) => (
                <li key={b.id} className="list-none">
                  <BusinessCard b={b} index={i} variant={grid ? "feature" : featuredMode && b.featured && i < 3 ? "feature" : "row"} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function OptionRow({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-surface-2 ${selected ? "bg-surface-2 text-ink" : "text-ink-2"}`}>
      <span className="flex h-4 w-4 items-center justify-center">{selected && <Check size={14} className="text-accent" />}</span>
      {children}
    </button>
  );
}

function ServiceFilter({ options, value, onChange }: { options: string[]; value: string | null; onChange: (s: string | null) => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (t ? options.filter((o) => o.toLowerCase().includes(t)) : options).slice(0, 40);
  }, [options, q]);
  return (
    <Popover label={value ? `Үйлчилгээ: ${value.length > 16 ? `${value.slice(0, 16)}…` : value}` : "Үйлчилгээ"} active={!!value} width={300}>
      {(close) => (
        <div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Үйлчилгээний нэр хайх..." aria-label="Үйлчилгээний нэр хайх" className="field !min-h-10 !py-2 text-sm" />
          <div className="scroll-thin mt-2 max-h-64 overflow-y-auto">
            {value && <OptionRow selected={false} onClick={() => { onChange(null); close(); }}>Шүүлтүүрийг арилгах</OptionRow>}
            {list.map((o) => (
              <OptionRow key={o} selected={value === o} onClick={() => { onChange(o); close(); }}>
                {o}
              </OptionRow>
            ))}
            {list.length === 0 && <p className="px-3 py-4 text-sm text-ink-3">Тохирох үйлчилгээ олдсонгүй.</p>}
          </div>
        </div>
      )}
    </Popover>
  );
}

function EmptyState({ catCounts }: { catCounts: Map<string, number> }) {
  const d = useDiscovery();
  const top = d.categories
    .filter((c) => (catCounts.get(c.slug) ?? 0) > 0)
    .sort((a, b) => (catCounts.get(b.slug) ?? 0) - (catCounts.get(a.slug) ?? 0))
    .slice(0, 6);
  return (
    <div className="rounded-[1.5rem] border border-dashed border-stone bg-surface/60 p-6 text-center">
      <svg viewBox="0 0 120 60" className="mx-auto h-14 text-stone" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M4 52 30 20l14 18 16-26 20 28 12-12 24 24" />
        <circle cx="96" cy="14" r="5" />
      </svg>
      <p className="mt-3 text-lg font-bold tracking-tight">Таны хайлттай тохирох бизнес олдсонгүй.</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-ink-3">Өөр үгээр хайх эсвэл шүүлтүүрээ багасгаад үзнэ үү. Эсвэл эдгээр ангиллыг сонирхоорой:</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {top.map((c) => (
          <button key={c.slug} type="button" className="chip" onClick={() => { d.clearFilters(); d.toggleCategory(c.slug); }}>
            <CategoryIcon name={c.icon} size={14} /> {c.name}
          </button>
        ))}
      </div>
      <button type="button" className="btn btn-ghost btn-sm mt-5" onClick={() => { d.clearFilters(); d.setFilters(EMPTY_FILTERS); d.resetView(); }}>
        Шүүлтүүрийг цэвэрлэх
      </button>
    </div>
  );
}
