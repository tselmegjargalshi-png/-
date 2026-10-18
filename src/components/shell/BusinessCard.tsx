"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";
import { useParallax } from "@/lib/hooks";
import { formatMnt, formatRating } from "@/lib/format";
import { openState } from "@/lib/hours";
import type { BusinessSummary } from "@/lib/types";
import { CategoryIcon } from "../ui/Icon";
import { useDiscovery } from "./DiscoveryProvider";
import { SaveButton } from "./SaveButton";

export type CardVariant = "feature" | "row" | "carousel";

function Price({ level }: { level: number }) {
  return (
    <span className="font-mono text-[12px] tracking-tight" aria-label={`Үнийн түвшин ${level}/4`}>
      <span className="text-ink">{"₮".repeat(level)}</span>
      <span className="text-stone">{"₮".repeat(4 - level)}</span>
    </span>
  );
}

function Status({ b, now }: { b: BusinessSummary; now: Date }) {
  const st = openState(b.hours, now);
  return (
    <span className={`flex items-center gap-1.5 text-xs font-semibold ${st.open ? "text-ok" : "text-ink-3"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${st.open ? "bg-ok" : "bg-stone"}`} aria-hidden="true" />
      {st.short}
    </span>
  );
}

export function BusinessCard({ b, variant, index = 0 }: { b: BusinessSummary; variant: CardVariant; index?: number }) {
  const d = useDiscovery();
  const active = d.selectedId === b.id;
  const hovered = d.hoveredId === b.id;
  const imgWrap = useParallax<HTMLDivElement>(variant === "feature" ? 10 : 6);
  const articleRef = useRef<HTMLElement>(null);
  const place = b.districtName ? `${b.locationName}, ${b.districtName}` : b.locationName;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      d.select(b.id);
    }
  };

  const detailLink = (
    <Link
      href={`/biznes/${b.slug}`}
      scroll={false}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        d.openBusiness(b.slug);
      }}
      className="btn btn-primary btn-sm group/btn"
      aria-label={`${b.name}: дэлгэрэнгүй`}
    >
      Дэлгэрэнгүй <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-0.5" aria-hidden="true" />
    </Link>
  );

  const reveal = (
    <div
      data-open={active || hovered}
      className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out data-[open=true]:grid-rows-[1fr] [@media(hover:none)]:grid-rows-[1fr]"
    >
      <div className="overflow-hidden">
        {b.popularService && (
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-2">
            <span className="eyebrow !text-accent-ink">Эрэлттэй</span>
            <span className="truncate font-medium">{b.popularService}</span>
          </p>
        )}
      </div>
    </div>
  );

  const motionProps = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: Math.min(index, 10) * 0.04, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  };

  if (variant === "feature") {
    return (
      <motion.article
        ref={articleRef}
        {...motionProps}
        tabIndex={0}
        role="group"
        aria-label={b.name}
        data-card-id={b.id}
        onClick={() => d.select(b.id)}
        onKeyDown={onKey}
        onMouseEnter={() => d.hover(b.id)}
        onMouseLeave={() => d.hover(null)}
        onFocus={(e) => e.target === e.currentTarget && d.hover(b.id)}
        onBlur={() => d.hover(null)}
        className={`group relative cursor-pointer overflow-hidden rounded-[1.5rem] border bg-surface transition-[box-shadow,border-color,transform] duration-300 ${
          active ? "border-ink shadow-card" : "border-line hover:border-stone hover:shadow-card"
        }`}
        style={{ contentVisibility: "auto", containIntrinsicSize: "0 360px" }}
      >
        <div ref={imgWrap} className="relative aspect-[16/10] overflow-hidden bg-surface-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.coverUrl}
            alt=""
            loading={index < 3 ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            className="h-full w-full scale-[1.08] object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.14]"
            style={{ transform: "translate3d(var(--px,0px), var(--py,0px), 0)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night/55 via-transparent to-night/10" aria-hidden="true" />
          {b.featured && <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">Онцлох</span>}
          <div className="absolute right-3 top-3">
            <SaveButton id={b.id} name={b.name} />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.logoUrl} alt="" className="absolute bottom-3 left-3 h-11 w-11 rounded-full border-2 border-surface object-cover shadow-md" draggable={false} />
          <div className="absolute bottom-3 right-3 rounded-full bg-surface/95 px-2.5 py-1">
            <Status b={b} now={d.now} />
          </div>
        </div>
        <div className="p-4">
          <p className="eyebrow flex items-center gap-1.5">
            <CategoryIcon name={b.categoryIcon} size={12} /> {b.categoryName}
          </p>
          <h3 className="mt-1.5 text-[1.3rem] font-extrabold leading-tight tracking-tight">{b.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink-2">{b.tagline}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="flex items-center gap-1 font-semibold">
              <Star size={14} className="fill-accent text-accent" aria-hidden="true" /> {formatRating(b.ratingAvg)}
              <span className="font-normal text-ink-3">({b.reviewCount})</span>
            </span>
            <Price level={b.priceLevel} />
            <span className="flex items-center gap-1 text-ink-3">
              <MapPin size={13} aria-hidden="true" /> {place}
            </span>
          </div>
          {reveal}
          <div className="mt-3.5 flex items-center justify-between gap-3">
            <span className="text-[13px] text-ink-3">{b.minPrice > 0 ? `${formatMnt(b.minPrice)}-аас` : "Үнэгүй зөвлөгөө"}</span>
            {detailLink}
          </div>
        </div>
      </motion.article>
    );
  }

  const carousel = variant === "carousel";
  return (
    <motion.article
      ref={articleRef}
      {...motionProps}
      tabIndex={0}
      role="group"
      aria-label={b.name}
      data-card-id={b.id}
      onClick={() => d.select(b.id)}
      onKeyDown={onKey}
      onMouseEnter={() => d.hover(b.id)}
      onMouseLeave={() => d.hover(null)}
      onFocus={(e) => e.target === e.currentTarget && d.hover(b.id)}
      onBlur={() => d.hover(null)}
      className={`group relative grid cursor-pointer gap-3.5 border bg-surface transition-[box-shadow,border-color] duration-300 ${
        carousel ? "w-[84vw] max-w-[22rem] shrink-0 snap-center grid-cols-[104px_1fr] rounded-[1.25rem] p-2.5 shadow-pop" : "grid-cols-[108px_1fr] rounded-[1.25rem] p-2.5"
      } ${active ? "border-ink shadow-card" : "border-line hover:border-stone hover:shadow-card"}`}
      style={carousel ? undefined : { contentVisibility: "auto", containIntrinsicSize: "0 132px" }}
    >
      <div ref={imgWrap} className="relative aspect-square self-start overflow-hidden rounded-[0.9rem] bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={b.coverUrl}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-full w-full scale-[1.1] object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.18]"
          style={{ transform: "translate3d(var(--px,0px), var(--py,0px), 0)" }}
        />
        {b.featured && <span className="absolute left-1.5 top-1.5 rounded-full bg-accent px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white">Онцлох</span>}
      </div>
      <div className="min-w-0 py-0.5 pr-1">
        <div className="flex items-start justify-between gap-2">
          <p className="eyebrow flex min-w-0 items-center gap-1.5">
            <CategoryIcon name={b.categoryIcon} size={11} /> <span className="truncate">{b.categoryName}</span>
          </p>
          <SaveButton id={b.id} name={b.name} variant="overlay" />
        </div>
        <h3 className="-mt-3 truncate pr-10 text-[1.05rem] font-bold leading-tight tracking-tight">{b.name}</h3>
        <p className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-ink-3">
          <MapPin size={12} aria-hidden="true" className="shrink-0" /> <span className="truncate">{place}</span>
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="flex items-center gap-1 text-sm font-semibold">
            <Star size={13} className="fill-accent text-accent" aria-hidden="true" /> {formatRating(b.ratingAvg)}
            <span className="font-normal text-ink-3">({b.reviewCount})</span>
          </span>
          <Price level={b.priceLevel} />
          <Status b={b} now={d.now} />
        </div>
        {reveal}
        <div
          data-open={active || hovered}
          className="mt-0 grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 data-[open=true]:grid-rows-[1fr] [@media(hover:none)]:grid-rows-[1fr]"
        >
          <div className="overflow-hidden">
            <div className="pt-2.5">{detailLink}</div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
