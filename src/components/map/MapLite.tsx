"use client";

import { AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { BOUNDS, OUTLINE_XZ, PLACES, ROADS, project } from "@/lib/geo";
import { CATEGORY_TINT, DEFAULT_TINT } from "@/lib/tints";
import { ClusterBubble, Marker, PlaceLabel, PreviewCard, clusterItems, type MapHandle, type MapProps } from "./shared";

type View = { cx: number; cz: number; k: number };

const CX = (BOUNDS.minX + BOUNDS.maxX) / 2;
const CZ = (BOUNDS.minZ + BOUNDS.maxZ) / 2;
const MIN_K = 14;
const MAX_K = 2600;

const polyPath = (scale = 1) =>
  OUTLINE_XZ.map(([x, z], i) => `${i ? "L" : "M"}${(CX + (x - CX) * scale).toFixed(3)} ${(CZ + (z - CZ) * scale).toFixed(3)}`).join("") + "Z";

export const MapLite = forwardRef<MapHandle, MapProps>(function MapLite(props, ref) {
  const { items, selectedId, hoveredId, now, tint, focus, userPos, places, insetLeft, insetBottom, reducedMotion, onSelect, onHover, onOpen, onReady } = props;
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [view, setView] = useState<View>({ cx: CX, cz: CZ, k: 36 });
  const viewRef = useRef(view);
  const tween = useRef<gsap.core.Tween | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ x: number; y: number; cx: number; cz: number; d: number; k: number } | null>(null);
  const moved = useRef(false);
  const lastFocus = useRef(-1);
  const insetRef = useRef({ l: insetLeft, b: insetBottom });
  insetRef.current = { l: insetLeft, b: insetBottom };

  const commit = useCallback((v: View) => {
    viewRef.current = v;
    setView(v);
  }, []);

  const fitK = useCallback((w: number, h: number, l: number, b: number) => {
    const availW = Math.max(200, w - l);
    const availH = Math.max(200, h - b);
    return Math.max(MIN_K, Math.min((availW * 0.92) / BOUNDS.width, (availH * 0.88) / BOUNDS.depth));
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const initialised = useRef(false);
  useEffect(() => {
    if (initialised.current || size.w < 10) return;
    initialised.current = true;
    commit({ cx: CX, cz: CZ, k: fitK(size.w, size.h, insetRef.current.l, insetRef.current.b) });
    onReady?.();
  }, [size, commit, fitK, onReady]);

  const flyTo = useCallback((to: Partial<View>, duration = 1.0) => {
    tween.current?.kill();
    const from = { ...viewRef.current };
    const dest = { ...from, ...to };
    dest.k = Math.min(MAX_K, Math.max(MIN_K, dest.k));
    if (reducedMotion) {
      commit(dest);
      return;
    }
    const proxy = { ...from };
    tween.current = gsap.to(proxy, { ...dest, duration, ease: "power3.inOut", onUpdate: () => commit({ ...proxy }) });
  }, [commit, reducedMotion]);

  useImperativeHandle(ref, () => ({
    zoom: (f: number) => flyTo({ k: viewRef.current.k / f }, 0.45),
    toggleTilt: () => {},
    reset: () => flyTo({ cx: CX, cz: CZ, k: fitK(size.w, size.h, insetRef.current.l, insetRef.current.b) }),
  }), [flyTo, fitK, size]);

  useEffect(() => {
    if (!focus || focus.key === lastFocus.current || size.w < 10) return;
    lastFocus.current = focus.key;
    if (focus.type === "country") {
      flyTo({ cx: CX, cz: CZ, k: fitK(size.w, size.h, insetRef.current.l, insetRef.current.b) });
    } else if (focus.type === "point") {
      const [x, z] = project(focus.lng, focus.lat);
      flyTo({ cx: x, cz: z, k: Math.min(MAX_K, Math.max(70, 1500 / Math.max(0.8, focus.dist) / 1.15)) });
    } else {
      const pts = focus.points.map(([la, ln]) => project(ln, la));
      const minX = Math.min(...pts.map((p) => p[0])), maxX = Math.max(...pts.map((p) => p[0]));
      const minZ = Math.min(...pts.map((p) => p[1])), maxZ = Math.max(...pts.map((p) => p[1]));
      const availW = Math.max(200, size.w - insetRef.current.l);
      const availH = Math.max(200, size.h - insetRef.current.b);
      const k = Math.min(MAX_K, Math.max(MIN_K, Math.min((availW * 0.7) / Math.max(0.4, maxX - minX), (availH * 0.7) / Math.max(0.4, maxZ - minZ))));
      flyTo({ cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2, k: Math.min(k, 700) });
    }
  }, [focus, flyTo, fitK, size]);

  // Дэлгэцийн төв нь нүүр самбараас үлдсэн чөлөөт хэсгийн төвд тохирно.
  const offX = insetLeft / 2;
  const offY = -insetBottom / 2;
  const toScreen = useCallback(
    (x: number, z: number) => ({ sx: size.w / 2 + offX + (x - view.cx) * view.k, sy: size.h / 2 + offY + (z - view.cz) * view.k }),
    [size, offX, offY, view],
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    const v = viewRef.current;
    const rect = wrap.current!.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    const f = Math.exp(-e.deltaY * 0.0016);
    const nk = Math.min(MAX_K, Math.max(MIN_K, v.k * f));
    const wx = v.cx + (px - size.w / 2 - offX) / v.k;
    const wz = v.cz + (py - size.h / 2 - offY) / v.k;
    tween.current?.kill();
    commit({ k: nk, cx: wx - (px - size.w / 2 - offX) / nk, cz: wz - (py - size.h / 2 - offY) / nk });
  }, [commit, size, offX, offY]);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button,a")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    tween.current?.kill();
    moved.current = false;
    const v = viewRef.current;
    const pts = [...pointers.current.values()];
    gesture.current = { x: pts[0].x, y: pts[0].y, cx: v.cx, cz: v.cz, k: v.k, d: pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0 };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const g = gesture.current;
    if (pts.length >= 2 && g.d > 0) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const nk = Math.min(MAX_K, Math.max(MIN_K, g.k * (d / g.d)));
      moved.current = true;
      commit({ ...viewRef.current, k: nk });
    } else {
      const dx = e.clientX - g.x, dy = e.clientY - g.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
      commit({ k: viewRef.current.k, cx: g.cx - dx / viewRef.current.k, cz: g.cz - dy / viewRef.current.k });
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      gesture.current = null;
      if (!moved.current) onSelect(null);
    } else {
      const v = viewRef.current;
      const pts = [...pointers.current.values()];
      gesture.current = { x: pts[0].x, y: pts[0].y, cx: v.cx, cz: v.cz, k: v.k, d: 0 };
    }
  };

  const cellWorld = 58 / view.k;
  const clusters = useMemo(() => clusterItems(items, cellWorld, [selectedId, hoveredId]), [items, cellWorld, selectedId, hoveredId]);
  const accent = tint ? CATEGORY_TINT[tint] ?? DEFAULT_TINT : DEFAULT_TINT;
  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const rings = useMemo(() => [0.965, 0.93, 0.895, 0.86, 0.825].map((s) => polyPath(s)), []);
  const outline = useMemo(() => polyPath(1), []);
  const roads = useMemo(
    () =>
      ROADS.map(([a, b], i) => {
        const A = PLACES.find((p) => p.slug === a)!, B = PLACES.find((p) => p.slug === b)!;
        const [ax, az] = project(A.lng, A.lat), [bx, bz] = project(B.lng, B.lat);
        const mx = (ax + bx) / 2 + (bz - az) * 0.08 * (i % 2 ? 1 : -1), mz = (az + bz) / 2 - (bx - ax) * 0.08 * (i % 2 ? 1 : -1);
        return `M${ax} ${az}Q${mx} ${mz} ${bx} ${bz}`;
      }),
    [],
  );
  const showAllLabels = view.k > 55;

  return (
    <div
      ref={wrap}
      className="absolute inset-0 touch-none select-none overflow-hidden"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ cursor: gesture.current ? "grabbing" : "grab" }}
    >
      <svg width={size.w} height={size.h} className="absolute inset-0" aria-hidden="true">
        <defs>
          <clipPath id="mongolia-clip" clipPathUnits="userSpaceOnUse">
            <path d={outline} />
          </clipPath>
          <radialGradient id="relief" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#6b6046" stopOpacity="0.85" />
            <stop offset="1" stopColor="#6b6046" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform={`translate(${size.w / 2 + offX - view.cx * view.k} ${size.h / 2 + offY - view.cz * view.k}) scale(${view.k})`}>
          <path d={outline} fill="#1d1b14" />
          <g clipPath="url(#mongolia-clip)">
            {[[99.8, 47.4, 3.4, 2.3, 0.8], [90.2, 48.9, 2.4, 2, 1], [94.5, 46.3, 3.2, 1.1, 0.7], [99.2, 50.6, 2.1, 1.1, 0.7], [109.4, 48.7, 2.3, 1.5, 0.6]].map(([lng, lat, rx, rz, a], i) => {
              const [x, z] = project(lng, lat);
              return <ellipse key={i} cx={x} cy={z} rx={rx * 0.68} ry={rz} fill="url(#relief)" opacity={a} />;
            })}
          </g>
          {rings.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#a79c80" strokeOpacity={0.1 + i * 0.015} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          {roads.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={accent} strokeOpacity={0.4} strokeWidth={1} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={outline} fill="none" stroke={accent} strokeWidth={1.6} strokeOpacity={0.9} vectorEffect="non-scaling-stroke" style={{ transition: "stroke 0.6s" }} />
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-0">
        {places.map((p) => {
          if (!(p.major || showAllLabels)) return null;
          const [x, z] = project(p.lng, p.lat);
          const { sx, sy } = toScreen(x, z);
          if (sx < -80 || sy < -30 || sx > size.w + 80 || sy > size.h + 30) return null;
          return (
            <div key={p.slug} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: sx, top: sy - 14 }}>
              <PlaceLabel name={p.name} major={p.major} />
            </div>
          );
        })}

        {userPos && (() => {
          const [x, z] = project(userPos.lng, userPos.lat);
          const { sx, sy } = toScreen(x, z);
          return (
            <div className="absolute flex items-center justify-center" style={{ left: sx, top: sy }}>
              <span className="absolute h-8 w-8 rounded-full bg-[#6fa6ae]/40" style={{ animation: "marker-pulse 2.2s ease-out infinite" }} />
              <span className="relative h-3.5 w-3.5 rounded-full border-2 border-white bg-[#6fa6ae]" />
            </div>
          );
        })()}

        {clusters.map((cl) => {
          const { sx, sy } = toScreen(cl.x, cl.z);
          if (sx < -60 || sy < -60 || sx > size.w + 60 || sy > size.h + 60) return null;
          const selected = cl.items.length === 1 && selectedId === cl.items[0].id;
          const hovered = cl.items.length === 1 && hoveredId === cl.items[0].id;
          return (
            <div key={cl.id} className="absolute" style={{ left: sx, top: sy, zIndex: selected ? 50 : hovered ? 40 : 10 }}>
              {cl.items.length > 1 ? (
                <ClusterBubble count={cl.items.length} onClick={() => flyTo({ cx: cl.x, cz: cl.z, k: Math.min(MAX_K, viewRef.current.k * 2.6) }, 0.8)} />
              ) : (
                <div className="relative">
                  <Marker
                    item={itemsById.get(cl.items[0].id) ?? cl.items[0]}
                    selected={selected}
                    hovered={hovered}
                    onSelect={() => onSelect(cl.items[0].id)}
                    onHover={(h) => onHover(h ? cl.items[0].id : null)}
                    onOpen={() => onOpen(cl.items[0].slug)}
                  />
                  <AnimatePresence>
                    {(selected || hovered) && props.previews !== false && <PreviewCard key="pc" item={cl.items[0]} now={now} selected={selected} onOpen={() => onOpen(cl.items[0].slug)} placement={sy < 230 ? "bottom" : "top"} />}
                  </AnimatePresence>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
