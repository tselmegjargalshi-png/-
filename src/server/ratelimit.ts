const buckets = new Map<string, number[]>();

/** Процесс дотор ажилладаг энгийн хязгаарлагч. Олон instance-д бүрэн найдвартай биш тул Redis-ээр солихыг зөвлөнө. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) buckets.clear();
  return true;
}
