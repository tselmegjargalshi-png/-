# NOMAD BUSINESS

Монгол улсын бизнесүүдийг олох дижитал зах зээл. Нүүр хуудас нь шууд бүтээгдэхүүн: хайлт, 8 ангилал, 3D газрын зураг, бизнесийн картууд нэг дэлгэц дээр.

> Бүх бизнес, үнэлгээ, сэтгэгдэл, зураг нь **зохиомол демо өгөгдөл**. Жинхэнэ, баталгаажсан бизнес биш. Захиалга, мессеж нь бодит бизнест хүрэхгүй. Төлбөр байхгүй.

## Технологи ба сонголтууд

| Давхарга | Сонголт |
| --- | --- |
| Фреймворк | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Загвар | Tailwind CSS 4 (`@theme` токенууд) |
| 3D газрын зураг | React Three Fiber + drei, GSAP камерын хөдөлгөөн, SVG 2D нөөц (MapLite) |
| Хөдөлгөөн | Framer Motion, `prefers-reduced-motion` дэмжинэ |
| Өгөгдлийн сан | PostgreSQL, **Drizzle ORM** |
| Нэвтрэлт | **Өөрийн JWT нэвтрэлт** (`bcryptjs` + `jose` cookie) |
| Баталгаажуулалт | Zod 4 (Монгол алдааны мессеж) |
| Файл хадгалалт | Хадгалалтын abstraction, одоогийн драйвер: DB (bytea) |

**Захиалгаас зөрсөн хэсэг (нээлттэй хэлье):** захиалсан стекийн Prisma-г Drizzle ORM-ээр, Auth.js-ийг өөрийн JWT нэвтрэлтээр сольсон. Шалтгаан: Drizzle нь serverless орчинд хөнгөн, PGlite-тай (суулгалтгүй demo горим) шууд ажилладаг. Auth.js-ийг шаардлагатай бол `src/server/auth` давхаргаар солих боломжтой.

## Маршрутууд

| Зам | Агуулга |
| --- | --- |
| `/` | Нүүр: хайлт, ангилал, газрын зураг, картууд, шүүлтүүр |
| `/biznes/[slug]` | Бизнесийн профайл (нүүр дээрх панель болж нээгдэнэ), цаг захиалах, холбогдох, сэтгэгдэл |
| `/angilal/[slug]` | Ангиллын хуудас |
| `/nevtreh`, `/burtgel` | Нэвтрэх, бүртгүүлэх |
| `/hereglegch` | Хадгалсан бизнесүүд, Миний захиалгууд, Сэтгэгдэлүүд, Профайл, Тохиргоо |
| `/biznes-burtguuleh` | Бизнесээ бүртгүүлэх |
| `/biznes` | Эзэмшигчийн самбар: мэдээлэл, захиалга, үйлчилгээ, профайл, зураг, сэтгэгдэл, аналитик |
| `/udirdlaga` | Админ: бизнес, хэрэглэгч, сэтгэгдэл, захиалга, ангилал, модерац |
| `/tukhai` | Тухай |
| `/api/health`, `/api/businesses` | Эрүүл мэнд, жагсаалт |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | SEO |

Ихэнх бизнес хуудас нь `generateMetadata`, OpenGraph, JSON-LD (`WebSite`, `LocalBusiness`) агуулна.

## Хурдан эхлүүлэх (demo горим, DB шаардлагагүй)

```bash
npm install
cp .env.example .env.local     # AUTH_SECRET-ийг ямар ч урт санамсаргүй тэмдэгт мөрөөр бөглө
npm run dev                    # http://localhost:3000
```

`DATABASE_URL` тохируулаагүй бол апп **PGlite** (суулгасан Postgres) дээр ажиллаж, өгөгдлийг автоматаар үүсгэж `.data/` дотор хадгална. Дахин асаахад demo өгөгдөл шинэчлэгдэнэ.

Демо хэрэглэгчид (нууц үг анхдагчаар `nomad2026`, `DEMO_PASSWORD`-оор солино):

| Эрх | И-мэйл |
| --- | --- |
| Админ | `admin@example.com` |
| Бизнес эзэмшигч (Nomad Coffee) | `owner@example.com` |
| Хэрэглэгч | `user@example.com` |

Production-д эдгээр акаунтыг `SEED_DEMO_ACCOUNTS=false` болгож унтрааж, `ADMIN_EMAIL` ба `ADMIN_PASSWORD`-оор жинхэнэ админ үүсгэ.

## Орчны хувьсагчид

`.env.example`-ийг үз. Нууц утгыг хэзээ ч commit хийхгүй.

| Нэр | Тайлбар |
| --- | --- |
| `DATABASE_URL` | Postgres холболт. Хоосон бол PGlite demo горим |
| `PGLITE_DIR` | PGlite хадгалах хавтас (анхдагч `.data/pglite`) |
| `DATABASE_POOL_MAX` | Холболтын дээд тоо |
| `AUTH_SECRET` | **Production-д заавал.** Байхгүй бол апп алдаа заана |
| `DEMO_PASSWORD` | Демо акаунтын нууц үг |
| `SEED_DEMO_ACCOUNTS` | Демо акаунт үүсгэх эсэх |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Эхний админ |
| `SEED_DATABASE` | `false` бол seed алгасна |
| `MODERATE_NEW_BUSINESSES` | Шинэ бизнес админ зөвшөөрөл хүлээх эсэх |
| `NEXT_PUBLIC_SITE_URL` | Sitemap, OpenGraph-ийн үндсэн хаяг |

## Өгөгдлийн сан

```bash
npm run db:generate   # schema өөрчилсний дараа migration үүсгэх
npm run db:migrate    # migration ажиллуулах
npm run db:seed       # demo өгөгдөл
npm run db:setup      # migrate + seed
```

`DATABASE_URL` байхгүй үед эдгээр скрипт юу ч хийхгүй. `vercel-build` нь `db:setup` ажиллуулаад `next build` хийнэ.

## Deploy (Vercel + Postgres)

1. Postgres үүсгэ (Supabase, Neon гэх мэт) ба холболтын мөрийг ав.
2. Репог Vercel-д холбо.
3. Environment variables: `DATABASE_URL`, `AUTH_SECRET` (урт санамсаргүй), `NEXT_PUBLIC_SITE_URL`, хэрэв хүсвэл `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SEED_DEMO_ACCOUNTS`.
4. Build command: `npm run vercel-build`. Эхний deploy-д migration болон seed ажиллана.
5. Deploy-ийн дараа `/api/health`-ийг шалга.

`DATABASE_URL`-гүйгээр Vercel дээр PGlite ажиллах боловч serverless орчинд хадгалалт түр зуурынх: cold start бүрд өгөгдөл дахин үүсч, оруулсан сэтгэгдэл, захиалга, зураг алга болно. Үүнийг зөвхөн урьдчилсан үзүүлэнд ашигла.

## Баталгаажуулалт: юу хийгдсэн, юу хийгдээгүй

Хийгдсэн (энэ орчинд ажиллуулсан):

- `tsc --noEmit`, `eslint`, `next build` алдаагүй.
- Production сервер (`next start`) дээр Playwright-аар 40 урсгалын шалгалт: хайлт, шүүлтүүр, ангилал, газрын зураг дээр сонгох, профайл нээх/хаах, захиалга (амжилттай мессеж), холбогдох, сэтгэгдэл, нэвтрэх/бүртгүүлэх, хадгалах, эзэмшигч, админ, 404.
- Гар утасны (390px) болон desktop дэлгэцийн зураг нягтлав.

Хийгдээгүй / хязгаарлалт:

- 3D газрын зургийг зөвхөн программ хангамжийн рендер (SwiftShader) дээр шалгасан. Бодит GPU, бодит гар утсан дээрх гүйцэтгэл (FPS) шалгагдаагүй.
- Олон хөтөч (Safari, Firefox) болон жинхэнэ төхөөрөмж дээр туршаагүй.
- Автомат нэгж тест бага; шалгалтын ихэнх нь гар аргаар бичсэн скрипт.
- Газрын зураг нь дүрслэлийн зорилготой стилжүүлсэн зураглал, нарийн навигацид тохирохгүй.
- Захиалга, мессеж нь үнэн хэрэгтээ бизнест илгээгдэхгүй. И-мэйл, SMS, төлбөр холбоогүй.
- Rate limit санах ойд хадгалагдана (олон instance-д хуваагдахгүй). Production-д Redis зэрэгт шилжүүл.
- Файл хадгалалт DB-д (bytea). Их хэмжээнд S3 төрлийн драйвер нэмэх нь зүйтэй.

## Архитектур

```
src/app/(shell)   нүүр + профайл (тогтмол газрын зураг/панель shell)
src/app/(site)    толгой/хөл бүхий хуудаснууд
src/components    shell, map, business, account, owner, admin, ui
src/server        actions, queries, auth, db (Drizzle schema)
src/lib           geo, hours (UTC+8), search (ө→о, ү→у), format, labels
drizzle/          migration
scripts/db.ts     migrate, seed
```

Гол шийдвэрүүд: газрын зурагны marker/preview-г 3D цэгийг дэлгэц рүү проекцлох DOM давхаргаар зурна (drei `Html` биш). WebGL байхгүй, сул төхөөрөмж эсвэл алдаа гарвал SVG MapLite-д автоматаар шилжинэ.

## Хөгжүүлэлт

```bash
npm run typecheck
npm run lint
npm run build && npm start
```
