"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import { EMPTY_FILTERS, searchBusinesses, type Filters, type SortKey } from "@/lib/discover";
import type { BusinessSummary, CategoryInfo, LocationInfo, Viewer } from "@/lib/types";
import { toggleSaveAction, trackAction } from "@/server/actions/engage";
import { useToast } from "../ui/Toast";

export type ViewMode = "split" | "list" | "map";
export type MobileTab = "home" | "search" | "map";
export type MapMode = "3d" | "2d";

export type FocusInput =
  | { type: "point"; lat: number; lng: number; dist: number }
  | { type: "fit"; points: Array<[number, number]> }
  | { type: "country" };
export type FocusCmd = { key: number } & FocusInput;

type Ctx = {
  all: BusinessSummary[];
  categories: CategoryInfo[];
  locations: LocationInfo[];
  viewer: Viewer;
  results: BusinessSummary[];
  query: string;
  setQuery: (q: string) => void;
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  toggleCategory: (slug: string) => void;
  clearFilters: () => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  mobileTab: MobileTab;
  setMobileTab: (t: MobileTab) => void;
  mapMode: MapMode;
  setMapMode: (m: MapMode) => void;
  selectedId: string | null;
  hoveredId: string | null;
  select: (id: string | null, opts?: { fly?: boolean; fromMap?: boolean }) => void;
  hover: (id: string | null) => void;
  openBusiness: (slug: string) => void;
  closeProfile: () => void;
  profileSlug: string | null;
  profileLoaded: string | null;
  navigating: boolean;
  markProfileLoaded: (slug: string) => void;
  focus: FocusCmd | null;
  flyToLocation: (slug: string) => void;
  resetView: () => void;
  now: Date;
  saved: Set<string>;
  toggleSave: (id: string) => Promise<void>;
  authPrompt: boolean;
  setAuthPrompt: (v: boolean) => void;
  userPos: { lat: number; lng: number } | null;
  locate: () => void;
  scrollSignal: { id: string; n: number } | null;
  tint: string | null;
};

const DiscoveryContext = createContext<Ctx | null>(null);

export function useDiscovery(): Ctx {
  const c = useContext(DiscoveryContext);
  if (!c) throw new Error("useDiscovery нь DiscoveryProvider дотор ашиглагдана.");
  return c;
}

export function useDiscoveryOptional(): Ctx | null {
  return useContext(DiscoveryContext);
}

type Props = {
  businesses: BusinessSummary[];
  categories: CategoryInfo[];
  locations: LocationInfo[];
  viewer: Viewer;
  initialSaved: string[];
  nowIso: string;
  children: ReactNode;
};

export function DiscoveryProvider({ businesses, categories, locations, viewer, initialSaved, nowIso, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [query, setQueryState] = useState("");
  const [filters, setFiltersState] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [view, setView] = useState<ViewMode>("split");
  const [mobileTab, setMobileTab] = useState<MobileTab>("home");
  const [mapMode, setMapModeState] = useState<MapMode>("3d");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusCmd | null>(null);
  const [now, setNow] = useState(() => new Date(nowIso));
  const [saved, setSaved] = useState<Set<string>>(() => new Set(initialSaved));
  const [authPrompt, setAuthPrompt] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [scrollSignal, setScrollSignal] = useState<{ id: string; n: number } | null>(null);
  const focusKey = useRef(0);
  const tracked = useRef(new Set<string>());
  const hydratedFromUrl = useRef(false);

  const pathSlug = useMemo(() => {
    const m = pathname.match(/^\/biznes\/([^/]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }, [pathname]);
  // Профайлыг хүлээлгүй шууд нээж хаахын тулд хэрэглэгчийн үйлдлийг түр хадгална.
  const [pending, setPending] = useState<{ slug: string | null } | null>(null);
  if (pending && pending.slug === pathSlug) setPending(null);
  const profileSlug = pending ? pending.slug : pathSlug;
  const [profileLoaded, setProfileLoaded] = useState<string | null>(null);
  useEffect(() => {
    if (!pending) return;
    const t = window.setTimeout(() => setPending(null), 8000);
    return () => window.clearTimeout(t);
  }, [pending]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const m = window.localStorage.getItem("nb-map-mode");
        if (m === "2d" || m === "3d") setMapModeState(m);
      } catch {}
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const setMapMode = useCallback((m: MapMode) => {
    setMapModeState(m);
    try {
      window.localStorage.setItem("nb-map-mode", m);
    } catch {}
  }, []);

  const fly = useCallback((cmd: FocusInput) => {
    focusKey.current += 1;
    setFocus({ ...cmd, key: focusKey.current });
  }, []);

  const byId = useMemo(() => new Map(businesses.map((b) => [b.id, b])), [businesses]);
  const bySlug = useMemo(() => new Map(businesses.map((b) => [b.slug, b])), [businesses]);

  const results = useMemo(() => searchBusinesses(businesses, query, filters, sort, now), [businesses, query, filters, sort, now]);

  // Профайл нээгдэхэд сонголт ба камер түүн дээр төвлөрнө.
  const [seenSlug, setSeenSlug] = useState<string | null>(null);
  if (profileSlug !== seenSlug) {
    setSeenSlug(profileSlug);
    const b = profileSlug ? bySlug.get(profileSlug) : undefined;
    if (b) setSelectedId(b.id);
  }
  useEffect(() => {
    if (!profileSlug) return;
    const b = bySlug.get(profileSlug);
    if (b) fly({ type: "point", lat: b.lat, lng: b.lng, dist: 1.1 });
  }, [profileSlug, bySlug, fly]);

  // Хайлт, шүүлтүүр өөрчлөгдөхөд камер үр дүнг багтааж шилжинэ.
  const lastFit = useRef("");
  useEffect(() => {
    if (profileSlug) return;
    const sig = results.map((r) => r.id).join(",");
    if (sig === lastFit.current) return;
    const first = lastFit.current === "";
    lastFit.current = sig;
    if (first) return;
    const t = window.setTimeout(() => {
      if (results.length === 0) return;
      if (results.length === businesses.length) fly({ type: "country" });
      else fly({ type: "fit", points: results.map((r) => [r.lat, r.lng]) });
    }, 280);
    return () => window.clearTimeout(t);
  }, [results, businesses.length, profileSlug, fly]);

  const setQuery = useCallback((q: string) => setQueryState(q), []);
  const setFilters = useCallback((f: Partial<Filters>) => setFiltersState((cur) => ({ ...cur, ...f })), []);
  const toggleCategory = useCallback(
    (slug: string) => setFiltersState((cur) => ({ ...cur, categories: cur.categories.includes(slug) ? cur.categories.filter((c) => c !== slug) : [...cur.categories, slug] })),
    [],
  );
  const clearFilters = useCallback(() => {
    setFiltersState(EMPTY_FILTERS);
    setQueryState("");
  }, []);

  const select = useCallback(
    (id: string | null, opts: { fly?: boolean; fromMap?: boolean } = {}) => {
      setSelectedId(id);
      if (!id) return;
      const b = byId.get(id);
      if (!b) return;
      if (opts.fly !== false) fly({ type: "point", lat: b.lat, lng: b.lng, dist: 1.5 });
      if (opts.fromMap) setScrollSignal((s) => ({ id, n: (s?.n ?? 0) + 1 }));
      if (!tracked.current.has(id)) {
        tracked.current.add(id);
        void trackAction(id, "impressions").catch(() => {});
      }
    },
    [byId, fly],
  );

  const hover = useCallback((id: string | null) => setHoveredId(id), []);

  const openBusiness = useCallback(
    (slug: string) => {
      const b = bySlug.get(slug);
      if (b) setSelectedId(b.id);
      setPending({ slug });
      router.push(`/biznes/${slug}`, { scroll: false });
    },
    [router, bySlug],
  );

  const closeProfile = useCallback(() => {
    setPending({ slug: null });
    router.push("/", { scroll: false });
  }, [router]);

  const flyToLocation = useCallback(
    (slug: string) => {
      const l = locations.find((x) => x.slug === slug);
      if (l) fly({ type: "point", lat: l.lat, lng: l.lng, dist: l.kind === "CITY" ? 2.6 : 5.5 });
    },
    [locations, fly],
  );

  const resetView = useCallback(() => {
    setSelectedId(null);
    fly({ type: "country" });
  }, [fly]);

  const toggleSave = useCallback(
    async (id: string) => {
      if (!viewer) {
        setAuthPrompt(true);
        return;
      }
      const wasSaved = saved.has(id);
      setSaved((cur) => {
        const next = new Set(cur);
        if (wasSaved) next.delete(id);
        else next.add(id);
        return next;
      });
      const res = await toggleSaveAction(id);
      if (!res.ok) {
        setSaved((cur) => {
          const next = new Set(cur);
          if (wasSaved) next.add(id);
          else next.delete(id);
          return next;
        });
        if (res.needAuth) setAuthPrompt(true);
        else toast("Хадгалж чадсангүй. Дахин оролдоно уу.", "error");
        return;
      }
      toast(res.saved ? "Хадгалсан бизнесүүдэд нэмэгдлээ" : "Хадгалсан жагсаалтаас хасагдлаа", "ok");
    },
    [viewer, saved, toast],
  );

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast("Таны төхөөрөмж байршил тодорхойлохыг дэмжихгүй байна.", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
        const inMongolia = p.lat > 41 && p.lat < 52.5 && p.lng > 87 && p.lng < 120;
        if (inMongolia) fly({ type: "point", lat: p.lat, lng: p.lng, dist: 2.2 });
        else toast("Таны байршил Монгол улсын гадна байна.", "info");
      },
      () => toast("Байршлыг тодорхойлж чадсангүй. Хөтчийн байршлын зөвшөөрлийг шалгана уу.", "error"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }, [fly, toast]);

  const tint = filters.categories.length === 1 ? filters.categories[0] : null;

  const value: Ctx = {
    all: businesses, categories, locations, viewer, results, query, setQuery, filters, setFilters, toggleCategory, clearFilters, sort, setSort,
    view, setView, mobileTab, setMobileTab, mapMode, setMapMode, selectedId, hoveredId, select, hover, openBusiness, closeProfile, profileSlug, profileLoaded, navigating: pending !== null, markProfileLoaded: setProfileLoaded,
    focus, flyToLocation, resetView, now, saved, toggleSave, authPrompt, setAuthPrompt, userPos, locate, scrollSignal, tint,
  };

  return (
    <DiscoveryContext.Provider value={value}>
      <UrlHydrator
        onParams={(p) => {
          if (hydratedFromUrl.current) return;
          hydratedFromUrl.current = true;
          if (p.q) setQueryState(p.q);
          const cats = p.c.filter((c) => categories.some((x) => x.slug === c));
          const loc = p.l && locations.some((x) => x.slug === p.l) ? p.l : null;
          if (cats.length || loc) setFiltersState((cur) => ({ ...cur, categories: cats, location: loc }));
          if (p.t === "map" || p.t === "search" || p.t === "home") setMobileTab(p.t);
        }}
      />
      {children}
    </DiscoveryContext.Provider>
  );
}

import { Suspense } from "react";

function UrlHydrator({ onParams }: { onParams: (p: { q: string; c: string[]; l: string; t: string }) => void }) {
  return (
    <Suspense fallback={null}>
      <UrlHydratorInner onParams={onParams} />
    </Suspense>
  );
}

function UrlHydratorInner({ onParams }: { onParams: (p: { q: string; c: string[]; l: string; t: string }) => void }) {
  const sp = useSearchParams();
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== "/") return;
    onParams({ q: sp.get("q") ?? "", c: (sp.get("c") ?? "").split(",").filter(Boolean), l: sp.get("l") ?? "", t: sp.get("t") ?? "" });
  }, [sp, pathname, onParams]);
  return null;
}
