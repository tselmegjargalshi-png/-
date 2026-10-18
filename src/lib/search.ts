export type SearchDoc = {
  name: string;
  tagline: string;
  categoryName: string;
  categoryKeywords: string[];
  locationName: string;
  address: string;
  tags: string[];
  services: string[];
};

const STOPWORDS = new Set([
  "уух", "идэх", "хийлгэх", "хийх", "хийлгэе", "авах", "хайх", "хайж", "байна", "байгаа", "газар", "газрууд",
  "бизнес", "хаана", "хаана", "надад", "ойр", "ойролцоо", "сайн", "шилдэг", "хамгийн", "дээр", "дотор", "руу", "уу", "юу",
  "цэг", "байгууллага", "захиалах", "олох", "хэрэгтэй", "хүсэж", "авмаар",
]);

/** Монгол кирилл үсгийн ө, ү, ё-г энгийн үсэгтэй нэг болгож, жижиг үсэгт шилжүүлнэ. */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/ө/g, "о")
    .replace(/ү/g, "у")
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(query: string): string[] {
  const all = normalize(query).split(" ").filter((t) => t.length >= 2);
  const filtered = all.filter((t) => !STOPWORDS.has(t));
  return filtered.length > 0 ? filtered : all;
}

function words(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean);
}

/** Үгийн эхлэлээр хайна. "кофе" нь "кофены" гэсэн үгийг олно, "кафе" нь "кафен"-ийг олно. */
function matches(hayWords: string[], token: string): boolean {
  for (const w of hayWords) {
    if (w.startsWith(token)) return true;
    if (token.length >= 4 && w.length >= 4 && token.startsWith(w)) return true;
  }
  return false;
}

export function scoreDoc(doc: SearchDoc, tokens: string[]): number {
  if (tokens.length === 0) return 1;
  const nameW = words(doc.name);
  const catW = words(doc.categoryName + " " + doc.categoryKeywords.join(" "));
  const svcW = words(doc.services.join(" "));
  const tagW = words(doc.tags.join(" "));
  const locW = words(doc.locationName + " " + doc.address);
  const textW = words(doc.tagline);
  let total = 0;
  for (const t of tokens) {
    let s = 0;
    if (matches(nameW, t)) s = Math.max(s, 12);
    if (matches(catW, t)) s = Math.max(s, 9);
    if (matches(locW, t)) s = Math.max(s, 7);
    if (matches(tagW, t)) s = Math.max(s, 6);
    if (matches(svcW, t)) s = Math.max(s, 6);
    if (matches(textW, t)) s = Math.max(s, 3);
    if (s === 0) return 0;
    total += s;
  }
  return total;
}
