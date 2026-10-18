const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function bookingCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let out = "NB-";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
  о: "o", ө: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ү: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sh",
  ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya",
};

/** Нэрийг URL-д тохирсон латин тэмдэгтэд хөрвүүлнэ. */
export function slugify(input: string): string {
  const latin = input
    .toLowerCase()
    .split("")
    .map((c) => CYR[c] ?? c)
    .join("");
  return latin
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
