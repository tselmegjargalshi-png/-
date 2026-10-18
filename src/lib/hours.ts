import type { DayKey, OpeningHours } from "@/db/schema";
import { DAY_KEYS, DAY_NAMES, formatMinutes, parseHm, ubParts } from "./format";

export type OpenState = { open: boolean; label: string; short: string };

function closeMinutes(range: [string, string]) {
  const close = parseHm(range[1]);
  return close;
}

/** Одоогийн байдлаар нээлттэй эсэх, дараагийн нээх/хаах цагийг тооцоолно. */
export function openState(hours: OpeningHours, now: Date): OpenState {
  const { day, minutes, weekdayIndex } = ubParts(now);
  const today = hours[day];
  if (today) {
    const open = parseHm(today[0]);
    const close = closeMinutes(today);
    if (minutes >= open && minutes < close) {
      const is247 = open === 0 && close >= 1440;
      return {
        open: true,
        label: is247 ? "Нээлттэй, өдөржин" : `Нээлттэй, ${formatMinutes(close % 1440)} хүртэл`,
        short: "Нээлттэй",
      };
    }
    if (minutes < open) {
      return { open: false, label: `Хаалттай, ${today[0]}-д нээнэ`, short: "Хаалттай" };
    }
  }
  for (let i = 1; i <= 7; i++) {
    const idx = (weekdayIndex + i) % 7;
    const key = DAY_KEYS[idx];
    const range = hours[key];
    if (range) {
      const when = i === 1 ? "маргааш" : DAY_NAMES[key] + " гарагт";
      return { open: false, label: `Хаалттай, ${when} ${range[0]}-д нээнэ`, short: "Хаалттай" };
    }
  }
  return { open: false, label: "Хаалттай", short: "Хаалттай" };
}

export function isOpenNow(hours: OpeningHours, now: Date): boolean {
  return openState(hours, now).open;
}

export function hoursLabel(range: [string, string] | null): string {
  if (!range) return "Амарна";
  if (range[0] === "00:00" && (range[1] === "24:00" || range[1] === "23:59")) return "Өдөржин";
  return `${range[0]} - ${range[1]}`;
}

export function dayHours(hours: OpeningHours, day: DayKey) {
  return hours[day];
}
