"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import type { BusinessSummary } from "@/lib/types";
import { formatRating, priceLevel } from "@/lib/format";
import { openState } from "@/lib/hours";
import { project } from "@/lib/geo";
import { CategoryIcon } from "../ui/Icon";

export type Cluster = { id: string; x: number; z: number; items: BusinessSummary[] };

/** Ойр байрлах бизнесүүдийг тор дээр багцална. Сонгосон болон заасан бизнес багцаас гарч харагдана. */
export function clusterItems(items: BusinessSummary[], cell: number, keep: Array<string | null>): Cluster[] {
  const keepSet = new Set(keep.filter(Boolean) as string[]);
  const cells = new Map<string, BusinessSummary[]>();
  const out: Cluster[] = [];
  for (const it of items) {
    const [x, z] = project(it.lng, it.lat);
    if (keepSet.has(it.id)) {
      out.push({ id: it.id, x, z, items: [it] });
      continue;
    }
    const key = `${Math.floor(x / cell)}:${Math.floor(z / cell)}`;
    const list = cells.get(key) ?? [];
    list.push(it);
    cells.set(key, list);
  }
  for (const [key, list] of cells) {
    if (list.length === 1) {
      const [x, z] = project(list[0].lng, list[0].lat);
      out.push({ id: list[0].id, x, z, items: list });
    } else {
      let sx = 0, sz = 0;
      for (const it of list) {
        const [x, z] = project(it.lng, it.lat);
        sx += x; sz += z;
      }
      out.push({ id: `c:${key}:${list.length}`, x: sx / list.length, z: sz / list.length, items: list });
    }
  }
  return out;
}

export function Marker({
  item, selected, hovered, onSelect, onHover, onOpen, compact,
}: {
  item: BusinessSummary;
  selected: boolean;
  hovered: boolean;
  onSelect: () => void;
  onHover: (h: boolean) => void;
  onOpen: () => void;
  compact?: boolean;
}) {
  const lifted = selected || hovered;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 0, height: 0 }}>
      <motion.button
        type="button"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
        aria-label={`${item.name}, ${item.categoryName}`}
        aria-pressed={selected}
        onClick={(e) => {
          e.stopPropagation();
          if (selected) onOpen();
          else onSelect();
        }}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
        className="group pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full"
        style={{ touchAction: "manipulation" }}
      >
        {(selected || item.featured) && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-accent"
            style={{ animation: `marker-pulse ${selected ? 1.8 : 3.2}s ease-out infinite` }}
          />
        )}
        <span
          className={`relative flex items-center justify-center rounded-full border shadow-[0_6px_14px_-4px_rgb(0_0_0/0.7)] transition-all duration-300 ease-out ${
            selected
              ? "h-9 w-9 -translate-y-1.5 border-white bg-accent text-white"
              : hovered
                ? "h-8 w-8 -translate-y-1.5 border-white bg-[#f4efe4] text-ink"
                : "h-6 w-6 border-[#1b1a17] bg-[#f4efe4] text-ink"
          }`}
        >
          <CategoryIcon name={item.categoryIcon} size={selected ? 17 : lifted ? 15 : 12} strokeWidth={2} />
        </span>
        {!compact && (selected || hovered) && (
          <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-night/90 px-2.5 py-1 text-[11px] font-semibold text-[#f4efe4] shadow-md">
            {item.name}
          </span>
        )}
      </motion.button>
    </div>
  );
}

export function PreviewCard({ item, now, selected, onOpen, placement = "top" }: { item: BusinessSummary; now: Date; selected: boolean; onOpen: () => void; placement?: "top" | "bottom" }) {
  const st = openState(item.hours, now);
  return (
    <motion.div
      initial={{ opacity: 0, y: placement === "top" ? 8 : -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={`pointer-events-auto absolute left-1/2 z-20 w-[250px] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-pop ${
        placement === "top" ? "bottom-full mb-6" : "top-full mt-7"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.coverUrl} alt="" className="h-[104px] w-full object-cover" loading="lazy" draggable={false} />
      <div className="p-3">
        <p className="eyebrow">{item.categoryName}</p>
        <p className="mt-0.5 truncate text-[15px] font-bold leading-tight">{item.name}</p>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-2">
          <span className="flex items-center gap-1 font-semibold text-ink">
            <Star size={12} className="fill-accent text-accent" /> {formatRating(item.ratingAvg)}
          </span>
          <span className="text-ink-3">({item.reviewCount})</span>
          <span className="font-mono text-ink-3">{priceLevel(item.priceLevel)}</span>
          <span className={`ml-auto flex items-center gap-1 font-medium ${st.open ? "text-ok" : "text-ink-3"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${st.open ? "bg-ok" : "bg-stone"}`} />
            {st.short}
          </span>
        </div>
        {selected && (
          <Link
            href={`/biznes/${item.slug}`}
            scroll={false}
            onClick={(e) => {
              e.preventDefault();
              onOpen();
            }}
            className="btn btn-primary btn-sm mt-3 w-full"
          >
            Дэлгэрэнгүй <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </motion.div>
  );
}

export function ClusterBubble({ count, onClick }: { count: number; onClick: () => void }) {
  const size = count > 20 ? 52 : count > 9 ? 44 : 36;
  return (
    <motion.button
      type="button"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      whileHover={{ scale: 1.1 }}
      aria-label={`${count} бизнесийн бүлэг. Томруулж харах`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full"
      style={{ width: size, height: size, touchAction: "manipulation" }}
    >
      <span className="absolute inset-0 rounded-full bg-accent/25" style={{ animation: "marker-pulse 3.6s ease-out infinite" }} aria-hidden="true" />
      <span className="relative flex h-full w-full items-center justify-center rounded-full border-2 border-[#f4efe4] bg-night font-mono text-[13px] font-bold text-[#f4efe4] shadow-[0_8px_18px_-6px_rgb(0_0_0/0.8)]">
        {count}
      </span>
    </motion.button>
  );
}

export function PlaceLabel({ name, major }: { name: string; major: boolean }) {
  return (
    <span className={`pointer-events-none select-none whitespace-nowrap font-mono uppercase tracking-[0.14em] text-[#d8cfba] ${major ? "text-[10px] opacity-90" : "text-[9px] opacity-70"}`} style={{ textShadow: "0 1px 6px rgb(0 0 0 / 0.9)" }}>
      {name}
    </span>
  );
}

export type MapHandle = {
  zoom: (factor: number) => void;
  toggleTilt: () => void;
  reset: () => void;
};

export type MapProps = {
  items: BusinessSummary[];
  selectedId: string | null;
  hoveredId: string | null;
  now: Date;
  tint: string | null;
  focus: import("../shell/DiscoveryProvider").FocusCmd | null;
  userPos: { lat: number; lng: number } | null;
  places: Array<{ slug: string; name: string; lat: number; lng: number; major: boolean }>;
  insetLeft: number;
  insetBottom: number;
  active: boolean;
  reducedMotion: boolean;
  lowPower: boolean;
  previews?: boolean;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onOpen: (slug: string) => void;
  onReady?: () => void;
};
