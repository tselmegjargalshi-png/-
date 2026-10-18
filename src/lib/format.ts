import type { DayKey } from "@/db/schema";

export const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const DAY_NAMES: Record<DayKey, string> = {
  mon: "Даваа",
  tue: "Мягмар",
  wed: "Лхагва",
  thu: "Пүрэв",
  fri: "Баасан",
  sat: "Бямба",
  sun: "Ням",
};

export const DAY_SHORT: Record<DayKey, string> = {
  mon: "Да",
  tue: "Мя",
  wed: "Лх",
  thu: "Пү",
  fri: "Ба",
  sat: "Бя",
  sun: "Ня",
};

export function groupThousands(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatMnt(n: number): string {
  return n <= 0 ? "Үнэгүй" : `${groupThousands(n)}₮`;
}

export function priceLevel(n: number): string {
  return "₮".repeat(Math.min(4, Math.max(1, n)));
}

export function formatRating(n: number): string {
  return n.toFixed(1);
}

export function formatPhone(p: string): string {
  const digits = p.replace(/[^\d+]/g, "");
  return digits ? `+976 ${p.replace(/^\+?976\s*/, "")}` : "";
}

export function telHref(p: string): string {
  return `tel:+976${p.replace(/\D/g, "").replace(/^976/, "")}`;
}

/** Улаанбаатарын цаг (UTC+8, зуны цаггүй). */
export function ubParts(date: Date): { day: DayKey; minutes: number; ymd: string; weekdayIndex: number } {
  const shifted = new Date(date.getTime() + 8 * 3600 * 1000);
  const wd = shifted.getUTCDay();
  const weekdayIndex = (wd + 6) % 7;
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return {
    day: DAY_KEYS[weekdayIndex],
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
    ymd: `${y}-${m}-${d}`,
    weekdayIndex,
  };
}

/** "YYYY-MM-DD" өдөр ба минутаас Улаанбаатарын цагаар Date үүсгэнэ. */
export function ubDate(ymd: string, minutes: number): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, minutes) - 8 * 3600 * 1000);
}

export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

export function weekdayOf(ymd: string): DayKey {
  const [y, m, d] = ymd.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return DAY_KEYS[(wd + 6) % 7];
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseHm(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

export function formatDateShort(date: Date | string): string {
  const dt = typeof date === "string" ? new Date(date) : date;
  const p = new Date(dt.getTime() + 8 * 3600 * 1000);
  return `${p.getUTCFullYear()}.${String(p.getUTCMonth() + 1).padStart(2, "0")}.${String(p.getUTCDate()).padStart(2, "0")}`;
}

export function formatDateLong(ymd: string): string {
  const [, m, d] = ymd.split("-").map(Number);
  return `${m}-р сарын ${d}, ${DAY_NAMES[weekdayOf(ymd)]}`;
}

export function formatDateTime(date: Date | string): string {
  const dt = typeof date === "string" ? new Date(date) : date;
  const { ymd, minutes } = ubParts(dt);
  return `${formatDateLong(ymd)}, ${formatMinutes(minutes)}`;
}

export function pluralReviews(n: number): string {
  return `${n} сэтгэгдэл`;
}

export function initials(name: string): string {
  const parts = name.replace(/[.]/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase();
}
