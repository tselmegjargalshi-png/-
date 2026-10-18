type Point = { day: string; impressions: number; profileViews: number; contacts: number };

/** Сүүлийн 30 хоногийн үзүүлэлтийн энгийн шугаман график. Серверт зурагдана. */
export function TrendChart({ data }: { data: Point[] }) {
  const W = 720, H = 220, P = { l: 36, r: 8, t: 10, b: 26 };
  const max = Math.max(5, ...data.flatMap((d) => [d.impressions, d.profileViews]));
  const x = (i: number) => P.l + (i / Math.max(1, data.length - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  const line = (key: "impressions" | "profileViews" | "contacts") => data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(" ");
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t));
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Сүүлийн 30 хоногийн харагдсан, профайл үзсэн, холбогдсон тоо">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeDasharray="3 4" />
            <text x={P.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-ink-3)" fontFamily="var(--font-mono)">{t}</text>
          </g>
        ))}
        <path d={line("impressions")} fill="none" stroke="var(--color-stone)" strokeWidth="2" strokeLinejoin="round" />
        <path d={line("profileViews")} fill="none" stroke="var(--color-accent)" strokeWidth="2.4" strokeLinejoin="round" />
        <path d={line("contacts")} fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinejoin="round" strokeDasharray="1 0" />
        {data.length > 0 && [0, Math.floor(data.length / 2), data.length - 1].map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} fontSize="11" fill="var(--color-ink-3)" fontFamily="var(--font-mono)">{data[i].day.slice(5)}</text>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-4 text-xs text-ink-2">
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-5 bg-stone" /> Харагдсан</span>
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-5 bg-accent" /> Профайл үзсэн</span>
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-5 bg-ink" /> Холбогдсон</span>
      </figcaption>
    </figure>
  );
}

export function Bars({ rows }: { rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="grid gap-2">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 text-ink-2">{r.label}</span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2"><span className="block h-full rounded-full bg-accent" style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="w-10 shrink-0 text-right font-mono text-ink-3">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}
