import Link from "next/link";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="9" fill="var(--color-ink)" />
      <path d="M8 24V9.5L16 20l8-10.5V24" fill="none" stroke="var(--color-bg)" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="24" cy="8" r="2.4" fill="var(--color-accent)" />
    </svg>
  );
}

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5 rounded-lg" aria-label="NOMAD BUSINESS нүүр хуудас">
      <LogoMark />
      {!compact && (
        <span className="flex items-baseline gap-1.5 leading-none">
          <span className="text-[0.95rem] font-extrabold tracking-[0.14em]">NOMAD</span>
          <span className="font-mono text-[0.6rem] font-medium tracking-[0.2em] text-ink-3">BUSINESS</span>
        </span>
      )}
    </Link>
  );
}
