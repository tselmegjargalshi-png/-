/**
 * Үзүүлэнгийн зургийн үүсгүүр. Бодит гэрэл зураг оронд ангилал бүрийн өнгөний уур амьсгалтай
 * найруулгат SVG зургийг seed-ээр тогтвортойгоор гаргана. Хэрэглэгч өөрийн зургийг оруулахад
 * энэ нь зөвхөн нөөц зураг болно.
 */

export type Theme =
  | "coffee" | "dining" | "beauty" | "barber" | "sport" | "cloth" | "craft" | "shop"
  | "hotel" | "event" | "service" | "freelance" | "studio" | "other";

type Palette = { skyTop: string; skyBottom: string; sun: string; far: string; mid: string; near: string; ink: string; paper: string };

const PALETTES: Record<Theme, Palette> = {
  coffee: { skyTop: "#E8DCC6", skyBottom: "#D4AE84", sun: "#C4531F", far: "#A98467", mid: "#6E5441", near: "#2C231D", ink: "#241C17", paper: "#F2EADB" },
  dining: { skyTop: "#E5C7AB", skyBottom: "#C98A62", sun: "#F0DDBF", far: "#9C5E44", mid: "#6B3F2F", near: "#2A1B16", ink: "#26170F", paper: "#F1E3D1" },
  beauty: { skyTop: "#EBD9D0", skyBottom: "#CFA899", sun: "#B84A2C", far: "#B58C80", mid: "#8B6A62", near: "#3A2C2B", ink: "#2F2321", paper: "#F4E8E1" },
  barber: { skyTop: "#C9C2B4", skyBottom: "#8F8776", sun: "#C99A4A", far: "#5E584D", mid: "#3A362F", near: "#171614", ink: "#12110F", paper: "#E3DDD0" },
  sport: { skyTop: "#B7C4C9", skyBottom: "#7E949C", sun: "#E27D3C", far: "#51666E", mid: "#32454C", near: "#151F23", ink: "#10181B", paper: "#DCE3E4" },
  cloth: { skyTop: "#E3D8C8", skyBottom: "#BFA68B", sun: "#7A2E2A", far: "#8F7762", mid: "#5D4A3E", near: "#241C17", ink: "#201815", paper: "#EFE6D8" },
  craft: { skyTop: "#C6CBD6", skyBottom: "#8D97B0", sun: "#D08A2E", far: "#566188", mid: "#38426A", near: "#161A2C", ink: "#121626", paper: "#E2E4EB" },
  shop: { skyTop: "#E6DAC4", skyBottom: "#C9B390", sun: "#2F5D62", far: "#9A8767", mid: "#6A5A44", near: "#2A231A", ink: "#241E16", paper: "#F0E8D6" },
  hotel: { skyTop: "#C8D3DB", skyBottom: "#E9C9A2", sun: "#F4E2B8", far: "#7B8F9A", mid: "#4A5E69", near: "#1D2A31", ink: "#16222A", paper: "#E6EAEC" },
  event: { skyTop: "#2A2E45", skyBottom: "#8B5A57", sun: "#F2B66D", far: "#41405E", mid: "#2A2A44", near: "#12121F", ink: "#0E0E18", paper: "#D9D7E3" },
  service: { skyTop: "#D3D6D2", skyBottom: "#A1A89F", sun: "#C4531F", far: "#6D756C", mid: "#454C45", near: "#1B1F1B", ink: "#161A16", paper: "#E4E6E1" },
  freelance: { skyTop: "#E9E4D8", skyBottom: "#CFC6B2", sun: "#C4531F", far: "#8B8470", mid: "#5A5546", near: "#23211B", ink: "#1D1B16", paper: "#F3EFE4" },
  studio: { skyTop: "#E6D8C9", skyBottom: "#C4A992", sun: "#2B4C5A", far: "#8A7260", mid: "#5A4538", near: "#21180F", ink: "#1B130C", paper: "#EFE5D8" },
  other: { skyTop: "#DDD8CC", skyBottom: "#B6AE9C", sun: "#C4531F", far: "#7F7967", mid: "#524E41", near: "#1F1D17", ink: "#191711", paper: "#EDE8DB" },
};

export const CATEGORY_THEME: Record<string, Theme> = {
  kafe: "coffee",
  restoran: "dining",
  "goo-saikhan": "beauty",
  uschin: "barber",
  sport: "sport",
  khuvtsas: "cloth",
  "gar-urlal": "craft",
  delguur: "shop",
  "zochid-buudal": "hotel",
  "arga-khemjee": "event",
  uilchilgee: "service",
  frilanser: "freelance",
  "buteelch-studi": "studio",
  busad: "other",
};

export function isTheme(t: string): t is Theme {
  return t in PALETTES;
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 1600;
const H = 1000;

function ridge(r: () => number, base: number, amp: number, rough: number, color: string, opacity = 1): string {
  const steps = 40;
  const phase1 = r() * 6.28, phase2 = r() * 6.28, phase3 = r() * 6.28;
  const f1 = 0.6 + r() * 0.8, f2 = 1.8 + r() * 1.5;
  let d = `M0 ${H} L0 ${base}`;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * W;
    const t = i / steps;
    const y =
      base -
      amp * (0.55 * Math.sin(t * Math.PI * f1 * 2 + phase1) + 0.3 * Math.sin(t * Math.PI * f2 * 2 + phase2) + rough * Math.sin(t * 38 + phase3) * 0.15);
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  d += ` L${W} ${H} Z`;
  return `<path d="${d}" fill="${color}" opacity="${opacity}"/>`;
}

function jagged(r: () => number, base: number, amp: number, color: string, opacity = 1): string {
  let d = `M0 ${H} L0 ${base}`;
  let x = 0;
  while (x < W) {
    x += 40 + r() * 110;
    const peak = r() > 0.5;
    const y = base - (peak ? amp * (0.35 + r() * 0.65) : amp * r() * 0.25);
    d += ` L${Math.min(x, W).toFixed(1)} ${y.toFixed(1)}`;
  }
  d += ` L${W} ${H} Z`;
  return `<path d="${d}" fill="${color}" opacity="${opacity}"/>`;
}

function ger(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${color}"><rect x="-26" y="-18" width="52" height="18"/><path d="M-30 -18 Q0 -58 30 -18 Z"/><rect x="-3" y="-8" width="6" height="8" fill="#00000033"/></g>`;
}

function steppe(r: () => number, p: Palette): string {
  const horizon = 520 + r() * 120;
  const sunX = 280 + r() * 1040;
  const sunY = 190 + r() * 150;
  const gers = Array.from({ length: 2 + Math.floor(r() * 3) }, () => ger(180 + r() * 1240, horizon + 150 + r() * 130, 0.9 + r() * 0.8, "#F3EBDD")).join("");
  return `
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="${sunX}" cy="${sunY}" r="${60 + r() * 50}" fill="${p.sun}" opacity=".92"/>
  <circle cx="${sunX}" cy="${sunY}" r="${190 + r() * 80}" fill="${p.sun}" opacity=".12"/>
  ${ridge(r, horizon - 40, 70, 1, p.far, 0.9)}
  ${ridge(r, horizon + 40, 60, 1, p.mid, 0.95)}
  ${ridge(r, horizon + 150, 50, 0.6, p.near)}
  ${gers}`;
}

function ranges(r: () => number, p: Palette): string {
  const sunX = 200 + r() * 1200;
  return `
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="${sunX}" cy="${230 + r() * 120}" r="${70 + r() * 40}" fill="${p.sun}" opacity=".9"/>
  ${jagged(r, 560, 300, p.far, 0.8)}
  ${jagged(r, 680, 260, p.mid, 0.92)}
  ${jagged(r, 820, 200, p.near)}
  <rect y="${H - 140}" width="${W}" height="140" fill="url(#haze)"/>`;
}

function arches(r: () => number, p: Palette): string {
  const n = 3 + Math.floor(r() * 2);
  const gap = 36;
  const aw = (W - gap * (n + 1)) / n;
  let out = `<rect width="${W}" height="${H}" fill="${p.paper}"/><rect y="${H * 0.72}" width="${W}" height="${H * 0.28}" fill="${p.mid}" opacity=".9"/>`;
  for (let i = 0; i < n; i++) {
    const x = gap + i * (aw + gap);
    const top = 120 + r() * 80;
    const bottom = H * 0.72;
    const rad = aw / 2;
    out += `<path d="M${x} ${bottom} V${top + rad} A${rad} ${rad} 0 0 1 ${x + aw} ${top + rad} V${bottom} Z" fill="url(#arch${i})"/>`;
    out += `<defs><linearGradient id="arch${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${i % 2 ? p.skyTop : p.skyBottom}"/><stop offset="1" stop-color="${i % 2 ? p.sun : p.far}"/></linearGradient></defs>`;
    out += `<rect x="${x}" y="${bottom - 14}" width="${aw}" height="14" fill="${p.near}" opacity=".35"/>`;
  }
  out += `<rect y="${H * 0.72 - 4}" width="${W}" height="8" fill="${p.near}" opacity=".5"/>`;
  return out;
}

function composition(r: () => number, p: Palette): string {
  const cx = 420 + r() * 760;
  const big = 260 + r() * 120;
  return `
  <rect width="${W}" height="${H}" fill="${p.paper}"/>
  <rect x="${W * 0.08}" y="${H * 0.14}" width="${W * 0.34}" height="${H * 0.72}" fill="${p.far}" opacity=".85"/>
  <circle cx="${cx}" cy="${H * 0.46}" r="${big}" fill="${p.sun}"/>
  <path d="M${cx - big} ${H * 0.46} A${big} ${big} 0 0 0 ${cx + big} ${H * 0.46} Z" fill="${p.near}" opacity=".88"/>
  <rect x="${W * 0.66}" y="${H * 0.2}" width="${W * 0.26}" height="${H * 0.6}" fill="${p.mid}"/>
  <rect x="${W * 0.7}" y="${H * 0.2 + 70}" width="${W * 0.18}" height="14" fill="${p.paper}" opacity=".6"/>
  <rect x="${W * 0.7}" y="${H * 0.2 + 110}" width="${W * 0.12}" height="14" fill="${p.paper}" opacity=".4"/>
  <rect y="${H * 0.86}" width="${W}" height="${H * 0.14}" fill="${p.ink}" opacity=".9"/>`;
}

export function artSvg(theme: Theme, seed: string): string {
  const p = PALETTES[theme];
  const h = hashSeed(`${theme}:${seed}`);
  const r = rng(h);
  // Нэг ангилалд зураг ижил харагдахгүйн тулд найруулгыг seed-ээр сонгоно.
  const comps = theme === "hotel" || theme === "event" || theme === "sport"
    ? [steppe, ranges, arches]
    : theme === "beauty" || theme === "barber" || theme === "coffee" || theme === "dining"
      ? [arches, steppe, composition, ranges]
      : theme === "craft" || theme === "cloth" || theme === "shop" || theme === "studio" || theme === "freelance"
        ? [composition, steppe, arches, ranges]
        : [steppe, ranges, composition];
  const comp = comps[h % comps.length];
  const body = comp(r, p);
  const gid = `g${h.toString(36)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.skyTop}"/><stop offset="1" stop-color="${p.skyBottom}"/></linearGradient>
<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.near}" stop-opacity="0"/><stop offset="1" stop-color="${p.near}" stop-opacity=".55"/></linearGradient>
<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></radialGradient>
<filter id="${gid}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${h % 97}" result="n"/><feColorMatrix in="n" type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".16"/></feComponentTransfer></filter>
</defs>
${body}
<rect width="${W}" height="${H}" fill="url(#vig)"/>
<rect width="${W}" height="${H}" filter="url(#${gid})" opacity=".9"/>
</svg>`;
}

export function logoSvg(name: string, seed: string, theme: Theme): string {
  const p = PALETTES[theme];
  const h = hashSeed(`logo:${seed}`);
  const letters = name
    .split(/[\s&]+/)
    .filter((w) => /^[A-Za-zА-Яа-яӨөҮү]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || name.slice(0, 1).toUpperCase();
  const shape = h % 3;
  const bg = [p.near, p.mid, p.sun][(h >> 3) % 3];
  const fg = bg === p.sun ? "#FFF8EC" : p.paper;
  const rect =
    shape === 0
      ? `<circle cx="100" cy="100" r="100" fill="${bg}"/>`
      : shape === 1
        ? `<rect width="200" height="200" rx="44" fill="${bg}"/>`
        : `<path d="M0 200V100A100 100 0 0 1 200 100V200Z" fill="${bg}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img">${rect}<text x="100" y="${shape === 2 ? 128 : 124}" text-anchor="middle" font-family="Onest, Arial, sans-serif" font-weight="700" font-size="${letters.length > 1 ? 72 : 92}" letter-spacing="-2" fill="${fg}">${letters}</text></svg>`;
}

export function artUrl(theme: Theme | string, seed: string): string {
  return `/art/${theme}/${encodeURIComponent(seed)}.svg`;
}

export function logoUrl(seed: string, theme: Theme | string): string {
  return `/art/logo-${theme}/${encodeURIComponent(seed)}.svg`;
}
