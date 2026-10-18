"use client";

import { useReducedMotion } from "framer-motion";
import { Compass, Layers, LocateFixed, Minus, Mountain, Plus, Search, X } from "lucide-react";
import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PLACES } from "@/lib/geo";
import { useMediaQuery, useMounted, useWindowWidth } from "@/lib/hooks";
import { normalize } from "@/lib/search";
import { useDiscovery } from "../shell/DiscoveryProvider";
import { MapLite } from "./MapLite";
import type { MapHandle } from "./shared";

const Map3D = lazy(() => import("./Map3D").then((m) => ({ default: m.Map3D })));

class Boundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function profileWidth(vw: number) {
  return Math.min(880, Math.round(vw * 0.64));
}
export const PANEL_WIDTH = 480;

export function MapView() {
  const d = useDiscovery();
  const mounted = useMounted();
  const reduced = !!useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const vw = useWindowWidth();
  const ref = useRef<MapHandle>(null);
  const [webgl, setWebgl] = useState(true);
  const [failed, setFailed] = useState(false);
  const [ready3d, setReady3d] = useState(false);
  const [lowEnd, setLowEnd] = useState(false);
  const [userChoseMode, setUserChoseMode] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeOpen, setPlaceOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setWebgl(webglAvailable());
      const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
      setLowEnd((nav.deviceMemory ?? 8) <= 2 || (nav.hardwareConcurrency ?? 8) <= 2 || !!nav.connection?.saveData);
      try {
        setUserChoseMode(!!window.localStorage.getItem("nb-map-mode"));
      } catch {}
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const wants3d = d.mapMode === "3d" && webgl && !failed && !(lowEnd && !userChoseMode);
  const use3d = mounted && wants3d;
  const mobileMapVisible = d.mobileTab !== "search";
  const desktopMapVisible = d.view !== "list";
  const active = isDesktop ? desktopMapVisible : mobileMapVisible;
  const lowPower = !isDesktop || lowEnd;

  const insetLeft = isDesktop ? (d.profileSlug ? profileWidth(vw) : d.view === "split" ? PANEL_WIDTH : 0) : 0;
  const insetBottom = !isDesktop && d.mobileTab === "map" ? 270 : 0;

  const places = useMemo(() => PLACES.map((p) => ({ slug: p.slug, name: p.name, lat: p.lat, lng: p.lng, major: !!p.major })), []);

  const common = {
    items: d.results,
    selectedId: d.selectedId,
    hoveredId: d.hoveredId,
    now: d.now,
    tint: d.tint,
    focus: d.focus,
    userPos: d.userPos,
    places,
    insetLeft,
    insetBottom,
    active,
    reducedMotion: reduced,
    lowPower,
    previews: isDesktop,
    onSelect: (id: string | null) => d.select(id, { fromMap: true }),
    onHover: d.hover,
    onOpen: d.openBusiness,
  };

  const onReady3d = useCallback(() => setReady3d(true), []);

  const placeMatches = useMemo(() => {
    const q = normalize(placeQuery);
    const base = d.locations;
    return (q ? base.filter((l) => normalize(l.name).includes(q)) : base).slice(0, 8);
  }, [placeQuery, d.locations]);

  const btn = "flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-night/80 text-[#f1ead9] shadow-lg backdrop-blur transition-colors hover:bg-night hover:text-white focus-visible:outline-accent";

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "radial-gradient(120% 90% at 50% 8%, #2a261b 0%, #17160f 55%, #0d0c09 100%)" }} data-map-ready={ready3d ? "3d" : "2d"}>
      <div className="absolute inset-0" aria-label="Монгол улсын бизнесүүдийн газрын зураг" role="application">
        {(!use3d || !ready3d) && <MapLite ref={use3d ? undefined : ref} {...common} onReady={undefined} />}
        {use3d && (
          <div className={`absolute inset-0 transition-opacity duration-700 ${ready3d ? "opacity-100" : "opacity-0"}`}>
            <Boundary onError={() => setFailed(true)}>
              <Suspense fallback={null}>
                <Map3D ref={ref} {...common} onReady={onReady3d} />
              </Suspense>
            </Boundary>
          </div>
        )}
      </div>

      {/* Дээд талын уур амьсгал */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-night/60 to-transparent" aria-hidden="true" />

      {/* Байршил хайх */}
      <div
        className="absolute top-4 z-30 hidden w-72 lg:block"
        style={{ left: insetLeft + 20, transition: "left 0.6s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bdb399]" aria-hidden="true" />
          <input
            value={placeQuery}
            onChange={(e) => {
              setPlaceQuery(e.target.value);
              setPlaceOpen(true);
            }}
            onFocus={() => setPlaceOpen(true)}
            onBlur={() => window.setTimeout(() => setPlaceOpen(false), 120)}
            aria-label="Байршил хайх"
            placeholder="Байршил хайх..."
            className="h-10 w-full rounded-full border border-white/10 bg-night/80 pl-9 pr-9 text-sm text-[#f1ead9] shadow-lg backdrop-blur placeholder:text-[#9a917b] focus:border-white/30 focus:outline-none"
          />
          {placeQuery && (
            <button type="button" aria-label="Цэвэрлэх" onClick={() => setPlaceQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#bdb399] hover:text-white">
              <X size={14} />
            </button>
          )}
          {placeOpen && placeMatches.length > 0 && (
            <ul role="listbox" className="absolute left-0 right-0 top-12 overflow-hidden rounded-2xl border border-white/10 bg-night/95 py-1 shadow-xl backdrop-blur">
              {placeMatches.map((l) => (
                <li key={l.slug} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      d.flyToLocation(l.slug);
                      setPlaceQuery(l.name);
                      setPlaceOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-[#f1ead9] hover:bg-white/10"
                  >
                    {l.name}
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#9a917b]">{l.kind === "CITY" ? "Хот" : "Аймаг"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Харагдац сонгогч (зөвхөн дэлгэц томд) */}
      <div className="absolute right-4 top-4 z-30 hidden rounded-full border border-white/10 bg-night/80 p-1 shadow-lg backdrop-blur lg:flex" role="group" aria-label="Харагдац">
        {(
          [
            ["split", "Хуваасан"],
            ["list", "Жагсаалт"],
            ["map", "Газрын зураг"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={d.view === v}
            onClick={() => d.setView(v)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${d.view === v ? "bg-[#f1ead9] text-ink" : "text-[#cfc6af] hover:text-white"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Удирдлагууд */}
      <div className="absolute right-3 z-30 flex flex-col gap-2 lg:right-4" style={{ top: isDesktop ? 72 : d.mobileTab === "map" ? 76 : 12 }}>
        <button type="button" className={`${btn} ${d.mobileTab !== "map" ? "max-lg:hidden" : ""}`} onClick={() => ref.current?.zoom(0.62)} aria-label="Томруулах">
          <Plus size={18} />
        </button>
        <button type="button" className={`${btn} ${d.mobileTab !== "map" ? "max-lg:hidden" : ""}`} onClick={() => ref.current?.zoom(1.6)} aria-label="Жижигрүүлэх">
          <Minus size={18} />
        </button>
        <button type="button" className={btn} onClick={() => d.resetView()} aria-label="Монгол орны бүтэн харагдац руу буцах" title="Бүтэн харагдац">
          <Compass size={18} />
        </button>
        <button type="button" className={btn} onClick={d.locate} aria-label="Миний байршил" title="Миний байршил">
          <LocateFixed size={18} />
        </button>
        {use3d && ready3d && (
          <button type="button" className={`${btn} ${d.mobileTab !== "map" ? "max-lg:hidden" : ""}`} onClick={() => ref.current?.toggleTilt()} aria-label="Дээрээс харах, налуу харах" title="Налуу / дээрээс">
            <Mountain size={18} />
          </button>
        )}
        {webgl && (
          <button
            type="button"
            className={`${btn} text-[11px] font-bold ${d.mobileTab !== "map" ? "max-lg:hidden" : ""}`}
            onClick={() => {
              d.setMapMode(d.mapMode === "3d" ? "2d" : "3d");
              setUserChoseMode(true);
              setReady3d(false);
            }}
            aria-label={d.mapMode === "3d" ? "2D харагдац руу шилжих" : "3D харагдац руу шилжих"}
            title={d.mapMode === "3d" ? "2D" : "3D"}
          >
            {wants3d ? "3D" : "2D"}
          </button>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-3 z-20 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8f8670] lg:flex" style={{ left: insetLeft + 20, transition: "left 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
        <Layers size={12} aria-hidden="true" />
        <span>{d.results.length} бизнес</span>
        <span aria-hidden="true">·</span>
        <span>Дүрслэлийн зорилготой газрын зураг</span>
      </div>
    </div>
  );
}
