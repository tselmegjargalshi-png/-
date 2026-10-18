import {
  BedDouble, Briefcase, CalendarDays, Camera, Coffee, Dumbbell, Hand, Laptop, Scissors, Shapes, Shirt, Sparkles, Store, UtensilsCrossed,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

const MAP: Record<string, ComponentType<LucideProps>> = {
  coffee: Coffee,
  utensils: UtensilsCrossed,
  sparkles: Sparkles,
  scissors: Scissors,
  dumbbell: Dumbbell,
  shirt: Shirt,
  hand: Hand,
  store: Store,
  bed: BedDouble,
  calendar: CalendarDays,
  briefcase: Briefcase,
  laptop: Laptop,
  camera: Camera,
  shapes: Shapes,
};

export const CATEGORY_ICON_KEYS = Object.keys(MAP);

export function CategoryIcon({ name, size = 16, className, strokeWidth = 1.8 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  const C = MAP[name] ?? Shapes;
  return <C size={size} className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5A.5.5 0 0 1 14 8Z" />
    </svg>
  );
}
