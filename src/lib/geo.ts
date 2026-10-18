/** Монгол улсын хилийн хялбаршуулсан тойм (өргөрөг, уртраг). Зөвхөн дүрслэлд ашиглана. */
export const MONGOLIA_OUTLINE: ReadonlyArray<readonly [number, number]> = [
  [87.75, 49.18], [88.2, 49.45], [89.0, 49.9], [90.1, 50.25], [91.3, 50.55], [92.4, 50.78],
  [93.2, 50.6], [94.3, 50.55], [95.6, 50.0], [96.9, 49.85], [97.6, 49.95], [98.3, 50.35],
  [98.0, 51.0], [98.9, 51.65], [100.0, 51.72], [101.2, 51.52], [102.2, 51.3], [102.9, 51.55],
  [103.9, 50.7], [104.9, 50.25], [106.0, 50.35], [106.9, 50.3], [108.2, 49.95], [109.5, 49.4],
  [110.7, 49.2], [112.0, 49.55], [113.1, 49.65], [114.3, 50.2], [115.6, 49.95], [116.7, 49.8],
  [117.8, 49.5], [118.6, 49.0], [119.3, 48.1], [119.9, 47.1], [118.6, 46.75], [117.4, 46.6],
  [116.3, 45.9], [115.2, 45.4], [113.9, 44.9], [112.4, 45.05], [111.9, 43.75], [110.4, 42.8],
  [108.8, 42.4], [107.0, 42.4], [105.0, 41.6], [103.4, 42.2], [101.8, 42.5], [100.0, 42.7],
  [97.2, 42.8], [96.4, 42.7], [95.3, 44.0], [93.5, 44.9], [91.5, 45.1], [90.8, 46.0],
  [91.0, 46.8], [90.0, 47.9], [88.8, 48.1],
];

export const CENTER = { lng: 103.8, lat: 46.9 } as const;
const COS = Math.cos((47 * Math.PI) / 180);

/** Уртраг, өргөргийг дэлхийн нэгж (x, z) руу хөрвүүлнэ. 1 градус өргөрөг = 1 нэгж. */
export function project(lng: number, lat: number): [number, number] {
  return [(lng - CENTER.lng) * COS, -(lat - CENTER.lat)];
}

export function unproject(x: number, z: number): { lng: number; lat: number } {
  return { lng: x / COS + CENTER.lng, lat: -z + CENTER.lat };
}

export const BOUNDS = (() => {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [lng, lat] of MONGOLIA_OUTLINE) {
    const [x, z] = project(lng, lat);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  }
  return { minX, maxX, minZ, maxZ, width: maxX - minX, depth: maxZ - minZ };
})();

export const OUTLINE_XZ: ReadonlyArray<readonly [number, number]> = MONGOLIA_OUTLINE.map(([lng, lat]) => project(lng, lat));

export function pointInPolygon(x: number, z: number, poly: ReadonlyArray<readonly [number, number]> = OUTLINE_XZ): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** Цэгээс хил хүртэлх хамгийн богино зай (нэгжээр). */
export function distanceToBorder(x: number, z: number, poly: ReadonlyArray<readonly [number, number]> = OUTLINE_XZ): number {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, az] = poly[j];
    const [bx, bz] = poly[i];
    const dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    const px = ax + t * dx, pz = az + t * dz;
    best = Math.min(best, Math.hypot(x - px, z - pz));
  }
  return best;
}

// ----- Рельеф -----

function hash2(ix: number, iz: number): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = smooth(x - ix), fz = smooth(z - iz);
  const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

function fbm(x: number, z: number): number {
  let sum = 0, amp = 0.5, f = 1;
  for (let o = 0; o < 5; o++) {
    sum += valueNoise(x * f, z * f) * amp;
    amp *= 0.5; f *= 2.03;
  }
  return sum;
}

type Mass = { lng: number; lat: number; rx: number; rz: number; amp: number };
const MASSES: Mass[] = [
  { lng: 99.8, lat: 47.4, rx: 3.6, rz: 2.4, amp: 0.95 }, // Хангай
  { lng: 90.2, lat: 48.9, rx: 2.4, rz: 2.0, amp: 1.25 }, // Монгол Алтай
  { lng: 94.5, lat: 46.3, rx: 3.4, rz: 1.1, amp: 0.85 }, // Говийн Алтай
  { lng: 99.2, lat: 50.6, rx: 2.2, rz: 1.1, amp: 0.8 }, // Хөвсгөл
  { lng: 109.4, lat: 48.7, rx: 2.4, rz: 1.5, amp: 0.7 }, // Хэнтий
  { lng: 107.0, lat: 47.9, rx: 0.9, rz: 0.7, amp: 0.55 }, // Богд хан, Хан Хөхий
  { lng: 104.6, lat: 49.4, rx: 1.4, rz: 1.0, amp: 0.45 }, // Орхон, Сэлэнгэ
  { lng: 112.5, lat: 43.2, rx: 4.0, rz: 1.2, amp: -0.18 }, // Говь
  { lng: 115.5, lat: 47.6, rx: 3.5, rz: 2.2, amp: -0.12 }, // Дорнодын тал
];

/** Дэлхийн нэгжээр өгөгдсөн цэгийн өндөр (дүрслэлийн зорилгоор хэтрүүлсэн). */
export function terrainHeight(lng: number, lat: number): number {
  let h = 0.12;
  let mountain = 0;
  for (const m of MASSES) {
    const dx = (lng - m.lng) / m.rx;
    const dz = (lat - m.lat) / m.rz;
    const g = Math.exp(-(dx * dx + dz * dz));
    h += m.amp * g;
    if (m.amp > 0) mountain = Math.max(mountain, g);
  }
  const n = fbm(lng * 0.62, lat * 0.62);
  h += (n - 0.5) * (0.22 + 0.5 * mountain);
  return Math.max(0, h) * 0.9;
}

export function terrainHeightXZ(x: number, z: number): number {
  const { lng, lat } = unproject(x, z);
  return terrainHeight(lng, lat);
}

// ----- Байршлууд -----

export type Place = { slug: string; name: string; kind: "AIMAG" | "CITY" | "DISTRICT"; lat: number; lng: number; parent?: string; major?: boolean };

export const PLACES: Place[] = [
  { slug: "ulaanbaatar", name: "Улаанбаатар", kind: "CITY", lat: 47.9184, lng: 106.9177, major: true },
  { slug: "erdenet", name: "Эрдэнэт", kind: "CITY", lat: 49.0275, lng: 104.0447, major: true },
  { slug: "darkhan", name: "Дархан", kind: "CITY", lat: 49.4867, lng: 105.9228, major: true },
  { slug: "khovsgol", name: "Хөвсгөл", kind: "AIMAG", lat: 49.6333, lng: 100.1667, major: true },
  { slug: "umnugovi", name: "Өмнөговь", kind: "AIMAG", lat: 43.5725, lng: 104.4247, major: true },
  { slug: "dornod", name: "Дорнод", kind: "AIMAG", lat: 48.0722, lng: 114.5353, major: true },
  { slug: "khovd", name: "Ховд", kind: "AIMAG", lat: 48.0056, lng: 91.6419, major: true },
  { slug: "bayan-olgii", name: "Баян-Өлгий", kind: "AIMAG", lat: 48.9683, lng: 89.9625, major: true },
  { slug: "selenge", name: "Сэлэнгэ", kind: "AIMAG", lat: 50.2308, lng: 106.2, major: true },
  { slug: "tuv", name: "Төв", kind: "AIMAG", lat: 47.7081, lng: 106.9486, major: false },
  { slug: "arkhangai", name: "Архангай", kind: "AIMAG", lat: 47.4667, lng: 101.45, major: false },
  { slug: "uvs", name: "Увс", kind: "AIMAG", lat: 49.9811, lng: 92.0672, major: false },
  { slug: "dornogovi", name: "Дорноговь", kind: "AIMAG", lat: 44.8922, lng: 110.1203, major: false },
  { slug: "khentii", name: "Хэнтий", kind: "AIMAG", lat: 47.3092, lng: 110.6506, major: false },
  { slug: "zavkhan", name: "Завхан", kind: "AIMAG", lat: 47.7436, lng: 96.8444, major: false },
  { slug: "bayankhongor", name: "Баянхонгор", kind: "AIMAG", lat: 46.1944, lng: 100.7181, major: false },
];

export const ROADS: Array<[string, string]> = [
  ["ulaanbaatar", "darkhan"],
  ["darkhan", "erdenet"],
  ["darkhan", "selenge"],
  ["ulaanbaatar", "dornogovi"],
  ["ulaanbaatar", "khentii"],
  ["khentii", "dornod"],
  ["ulaanbaatar", "arkhangai"],
  ["arkhangai", "khovsgol"],
  ["arkhangai", "zavkhan"],
  ["zavkhan", "khovd"],
  ["khovd", "bayan-olgii"],
  ["ulaanbaatar", "umnugovi"],
];

export function placeBySlug(slug: string): Place | undefined {
  return PLACES.find((p) => p.slug === slug);
}

/** Улаанбаатар доторх дүүргүүд. */
export const UB_DISTRICTS: Array<{ slug: string; name: string; lat: number; lng: number }> = [
  { slug: "sukhbaatar-duureg", name: "Сүхбаатар дүүрэг", lat: 47.9185, lng: 106.9195 },
  { slug: "chingeltei", name: "Чингэлтэй дүүрэг", lat: 47.9344, lng: 106.9073 },
  { slug: "khan-uul", name: "Хан-Уул дүүрэг", lat: 47.8932, lng: 106.9013 },
  { slug: "bayanzurkh", name: "Баянзүрх дүүрэг", lat: 47.9171, lng: 106.9889 },
  { slug: "bayangol", name: "Баянгол дүүрэг", lat: 47.9143, lng: 106.8678 },
  { slug: "songinokhairkhan", name: "Сонгинохайрхан дүүрэг", lat: 47.9211, lng: 106.7942 },
];

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Хилийн ойролцоо өндөр аажим буурсан, газрын зурагт харагдах бодит гадаргуугийн өндөр. */
export function surfaceHeightXZ(x: number, z: number): number {
  const sd = (pointInPolygon(x, z) ? 1 : -1) * distanceToBorder(x, z);
  return terrainHeightXZ(x, z) * (0.16 + 0.84 * smoothstep(-0.3, 0.4, sd));
}

export function surfaceHeight(lng: number, lat: number): number {
  const [x, z] = project(lng, lat);
  return surfaceHeightXZ(x, z);
}
