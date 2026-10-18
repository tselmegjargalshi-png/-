import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";
import type { Db } from "./index";
import * as s from "./schema";
import {
  CATEGORY_REVIEWS,
  GENERIC_REVIEWS,
  REVIEWER_NAMES,
  SEED_BUSINESSES,
  SEED_CATEGORIES,
  hoursFor,
} from "./seed-data";
import { PLACES, UB_DISTRICTS } from "@/lib/geo";
import { CATEGORY_THEME, artUrl, logoUrl } from "@/lib/art";
import { bookingCode } from "@/lib/ids";
import { addDays, ubParts } from "@/lib/format";

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const DAY = 24 * 3600 * 1000;

export async function seedDatabase(db: Db): Promise<boolean> {
  const [{ value: existing }] = await db.select({ value: count() }).from(s.categories);
  if (existing > 0) return false;

  const demoPassword = process.env.DEMO_PASSWORD || "nomad2026";
  const now = new Date();

  // --- Ангилал ---
  const catRows = SEED_CATEGORIES.map((c, i) => ({
    id: crypto.randomUUID(), slug: c.slug, name: c.name, icon: c.icon, description: c.description, keywords: c.keywords, sortOrder: i,
  }));
  await db.insert(s.categories).values(catRows);
  const catId = new Map(catRows.map((c) => [c.slug, c.id]));

  // --- Байршил ---
  const locRows = PLACES.map((p, i) => ({
    id: crypto.randomUUID(), slug: p.slug, name: p.name, kind: p.kind, parentId: null as string | null, lat: p.lat, lng: p.lng, sortOrder: i,
  }));
  const ubId = locRows.find((l) => l.slug === "ulaanbaatar")!.id;
  const districtRows = UB_DISTRICTS.map((d, i) => ({
    id: crypto.randomUUID(), slug: d.slug, name: d.name, kind: "DISTRICT" as const, parentId: ubId, lat: d.lat, lng: d.lng, sortOrder: 100 + i,
  }));
  await db.insert(s.locations).values([...locRows, ...districtRows]);
  const locId = new Map([...locRows, ...districtRows].map((l) => [l.slug, l.id]));

  // --- Хэрэглэгчид ---
  const demoHash = bcrypt.hashSync(demoPassword, 10);
  const userRows: Array<typeof s.users.$inferInsert> = [];
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || (process.env.DATABASE_URL ? "" : demoPassword);
  if (adminPassword) {
    userRows.push({ id: crypto.randomUUID(), email: adminEmail, name: "Систем админ", passwordHash: bcrypt.hashSync(adminPassword, 10), role: "ADMIN" });
  }
  const ownerId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  if (process.env.SEED_DEMO_ACCOUNTS !== "false") {
    userRows.push(
      { id: ownerId, email: "owner@example.com", name: "Б. Тэмүүлэн", passwordHash: demoHash, role: "OWNER", phone: "7000 0001", isDemo: true },
      { id: userId, email: "user@example.com", name: "Н. Анужин", passwordHash: demoHash, role: "USER", phone: "7000 0002", isDemo: true },
    );
  }
  if (userRows.length) await db.insert(s.users).values(userRows);
  const hasDemoAccounts = process.env.SEED_DEMO_ACCOUNTS !== "false";

  // --- Бизнесүүд ---
  const bizRows: Array<typeof s.businesses.$inferInsert> = [];
  const svcRows: Array<typeof s.services.$inferInsert> = [];
  const staffRows: Array<typeof s.staff.$inferInsert> = [];
  const imgRows: Array<typeof s.images.$inferInsert> = [];
  const revRows: Array<typeof s.reviews.$inferInsert> = [];
  const statRows: Array<typeof s.dailyStats.$inferInsert> = [];
  const ids = new Map<string, string>();

  for (const b of SEED_BUSINESSES) {
    const r = mulberry(hashStr(b.slug));
    const id = crypto.randomUUID();
    ids.set(b.slug, id);
    const theme = CATEGORY_THEME[b.cat] ?? "other";
    const place = PLACES.find((p) => p.slug === b.place)!;
    const district = b.district ? UB_DISTRICTS.find((d) => d.slug === b.district) : undefined;
    const base = b.ll ? { lat: b.ll[0], lng: b.ll[1] } : district ?? place;
    const jitter = b.ll ? 0 : district ? 1 : 0.6;
    const lat = base.lat + (r() - 0.5) * 0.012 * jitter;
    const lng = base.lng + (r() - 0.5) * 0.018 * jitter;

    // Сэтгэгдэл
    const pool = [...(CATEGORY_REVIEWS[b.cat] ?? []), ...GENERIC_REVIEWS];
    const ratings: number[] = [];
    for (let i = 0; i < b.reviews; i++) {
      const pick = pool[Math.floor(r() * pool.length)];
      const target = 3.2 + b.quality * 1.7;
      let rating = Math.round(target + (r() - 0.45) * 1.6);
      rating = Math.min(5, Math.max(3, rating));
      if (pick[0] < rating) rating = Math.max(3, Math.min(rating, pick[0] + 1));
      ratings.push(rating);
      revRows.push({
        id: crypto.randomUUID(), businessId: id, authorName: REVIEWER_NAMES[Math.floor(r() * REVIEWER_NAMES.length)],
        rating, body: pick[1], photos: r() < 0.18 ? [artUrl(theme, `${b.slug}-review-${i}`)] : [],
        createdAt: new Date(now.getTime() - Math.floor(r() * 300 + 3) * DAY),
      });
    }
    const avg = ratings.length ? ratings.reduce((a, c) => a + c, 0) / ratings.length : 0;
    const popular = b.services.find((x) => x[3]?.includes("p")) ?? b.services[0];

    bizRows.push({
      id, slug: b.slug, name: b.name, tagline: b.tagline, description: b.about, categoryId: catId.get(b.cat)!,
      locationId: locId.get(b.district ?? b.place)!, address: b.address, lat, lng, phone: b.phone, email: "",
      website: b.web ?? "", instagram: b.insta ? `@${b.insta}` : "", facebook: "", priceLevel: b.price, status: "ACTIVE",
      featured: !!b.featured, isDemo: true, logoUrl: logoUrl(b.slug, theme), coverUrl: artUrl(theme, `${b.slug}-0`),
      hours: hoursFor(b.hours), popularService: popular[0], tags: b.tags ?? [], ratingAvg: Math.round(avg * 10) / 10, reviewCount: ratings.length,
      createdAt: new Date(now.getTime() - Math.floor(r() * 200 + 20) * DAY),
    });

    b.services.forEach((sv, i) => {
      svcRows.push({
        id: crypto.randomUUID(), businessId: id, name: sv[0], priceMnt: sv[1], durationMin: sv[2] || 30,
        popular: sv[3]?.includes("p") ?? false, bookable: !(sv[3]?.includes("n") ?? false), sortOrder: i,
      });
    });
    (b.staff ?? []).forEach((st, i) => staffRows.push({ id: crypto.randomUUID(), businessId: id, name: st[0], title: st[1], sortOrder: i }));
    for (let i = 0; i < 5; i++) {
      imgRows.push({ id: crypto.randomUUID(), businessId: id, url: artUrl(theme, `${b.slug}-${i}`), alt: `${b.name}, ${i + 1}-р зураг`, sortOrder: i });
    }

    // Сүүлийн 30 хоногийн статистик
    let level = 20 + b.quality * 40 + (b.featured ? 40 : 0) + (b.cat === "kafe" ? 15 : 0);
    for (let d = 29; d >= 0; d--) {
      const day = addDays(ubParts(now).ymd, -d);
      const wd = new Date(day + "T00:00:00Z").getUTCDay();
      level = Math.max(8, level + (r() - 0.48) * 6);
      const weekend = wd === 0 || wd === 6 ? 1.25 : 1;
      const impressions = Math.round(level * 6 * weekend * (0.8 + r() * 0.4));
      const profileViews = Math.round(impressions * (0.22 + r() * 0.12));
      const contacts = Math.round(profileViews * (0.08 + r() * 0.08));
      statRows.push({ businessId: id, day, impressions, profileViews, contacts });
    }
  }

  const chunk = async <T extends object>(table: Parameters<Db["insert"]>[0], rows: T[], size = 400) => {
    for (let i = 0; i < rows.length; i += size) {
      await db.insert(table).values(rows.slice(i, i + size) as never);
    }
  };
  await chunk(s.businesses, bizRows);
  await chunk(s.services, svcRows);
  await chunk(s.staff, staffRows);
  await chunk(s.images, imgRows);
  await chunk(s.reviews, revRows);
  await chunk(s.dailyStats, statRows, 800);

  // --- Эзэмшигч, хадгалсан, захиалга (үзүүлэнгийн данс) ---
  if (hasDemoAccounts) {
    await db.insert(s.businessOwners).values([
      { userId: ownerId, businessId: ids.get("nomad-coffee")! },
    ]);
    await db.insert(s.savedBusinesses).values(
      ["nomad-coffee", "ulaan-beauty", "khuvsgul-lake-lodge", "steppe-studio"].map((slug) => ({ userId, businessId: ids.get(slug)! })),
    );

    const svcByBiz = new Map<string, Array<typeof s.services.$inferInsert>>();
    for (const sv of svcRows) {
      const list = svcByBiz.get(sv.businessId) ?? [];
      list.push(sv);
      svcByBiz.set(sv.businessId, list);
    }
    const today = ubParts(now).ymd;
    const mk = (slug: string, svcIndex: number, dayOffset: number, hour: number, status: s.BookingStatus, who: { name: string; phone: string; userId?: string }) => {
      const bid = ids.get(slug)!;
      const sv = svcByBiz.get(bid)![svcIndex];
      const [y, m, d] = addDays(today, dayOffset).split("-").map(Number);
      return {
        id: crypto.randomUUID(), code: bookingCode(), businessId: bid, serviceId: sv.id!, userId: who.userId ?? null,
        serviceName: sv.name, priceMnt: sv.priceMnt ?? 0, customerName: who.name, phone: who.phone,
        startsAt: new Date(Date.UTC(y, m - 1, d, hour - 8, 0)), durationMin: sv.durationMin ?? 30, status,
      };
    };
    const bookings = [
      mk("ulaan-beauty", 0, 3, 14, "CONFIRMED", { name: "Н. Анужин", phone: "7000 0002", userId }),
      mk("nomad-coffee", 5, 1, 11, "CONFIRMED", { name: "Н. Анужин", phone: "7000 0002", userId }),
      mk("steppe-studio", 0, -12, 15, "COMPLETED", { name: "Н. Анужин", phone: "7000 0002", userId }),
      mk("nomad-coffee", 5, 0, 16, "PENDING", { name: "Д. Номин", phone: "7000 0101" }),
      mk("nomad-coffee", 5, 2, 10, "PENDING", { name: "Г. Ганбаатар", phone: "7000 0102" }),
      mk("nomad-coffee", 6, 4, 18, "CONFIRMED", { name: "Ц. Оюунчимэг", phone: "7000 0103" }),
      mk("nomad-coffee", 5, -3, 12, "COMPLETED", { name: "С. Саруул", phone: "7000 0104" }),
      mk("nomad-coffee", 5, -5, 9, "CANCELLED", { name: "О. Энхжин", phone: "7000 0105" }),
    ];
    await db.insert(s.bookings).values(bookings);
    await db.insert(s.contactRequests).values([
      { businessId: ids.get("nomad-coffee")!, name: "Л. Хулан", phone: "7000 0106", message: "Төрсөн өдрийн үдэшлэгт 12 хүний ширээ захиалж болох уу?" },
      { businessId: ids.get("nomad-coffee")!, name: "Р. Золбоо", phone: "7000 0107", message: "Кофены үр худалдаж авах боломжтой юу?" },
    ]);
    await db.insert(s.reports).values([
      { targetType: "REVIEW", targetId: revRows[0].id!, reason: "Сэтгэгдэл бизнестэй холбоогүй санагдсан.", status: "OPEN" },
    ]);
  }
  return true;
}
