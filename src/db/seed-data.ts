import type { DayKey, OpeningHours } from "./schema";

/* Бүх бизнес, хэрэглэгч, сэтгэгдэл нь зохиомол үзүүлэнгийн мэдээлэл болно. */

export type SeedCategory = {
  slug: string;
  name: string;
  icon: string;
  description: string;
  keywords: string[];
};

export const SEED_CATEGORIES: SeedCategory[] = [
  { slug: "kafe", name: "Кафе", icon: "coffee", description: "Кофе, цай, нарийн боов, амттан", keywords: ["кафе", "кофе", "кофи", "цай", "амттан", "бялуу", "боов", "эспрессо", "латте", "cafe", "coffee", "tea"] },
  { slug: "restoran", name: "Ресторан", icon: "utensils", description: "Монгол болон олон улсын хоолны газрууд", keywords: ["ресторан", "хоол", "хоолны газар", "үдийн хоол", "оройн хоол", "бууз", "шарсан", "пицца", "restaurant", "food"] },
  { slug: "goo-saikhan", name: "Гоо сайхан", icon: "sparkles", description: "Салон, арьс арчилгаа, хумс, нүүр будалт", keywords: ["гоо сайхан", "салон", "нүүр", "будалт", "арьс", "маникюр", "педикюр", "хумс", "үс", "массаж", "beauty", "nails", "spa"] },
  { slug: "uschin", name: "Үсчин", icon: "scissors", description: "Эрэгтэй үс, сахал засалт", keywords: ["үсчин", "үс", "үс засах", "сахал", "засалт", "барбер", "barber", "haircut"] },
  { slug: "sport", name: "Спорт", icon: "dumbbell", description: "Фитнес, йога, пилатес, бүлгийн дасгал", keywords: ["спорт", "фитнес", "дасгал", "дасгалжуулагч", "йога", "пилатес", "гим", "бие", "gym", "fitness", "yoga"] },
  { slug: "khuvtsas", name: "Хувцас", icon: "shirt", description: "Хувцас, гутал, ноолууран бүтээгдэхүүн", keywords: ["хувцас", "цамц", "өмд", "гутал", "ноолуур", "ноолууран", "дээл", "загвар", "fashion", "clothes"] },
  { slug: "gar-urlal", name: "Гар урлал", icon: "hand", description: "Гар хийцийн бүтээгдэхүүн, бэлэг дурсгал", keywords: ["гар урлал", "гар хийцийн", "бэлэг", "дурсгал", "эсгий", "арьс", "модон", "handmade", "gift"] },
  { slug: "delguur", name: "Дэлгүүр", icon: "store", description: "Орон нутгийн жижиг дэлгүүрүүд", keywords: ["дэлгүүр", "бараа", "бүтээгдэхүүн", "бэлэг", "гэр ахуй", "shop", "store"] },
  { slug: "zochid-buudal", name: "Зочид буудал", icon: "bed", description: "Зочид буудал, гэр бааз, амралтын газар", keywords: ["зочид буудал", "буудал", "өрөө", "хонох", "гэр бааз", "амралт", "жуулчны бааз", "hotel", "lodge", "camp"] },
  { slug: "arga-khemjee", name: "Арга хэмжээ", icon: "calendar", description: "Үзэсгэлэн, концерт, наадам, уулзалт", keywords: ["арга хэмжээ", "үзэсгэлэн", "концерт", "наадам", "фестиваль", "цуглаан", "тасалбар", "event", "festival"] },
  { slug: "uilchilgee", name: "Үйлчилгээ", icon: "briefcase", description: "Нягтлан бодох, хэвлэл, зөвлөх, аяллын үйлчилгээ", keywords: ["үйлчилгээ", "нягтлан", "татвар", "хууль", "хэвлэл", "хэвлэх", "зөвлөх", "хөтөч", "аялал", "service"] },
  { slug: "frilanser", name: "Фрилансер", icon: "laptop", description: "Бие даасан мэргэжилтнүүд", keywords: ["фрилансер", "бие даасан", "вэбсайт", "вэб", "сайт", "лого", "дизайн", "орчуулга", "орчуулагч", "зураг авах", "freelance", "web", "logo"] },
  { slug: "buteelch-studi", name: "Бүтээлч студи", icon: "camera", description: "Дизайн, зураг авалт, брэнд, сурталчилгаа", keywords: ["студи", "бүтээлч", "брэнд", "лого", "дизайн", "зураг авалт", "видео", "сурталчилгаа", "studio", "branding"] },
  { slug: "busad", name: "Бусад", icon: "shapes", description: "Бусад орон нутгийн бизнесүүд", keywords: ["бусад", "машин", "угаалга", "амьтан", "тэжээвэр", "засвар"] },
];

export type HoursPreset = "cafe" | "cafe6" | "dining" | "salon" | "barber" | "gym" | "shop" | "office" | "hotel" | "studio" | "freelance" | "weekend" | "workshop";

const DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function hoursFor(preset: HoursPreset): OpeningHours {
  const make = (f: (d: DayKey) => [string, string] | null) =>
    Object.fromEntries(DAYS.map((d) => [d, f(d)])) as OpeningHours;
  switch (preset) {
    case "cafe": return make(() => ["08:00", "22:00"]);
    case "cafe6": return make((d) => (d === "sun" ? ["09:00", "20:00"] : ["07:30", "21:00"]));
    case "dining": return make((d) => (d === "fri" || d === "sat" ? ["11:00", "23:59"] : ["11:00", "22:00"]));
    case "salon": return make((d) => (d === "sun" ? null : ["10:00", "20:00"]));
    case "barber": return make(() => ["10:00", "21:00"]);
    case "gym": return make((d) => (d === "sun" ? ["08:00", "20:00"] : ["06:00", "23:00"]));
    case "shop": return make((d) => (d === "sun" ? ["11:00", "18:00"] : ["10:00", "20:00"]));
    case "office": return make((d) => (d === "sat" || d === "sun" ? null : ["09:00", "18:00"]));
    case "hotel": return make(() => ["00:00", "24:00"]);
    case "studio": return make((d) => (d === "sun" ? null : d === "sat" ? ["11:00", "16:00"] : ["10:00", "19:00"]));
    case "freelance": return make((d) => (d === "sat" || d === "sun" ? null : ["10:00", "18:00"]));
    case "weekend": return make((d) => (d === "fri" || d === "sat" || d === "sun" ? ["12:00", "22:00"] : null));
    case "workshop": return make((d) => (d === "sun" ? null : ["10:00", "19:00"]));
  }
}

/** [нэр, үнэ (₮), үргэлжлэх хугацаа (мин), тэмдэглэгээ: "n" = захиалах боломжгүй, "p" = эрэлттэй] */
export type SeedService = [name: string, price: number, minutes: number, flags?: string];

export type SeedBusiness = {
  slug: string;
  name: string;
  cat: string;
  place: string;
  district?: string;
  ll?: [lat: number, lng: number];
  tagline: string;
  about: string;
  price: 1 | 2 | 3 | 4;
  featured?: boolean;
  hours: HoursPreset;
  phone: string;
  insta?: string;
  web?: string;
  address: string;
  tags?: string[];
  quality: number;
  reviews: number;
  services: SeedService[];
  staff?: Array<[name: string, title: string]>;
};

export const SEED_BUSINESSES: SeedBusiness[] = [
  // ---------- Улаанбаатар ----------
  {
    slug: "nomad-coffee", name: "Nomad Coffee", cat: "kafe", place: "ulaanbaatar", district: "sukhbaatar-duureg",
    tagline: "Орон нутгийн шарсан кофе, нам гүм өглөө",
    about: "Сүхбаатарын талбайн ойролцоох жижиг кофены газар. Шинэхэн шарсан кофены үр, гар хийцийн амттан, ажиллаж суухад тохиромжтой нам гүм орчинтой. Цонхны дэргэдэх ширээг урьдчилан захиалж болно.",
    price: 2, featured: true, hours: "cafe", phone: "7000 1001", insta: "nomadcoffee.mn", web: "nomad-coffee.example",
    address: "Сүхбаатар дүүрэг, 1-р хороо, Энхтайвны өргөн чөлөө", tags: ["кофе", "ажиллах орчин", "wifi"], quality: 0.92, reviews: 9,
    services: [["Эспрессо", 7500, 10, "n"], ["Латте", 11000, 10, "np"], ["Шүүгдсэн кофе (V60)", 13000, 15, "n"], ["Өглөөний иж бүрдэл", 18000, 20, "n"], ["Гар хийцийн чизкейк", 9500, 10, "n"], ["Ширээ захиалах (2-4 хүн)", 0, 90], ["Кофе амталгаа (6 хүн хүртэл)", 25000, 60]],
    staff: [["Б. Тэмүүлэн", "Ахлах бариста"], ["Н. Анужин", "Бариста"]],
  },
  {
    slug: "steppe-studio", name: "Steppe Studio", cat: "buteelch-studi", place: "ulaanbaatar", district: "chingeltei",
    tagline: "Брэнд, зураг авалт, вэбсайт нэг дор",
    about: "Бага, дунд бизнесүүдэд зориулж лого, брэндийн удирдамж, зураг авалт, вэбсайт бүтээдэг студи. Төсөл бүрийг эхнээс нь дуустал нэг баг хариуцна.",
    price: 3, featured: true, hours: "studio", phone: "7000 1002", insta: "steppe.studio", web: "steppe-studio.example",
    address: "Чингэлтэй дүүрэг, 4-р хороо, Жигжиджавын гудамж", tags: ["лого", "брэнд", "вэбсайт", "зураг авалт"], quality: 0.9, reviews: 7,
    services: [["Танилцах уулзалт (үнэгүй)", 0, 45, "p"], ["Лого хийлгэх", 900000, 60], ["Брэндийн иж бүрдэл", 2400000, 60], ["Бүтээгдэхүүний зураг авалт", 450000, 120], ["Вэбсайт хийлгэх", 3500000, 60]],
    staff: [["Д. Саруул", "Арт директор"], ["Ц. Билгүүн", "Вэб хөгжүүлэгч"]],
  },
  {
    slug: "ulaan-beauty", name: "Ulaan Beauty", cat: "goo-saikhan", place: "ulaanbaatar", district: "khan-uul",
    tagline: "Арьс арчилгаа, үс, хумсны иж бүрэн салон",
    about: "Мэргэжлийн мастерууд ажилладаг, тайван орчинтой салон. Үйлчлүүлэгч бүрт тохирсон арчилгааг урьдчилан зөвлөж, цагийн дагуу хүлээн авна.",
    price: 3, featured: true, hours: "salon", phone: "7000 1003", insta: "ulaanbeauty",
    address: "Хан-Уул дүүрэг, 15-р хороо, Зайсан", tags: ["салон", "арьс арчилгаа", "хумс"], quality: 0.88, reviews: 8,
    services: [["Нүүр цэвэрлэгээ", 65000, 60, "p"], ["Үс засалт (эмэгтэй)", 45000, 60], ["Маникюр", 35000, 60], ["Педикюр", 45000, 75], ["Үс будалт", 180000, 150]],
    staff: [["Н. Сарангэрэл", "Арьс арчилгааны мастер"], ["Б. Одгэрэл", "Стилист"], ["Д. Мөнхцэцэг", "Хумсны мастер"]],
  },
  {
    slug: "blue-sky-fitness", name: "Blue Sky Fitness", cat: "sport", place: "ulaanbaatar", district: "bayangol",
    tagline: "Өглөөнөөс шөнө хүртэл нээлттэй спорт заал",
    about: "Орчин үеийн тоноглол, бүлгийн дасгал, хувийн дасгалжуулагчтай фитнес клуб. Анх удаа ирсэн хүн танилцах дасгалд үнэгүй хамрагдана.",
    price: 2, featured: true, hours: "gym", phone: "7000 1004", insta: "bluesky.fit", web: "bluesky-fitness.example",
    address: "Баянгол дүүрэг, 3-р хороо, Үйлдвэрчний гудамж", tags: ["фитнес", "дасгалжуулагч", "бүлгийн дасгал"], quality: 0.85, reviews: 8,
    services: [["Танилцах дасгал (үнэгүй)", 0, 45, "p"], ["Нэг удаагийн тасалбар", 15000, 0, "n"], ["Сарын гишүүнчлэл", 120000, 0, "n"], ["Хувийн дасгалжуулагч (1 цаг)", 50000, 60], ["Бүлгийн йога", 20000, 60]],
    staff: [["Г. Энхбат", "Дасгалжуулагч"], ["Э. Золзаяа", "Йогийн багш"]],
  },
  {
    slug: "khuree-handmade", name: "Khuree Handmade", cat: "gar-urlal", place: "ulaanbaatar", district: "sukhbaatar-duureg",
    tagline: "Эсгий, арьс, модон гар хийцийн бэлэг",
    about: "Монгол уламжлалт материалыг орчин үеийн загвартай хослуулсан гар урлалын дэлгүүр. Бэлгийн иж бүрдлийг захиалгаар бэлтгэж, хоёр цагийн хичээлээр өөрөө хийж үзэх боломжтой.",
    price: 2, featured: true, hours: "shop", phone: "7000 1005", insta: "khuree.handmade",
    address: "Сүхбаатар дүүрэг, 8-р хороо, Бага тойруу", tags: ["бэлэг", "эсгий", "дурсгал", "гар урлал"], quality: 0.94, reviews: 9,
    services: [["Бэлгийн хайрцаг (захиалгат)", 120000, 30, "p"], ["Эсгий тоглоом", 25000, 0, "n"], ["Арьсан түрийвч", 85000, 0, "n"], ["Модон сав суулга", 45000, 0, "n"], ["Гар урлалын хичээл (2 цаг)", 60000, 120]],
  },
  {
    slug: "tuul-bakery", name: "Tuul Bakery", cat: "kafe", place: "ulaanbaatar", district: "bayanzurkh",
    tagline: "Өглөө бүр шинэхэн талх, боов",
    about: "Гэр бүлийн жижиг талх, нарийн боовны газар. Өглөө бүр шинээр жигнэсэн талх, кроассан, гэрийн бялуу бэлэн байна.",
    price: 1, hours: "cafe6", phone: "7000 1006", insta: "tuulbakery",
    address: "Баянзүрх дүүрэг, 6-р хороо, Наадамчдын зам", tags: ["талх", "боов", "бялуу"], quality: 0.8, reviews: 6,
    services: [["Кроассан", 5500, 5, "n"], ["Исгэлэн талх", 8000, 5, "n"], ["Гэрийн бялуу (хэсэг)", 8500, 5, "n"], ["Төрсөн өдрийн бялуу (захиалгаар)", 95000, 20, "p"], ["Ширээ захиалах", 0, 60]],
  },
  {
    slug: "gobi-cashmere-house", name: "Gobi Cashmere House", cat: "khuvtsas", place: "ulaanbaatar", district: "sukhbaatar-duureg",
    tagline: "Говийн ноолуур, цэвэр мэдрэмж",
    about: "Говийн ноолуураар оёсон цамц, ороолт, нөмрөг зардаг дэлгүүр. Хэмжээ тохируулах болон захиалгаар оёх үйлчилгээтэй.",
    price: 4, hours: "shop", phone: "7000 1007", insta: "gobicashmerehouse", web: "gobi-cashmere.example",
    address: "Сүхбаатар дүүрэг, 1-р хороо, Сөүлийн гудамж", tags: ["ноолуур", "цамц", "ороолт", "захиалгаар оёх"], quality: 0.9, reviews: 6,
    services: [["Ноолууран ороолт", 180000, 0, "n"], ["Ноолууран цамц", 320000, 0, "n"], ["Нөмрөг", 650000, 0, "n"], ["Хэмжээ авах уулзалт", 0, 45, "p"], ["Хэмжээ тохируулах", 30000, 30]],
  },
  {
    slug: "black-horse-barber", name: "Black Horse Barber", cat: "uschin", place: "ulaanbaatar", district: "bayanzurkh",
    tagline: "Эрэгтэй үс, сахлын цэвэр засалт",
    about: "Уламжлалт сахал засалт, орчин үеийн эрэгтэй үсний загварыг хослуулсан үсчин. Цагаа урьдчилан захиалбал хүлээлгүй үйлчлүүлнэ.",
    price: 2, hours: "barber", phone: "7000 1008", insta: "blackhorse.barber",
    address: "Баянзүрх дүүрэг, 1-р хороо, Хөшигийн хөндий", tags: ["үсчин", "сахал", "эрэгтэй"], quality: 0.86, reviews: 7,
    services: [["Эрэгтэй үс засалт", 25000, 45, "p"], ["Сахал засалт", 15000, 30], ["Үс, сахал иж бүрэн", 35000, 60], ["Хүүхдийн үс", 15000, 30], ["Халуун алчуураар сахал хусах", 30000, 40]],
    staff: [["Т. Бат-Эрдэнэ", "Ахлах үсчин"], ["М. Лхагвасүрэн", "Үсчин"]],
  },
  {
    slug: "square-bistro", name: "Square Bistro", cat: "restoran", place: "ulaanbaatar", district: "sukhbaatar-duureg",
    tagline: "Хотын төвд үдийн болон оройн хоол",
    about: "Улирлын орц, орон нутгийн махаар бэлтгэсэн европ болон монгол хоолны цэстэй. Үдийн цэс өдөр бүр шинэчлэгдэнэ.",
    price: 3, hours: "dining", phone: "7000 1009", insta: "squarebistro", web: "square-bistro.example",
    address: "Сүхбаатар дүүрэг, 1-р хороо, Чингисийн өргөн чөлөө", tags: ["үдийн хоол", "оройн хоол", "европ хоол"], quality: 0.84, reviews: 7,
    services: [["Үдийн цэс", 22000, 0, "n"], ["Шарсан хонины мах", 38000, 0, "np"], ["Хонины шөл", 14000, 0, "n"], ["Ширээ захиалах (2 хүн)", 0, 90], ["Ширээ захиалах (6 хүн)", 0, 120]],
  },
  {
    slug: "buuz-lab", name: "Buuz Lab", cat: "restoran", place: "ulaanbaatar", district: "bayangol",
    tagline: "Буузны шинэ хувилбарууд",
    about: "Уламжлалт бууз, хуушуурын зэрэгцээ шинэ амтыг турших боломжтой жижиг ресторан. Гэр бүл, найз нөхдийн цуглаанд тохиромжтой.",
    price: 1, hours: "dining", phone: "7000 1010", insta: "buuzlab",
    address: "Баянгол дүүрэг, 2-р хороо, Нарны зам", tags: ["бууз", "хуушуур", "цуйван"], quality: 0.82, reviews: 7,
    services: [["Бууз (10 ширхэг)", 18000, 0, "np"], ["Хуушуур (4 ширхэг)", 12000, 0, "n"], ["Цуйван", 14000, 0, "n"], ["Ногоон бууз (8 ширхэг)", 16000, 0, "n"], ["Ширээ захиалах (4 хүн)", 0, 90]],
  },
  {
    slug: "tengri-yoga", name: "Tengri Yoga", cat: "sport", place: "ulaanbaatar", district: "chingeltei",
    tagline: "Йога, пилатес, амьсгалын дасгал",
    about: "Жижиг бүлгээр хичээллэдэг нам гүм студи. Эхлэгч болон ахисан түвшний хичээлүүд өдөр бүр явагдана.",
    price: 2, hours: "gym", phone: "7000 1011", insta: "tengri.yoga",
    address: "Чингэлтэй дүүрэг, 1-р хороо, Сэлбэ", tags: ["йога", "пилатес", "амьсгал"], quality: 0.91, reviews: 6,
    services: [["Эхлэгчдийн йога", 25000, 60, "p"], ["Пилатес", 30000, 60], ["Сарын гишүүнчлэл", 150000, 0, "n"], ["Хувийн хичээл", 60000, 60]],
    staff: [["Л. Ариунаа", "Йогийн багш"], ["О. Хулан", "Пилатесын багш"]],
  },
  {
    slug: "summer-design-fair", name: "Summer Design Fair", cat: "arga-khemjee", place: "ulaanbaatar", district: "chingeltei",
    ll: [47.9262, 106.9141],
    tagline: "Жилд хоёр удаа болдог дизайны үзэсгэлэн",
    about: "Орон нутгийн дизайнер, гар урчуудыг нэг дор цуглуулдаг үзэсгэлэн худалдаа. Тасалбараа урьдчилан авбал хаалган дээр дараалахгүй.",
    price: 1, featured: true, hours: "weekend", phone: "7000 1012", insta: "summerdesignfair",
    address: "Чингэлтэй дүүрэг, Залуучуудын өргөн чөлөө", tags: ["үзэсгэлэн", "дизайн", "тасалбар"], quality: 0.89, reviews: 6,
    services: [["Нэг өдрийн тасалбар", 10000, 120, "p"], ["Хоёр өдрийн тасалбар", 16000, 120], ["Гэр бүлийн тасалбар (4 хүн)", 30000, 120]],
  },
  {
    slug: "khuree-live-sessions", name: "Khuree Live Sessions", cat: "arga-khemjee", place: "ulaanbaatar", district: "sukhbaatar-duureg",
    tagline: "Жижиг танхимд амьд хөгжим",
    about: "Сар бүрийн сүүлийн ням гарагт зохиогддог цөөн хүний тоглолт. Танхимд 80 хүн багтдаг тул уран бүтээлчийг ойроос сонсоно.",
    price: 2, hours: "weekend", phone: "7000 1013", insta: "khuree.live",
    address: "Сүхбаатар дүүрэг, 3-р хороо, Мөнх тэнгэрийн гудамж", tags: ["концерт", "хөгжим", "тасалбар"], quality: 0.87, reviews: 5,
    services: [["Ердийн тасалбар", 35000, 150, "p"], ["Урд эгнээний тасалбар", 55000, 150], ["Хос тасалбар", 65000, 150]],
  },
  {
    slug: "blue-wolf-hotel", name: "Blue Wolf Hotel", cat: "zochid-buudal", place: "ulaanbaatar", district: "sukhbaatar-duureg",
    tagline: "Хотын төвд тав тухтай өрөө",
    about: "Төвийн байршилтай жижиг зочид буудал. Өрөө бүрийн үнэд өглөөний цай багтсан бөгөөд нисэх буудлаас угтах үйлчилгээтэй.",
    price: 3, hours: "hotel", phone: "7000 1014", insta: "bluewolf.hotel", web: "bluewolf-hotel.example",
    address: "Сүхбаатар дүүрэг, 2-р хороо, Бага тойруу", tags: ["зочид буудал", "өрөө", "төв"], quality: 0.83, reviews: 7,
    services: [["Нэг ортой өрөө", 120000, 60, "p"], ["Хоёр ортой өрөө", 160000, 60], ["Люкс өрөө", 260000, 60], ["Нисэх буудлаас угтах", 60000, 60]],
  },
  {
    slug: "mandal-accounting", name: "Mandal Accounting", cat: "uilchilgee", place: "ulaanbaatar", district: "bayangol",
    tagline: "Нягтлан бодох бүртгэл, татварын зөвлөгөө",
    about: "Жижиг бизнес, хувиараа хөдөлмөр эрхлэгчдэд зориулсан нягтлан бодох бүртгэл, татварын тайлангийн үйлчилгээ. Анхны зөвлөгөө үнэгүй.",
    price: 2, hours: "office", phone: "7000 1015", web: "mandal-accounting.example",
    address: "Баянгол дүүрэг, 10-р хороо, Олимпийн гудамж", tags: ["нягтлан", "татвар", "тайлан"], quality: 0.88, reviews: 5,
    services: [["Анхны зөвлөгөө (үнэгүй)", 0, 30, "p"], ["Сарын бүртгэл", 250000, 0, "n"], ["Жилийн тайлан", 450000, 0, "n"], ["Татварын зөвлөгөө (1 цаг)", 80000, 60]],
    staff: [["Ж. Оюунчимэг", "Ахлах нягтлан"]],
  },
  {
    slug: "zuun-zam-print", name: "Zuun Zam Print", cat: "uilchilgee", place: "ulaanbaatar", district: "songinokhairkhan",
    tagline: "Хурдан хэвлэл, нэрийн хуудас, баннер",
    about: "Нэрийн хуудас, товхимол, баннер, цаасан сав зэргийг богино хугацаанд хэвлэнэ. Дизайны файлаа авчирбал хэвлэхээс өмнө шалгаж өгнө.",
    price: 1, hours: "workshop", phone: "7000 1016",
    address: "Сонгинохайрхан дүүрэг, 20-р хороо", tags: ["хэвлэл", "баннер", "нэрийн хуудас"], quality: 0.78, reviews: 5,
    services: [["Нэрийн хуудас (100 ширхэг)", 30000, 0, "n"], ["Баннер (м²)", 25000, 0, "n"], ["Товхимол (50 ширхэг)", 120000, 0, "n"], ["Захиалга өгөх уулзалт", 0, 20, "p"]],
  },
  {
    slug: "felt-and-fiber", name: "Felt & Fiber", cat: "delguur", place: "ulaanbaatar", district: "khan-uul",
    tagline: "Гар хийцийн гэр ахуйн бүтээгдэхүүн",
    about: "Эсгий, ноос, модоор хийсэн гэр ахуйн бараа цуглуулсан дэлгүүр. Бүтээгдэхүүн бүрийн цаана ажилласан урчийн нэр бичигдсэн байдаг.",
    price: 2, hours: "shop", phone: "7000 1017", insta: "feltandfiber",
    address: "Хан-Уул дүүрэг, 4-р хороо, Зайсан", tags: ["эсгий", "гэр ахуй", "ноос"], quality: 0.8, reviews: 5,
    services: [["Эсгий гутал", 65000, 0, "n"], ["Ноосон хөнжил", 140000, 0, "n"], ["Гэрийн чимэглэл", 35000, 0, "n"], ["Хувийн үзлэг, зөвлөгөө", 0, 30, "p"]],
  },
  {
    slug: "saruul-design", name: "Saruul Design", cat: "frilanser", place: "ulaanbaatar", district: "bayanzurkh",
    tagline: "Лого, нэрийн хуудас, хэвлэлийн дизайн",
    about: "Найман жил бие даан ажилласан график дизайнер. Жижиг бизнесүүдэд ойлгомжтой, урт хугацаанд хэрэглэгдэх лого болон хэвлэлийн материал бүтээнэ.",
    price: 2, hours: "freelance", phone: "7000 1018", insta: "saruul.design", web: "saruul-design.example",
    address: "Баянзүрх дүүрэг, 13-р хороо (зайнаас ажиллана)", tags: ["лого", "дизайн", "нэрийн хуудас"], quality: 0.9, reviews: 6,
    services: [["Зөвлөгөө (30 мин, үнэгүй)", 0, 30, "p"], ["Лого хийлгэх", 350000, 45], ["Нэрийн хуудасны дизайн", 80000, 30], ["Брэндбүүк", 900000, 45]],
  },
  {
    slug: "naran-web", name: "Naran Web", cat: "frilanser", place: "ulaanbaatar", district: "khan-uul",
    tagline: "Вэбсайт, онлайн дэлгүүр хөгжүүлэлт",
    about: "Вэбсайт болон онлайн дэлгүүрийг төлөвлөхөөс эхлээд ажиллуулах хүртэл нь дангаараа хийдэг хөгжүүлэгч. Хийсэн сайтаа сар бүр хянаж, шинэчилнэ.",
    price: 3, hours: "freelance", phone: "7000 1019", web: "naran-web.example",
    address: "Хан-Уул дүүрэг, 11-р хороо (зайнаас ажиллана)", tags: ["вэбсайт", "онлайн дэлгүүр", "хөгжүүлэлт"], quality: 0.88, reviews: 5,
    services: [["Зөвлөгөө (30 мин, үнэгүй)", 0, 30, "p"], ["Вэбсайт хийлгэх", 2200000, 45], ["Онлайн дэлгүүр", 3800000, 45], ["Сайтын арчилгаа (сар)", 150000, 0, "n"]],
  },
  {
    slug: "temuulen-visual", name: "Temuulen Visual", cat: "frilanser", place: "ulaanbaatar", district: "sukhbaatar-duureg",
    tagline: "Хөрөг, бүтээгдэхүүн, видео зураг авалт",
    about: "Хөрөг, бүтээгдэхүүн, арга хэмжээний зураг авалт болон видео монтаж хийдэг гэрэл зурагчин. Зургийг хоёр хоногийн дотор засварлан хүлээлгэж өгнө.",
    price: 2, hours: "freelance", phone: "7000 1020", insta: "temuulen.visual",
    address: "Сүхбаатар дүүрэг, 9-р хороо", tags: ["зураг авалт", "видео", "хөрөг"], quality: 0.87, reviews: 6,
    services: [["Хөрөг зураг авалт", 200000, 90, "p"], ["Бүтээгдэхүүний зураг авалт", 350000, 120], ["Видео монтаж", 350000, 0, "n"], ["Арга хэмжээний зураг авалт", 500000, 180]],
  },
  {
    slug: "nail-lab", name: "Nail Lab", cat: "goo-saikhan", place: "ulaanbaatar", district: "bayangol",
    tagline: "Хумсны дизайн, гель, уртасгалт",
    about: "Хумсны арчилгаа, гель будалт, дизайны мастерын студи. Багаж хэрэгслийг хэрэглэх бүрт ариутгаж, үйлчлүүлэгч бүрт шинэ нэг удаагийн хэрэгсэл ашиглана.",
    price: 2, hours: "salon", phone: "7000 1021", insta: "nail.lab.ub",
    address: "Баянгол дүүрэг, 5-р хороо, Хүүхдийн 100", tags: ["хумс", "гель", "маникюр"], quality: 0.85, reviews: 6,
    services: [["Гель маникюр", 45000, 75, "p"], ["Хумс уртасгах", 85000, 120], ["Хумсны дизайн", 15000, 30], ["Педикюр", 50000, 75]],
    staff: [["А. Нандин", "Хумсны мастер"], ["С. Уянга", "Хумсны мастер"]],
  },
  {
    slug: "brunch-room", name: "Brunch Room", cat: "kafe", place: "ulaanbaatar", district: "khan-uul",
    tagline: "Өглөөний цай, бранч, шинэхэн жүүс",
    about: "Өглөөний цайг тайван хэмнэлээр өнгөрүүлэхэд зориулсан гэрэлтэй кафе. Амралтын өдрүүдэд бранчийн цэс гарна.",
    price: 2, hours: "cafe6", phone: "7000 1022", insta: "brunchroom.ub",
    address: "Хан-Уул дүүрэг, 15-р хороо, Зайсан", tags: ["бранч", "өглөөний цай", "жүүс"], quality: 0.83, reviews: 6,
    services: [["Бранч иж бүрдэл", 32000, 0, "np"], ["Авокадо тост", 19000, 0, "n"], ["Шинэхэн жүүс", 9500, 0, "n"], ["Ширээ захиалах (4 хүн)", 0, 90]],
  },
  {
    slug: "silk-road-kitchen", name: "Silk Road Kitchen", cat: "restoran", place: "ulaanbaatar", district: "chingeltei",
    tagline: "Дундад Азийн уламжлалт хоол",
    about: "Плов, лагман, шашлык зэрэг Дундад Азийн хоолыг мод түлж бэлтгэдэг ресторан. Том ширээтэй танхимд бүлгээрээ цугларахад тохиромжтой.",
    price: 2, hours: "dining", phone: "7000 1023", insta: "silkroad.kitchen",
    address: "Чингэлтэй дүүрэг, 6-р хороо, Сансар", tags: ["плов", "лагман", "шашлык"], quality: 0.86, reviews: 6,
    services: [["Плов", 24000, 0, "np"], ["Шашлык", 28000, 0, "n"], ["Лагман", 18000, 0, "n"], ["Ширээ захиалах (6 хүн)", 0, 120], ["Хувийн танхим (12 хүн хүртэл)", 100000, 180]],
  },
  {
    slug: "gift-box-ub", name: "Gift Box UB", cat: "delguur", place: "ulaanbaatar", district: "sukhbaatar-duureg",
    tagline: "Бэлгийн иж бүрдэл, захиалгат хайрцаг",
    about: "Төрсөн өдөр, ойн баяр, хамтрагчдад өгөх бэлгийг орон нутгийн бүтээгдэхүүнээр багцалж өгдөг дэлгүүр. Хайрцагт нэр, мэндчилгээг тусгайлан хэвлэнэ.",
    price: 2, hours: "shop", phone: "7000 1024", insta: "giftbox.ub",
    address: "Сүхбаатар дүүрэг, 7-р хороо, Жуулчны гудамж", tags: ["бэлэг", "дурсгал", "хайрцаг"], quality: 0.84, reviews: 5,
    services: [["Бэлгийн иж бүрдэл", 85000, 0, "n"], ["Захиалгат бэлэг", 150000, 0, "n"], ["Компанийн бэлгийн санал", 0, 30, "p"]],
  },
  {
    slug: "urban-thread", name: "Urban Thread", cat: "khuvtsas", place: "ulaanbaatar", district: "bayangol",
    tagline: "Орон нутгийн залуу дизайнеруудын хувцас",
    about: "Өдөр тутмын хувцсыг орон нутгийн оёдлын цехэд хязгаарлагдмал тоогоор үйлдвэрлэдэг брэнд. Загвар бүр жилд нэг л удаа гардаг.",
    price: 3, hours: "shop", phone: "7000 1025", insta: "urbanthread.mn",
    address: "Баянгол дүүрэг, 1-р хороо, Төв шуудангийн ард", tags: ["хувцас", "загвар", "цамц"], quality: 0.82, reviews: 5,
    services: [["Капюшонтой цамц", 129000, 0, "n"], ["Футболк", 59000, 0, "n"], ["Өмд", 119000, 0, "n"], ["Хувийн үзлэг, зөвлөгөө", 0, 30, "p"]],
  },
  {
    slug: "zaisan-pilates", name: "Zaisan Pilates", cat: "sport", place: "ulaanbaatar", district: "khan-uul",
    tagline: "Реформер пилатес жижиг бүлгээр",
    about: "Дөрвөөс илүүгүй хүнтэй бүлэгт реформер аппаратаар хичээллэдэг студи. Анхны хичээлийн өмнө бие бялдрын байдлыг үнэлнэ.",
    price: 3, hours: "gym", phone: "7000 1026", insta: "zaisan.pilates",
    address: "Хан-Уул дүүрэг, 15-р хороо, Зайсан толгой", tags: ["пилатес", "реформер", "дасгал"], quality: 0.9, reviews: 5,
    services: [["Анхны хичээл", 40000, 60, "p"], ["Реформер пилатес", 60000, 60], ["Хувийн хичээл", 90000, 60], ["10 хичээлийн багц", 500000, 0, "n"]],
    staff: [["Р. Мишээл", "Пилатесын багш"]],
  },
  {
    slug: "ariun-tea-house", name: "Ariun Tea House", cat: "kafe", place: "ulaanbaatar", district: "chingeltei",
    tagline: "Сүүтэй цай, уламжлалт амттан",
    about: "Монгол сүүтэй цай, ногоон цай, гар хийцийн ааруул, боорцог зэргийг тайван орчинд амсах цайны газар. Хэсэг хүнтэй уулзахад тохиромжтой.",
    price: 1, hours: "cafe", phone: "7000 1027", insta: "ariun.tea",
    address: "Чингэлтэй дүүрэг, 3-р хороо, Сэлбэ", tags: ["сүүтэй цай", "боорцог", "ааруул"], quality: 0.86, reviews: 5,
    services: [["Сүүтэй цай", 5500, 0, "np"], ["Ногоон цай (тогоо)", 12000, 0, "n"], ["Боорцог, ааруул", 9000, 0, "n"], ["Ширээ захиалах", 0, 60]],
  },
  {
    slug: "tuul-auto-care", name: "Tuul Auto Care", cat: "busad", place: "ulaanbaatar", district: "bayanzurkh",
    tagline: "Машины угаалга, дотор цэвэрлэгээ",
    about: "Гадна угаалга, дотор цэвэрлэгээ, тосолгооны иж бүрэн үйлчилгээ. Цагаа захиалбал дараалалгүй орно.",
    price: 1, hours: "workshop", phone: "7000 1028",
    address: "Баянзүрх дүүрэг, 8-р хороо, Дамбадаржаа", tags: ["угаалга", "машин", "цэвэрлэгээ"], quality: 0.76, reviews: 5,
    services: [["Гадна угаалга", 20000, 30, "p"], ["Дотор цэвэрлэгээ", 45000, 60], ["Иж бүрэн угаалга", 90000, 120]],
  },
  {
    slug: "pet-spa-bayan", name: "Pet Spa Bayan", cat: "busad", place: "ulaanbaatar", district: "bayangol",
    tagline: "Тэжээвэр амьтны угаалга, үс засалт",
    about: "Нохой, муурны угаалга, үс засалт, сарвуу арчилгаа хийдэг салон. Амьтан бүрт тайван хандаж, үйлчилгээний өмнө эзэнтэй нь ярилцана.",
    price: 2, hours: "salon", phone: "7000 1029", insta: "petspa.bayan",
    address: "Баянгол дүүрэг, 16-р хороо", tags: ["нохой", "муур", "угаалга"], quality: 0.84, reviews: 5,
    services: [["Нохойн угаалга", 40000, 60, "p"], ["Үс засалт", 60000, 90], ["Сарвууны арчилгаа", 15000, 20]],
  },

  // ---------- Орон нутаг ----------
  {
    slug: "erdenet-roast", name: "Erdenet Roast", cat: "kafe", place: "erdenet",
    tagline: "Эрдэнэтийн шинэхэн шарсан кофе",
    about: "Эрдэнэт хотын төвд өөрсдөө кофе шардаг жижиг кафе. Өглөөний цагаар ажлын ширээ чөлөөтэй, оройдоо найз нөхдөөрөө зууш хийх хүмүүс ихэвчлэн ирдэг.",
    price: 2, hours: "cafe", phone: "7000 2001", insta: "erdenet.roast",
    address: "Эрдэнэт хот, 17-р баг, Найрамдлын гудамж", tags: ["кофе", "кафе", "эрдэнэт"], quality: 0.85, reviews: 5,
    services: [["Латте", 9500, 10, "np"], ["Эспрессо", 6500, 10, "n"], ["Бялуу", 8000, 10, "n"], ["Ширээ захиалах", 0, 60]],
  },
  {
    slug: "orkhon-fitness", name: "Orkhon Fitness", cat: "sport", place: "erdenet",
    tagline: "Эрдэнэтийн хамгийн том фитнес заал",
    about: "Хүч, кардио, бүлгийн хичээл багтсан спорт заал. Ээлжийн ажилтнуудад зориулсан өглөөний болон оройн тусгай цаг бий.",
    price: 1, hours: "gym", phone: "7000 2002", insta: "orkhon.fitness",
    address: "Эрдэнэт хот, 12-р баг", tags: ["фитнес", "дасгал", "заал"], quality: 0.78, reviews: 5,
    services: [["Танилцах дасгал (үнэгүй)", 0, 45, "p"], ["Сарын гишүүнчлэл", 80000, 0, "n"], ["Хувийн дасгалжуулагч", 35000, 60]],
    staff: [["Б. Мөнхбат", "Дасгалжуулагч"]],
  },
  {
    slug: "copper-city-salon", name: "Copper City Salon", cat: "goo-saikhan", place: "erdenet",
    tagline: "Үс, нүүр, хумсны салон",
    about: "Эрдэнэт хотын төвд байрлах гоо сайхны салон. Хуримын болон баярын үеийн үс, нүүр будалтыг урьдчилан захиалгаар хийнэ.",
    price: 2, hours: "salon", phone: "7000 2003", insta: "coppercity.salon",
    address: "Эрдэнэт хот, 8-р баг", tags: ["салон", "үс", "будалт"], quality: 0.8, reviews: 5,
    services: [["Үс засалт", 30000, 60, "p"], ["Нүүр будалт", 50000, 60], ["Маникюр", 25000, 60]],
    staff: [["Ч. Алтанцэцэг", "Стилист"]],
  },
  {
    slug: "darkhan-craft-house", name: "Darkhan Craft House", cat: "gar-urlal", place: "darkhan",
    tagline: "Дарханы урчуудын гар хийцийн бүтээл",
    about: "Дархан хотын арав гаруй урчийн бүтээлийг нэг дор цуглуулсан гар урлалын байр. Эсгий, мод, ширэн эдлэл болон жижиг дурсгалын зүйл олдоно.",
    price: 2, hours: "shop", phone: "7000 2004", insta: "darkhan.crafts",
    address: "Дархан хот, 4-р баг, Тусгаар тогтнолын гудамж", tags: ["гар урлал", "дурсгал", "эсгий"], quality: 0.86, reviews: 5,
    services: [["Эсгий дурсгал", 20000, 0, "n"], ["Ширэн эдлэл", 75000, 0, "n"], ["Захиалгат бэлэг", 90000, 30, "p"], ["Гар урлалын хичээл", 40000, 90]],
  },
  {
    slug: "kharaa-bistro", name: "Kharaa Bistro", cat: "restoran", place: "darkhan",
    tagline: "Дарханы гэр бүлийн ресторан",
    about: "Шинэхэн ногоо, орон нутгийн мах, гэрийн хийцийн соус бүхий цэстэй ресторан. Төрсөн өдөр, найрын ширээг урьдчилан бэлтгэнэ.",
    price: 2, hours: "dining", phone: "7000 2005",
    address: "Дархан хот, 7-р баг", tags: ["хоол", "ресторан", "найр"], quality: 0.8, reviews: 5,
    services: [["Үдийн цэс", 16000, 0, "n"], ["Шарсан мах", 28000, 0, "n"], ["Ширээ захиалах (6 хүн)", 0, 120, "p"]],
  },
  {
    slug: "north-gate-hotel", name: "North Gate Hotel", cat: "zochid-buudal", place: "darkhan",
    tagline: "Хойд хилийн замд амрах өрөө",
    about: "Дархан хотоос Алтанбулаг руу явах замд хоноглох жуулчид, ажилтнуудад зориулсан цэвэрхэн зочид буудал. Машины зогсоол үнэгүй.",
    price: 2, hours: "hotel", phone: "7000 2006",
    address: "Дархан хот, 2-р баг", tags: ["зочид буудал", "өрөө", "зогсоол"], quality: 0.78, reviews: 5,
    services: [["Нэг ортой өрөө", 70000, 60, "p"], ["Хоёр ортой өрөө", 95000, 60], ["Гэр бүлийн өрөө", 130000, 60]],
  },
  {
    slug: "anu-translate", name: "Anu Translate", cat: "frilanser", place: "darkhan",
    tagline: "Орчуулга, албан бичгийн засвар",
    about: "Монгол, англи хэлний бичгийн орчуулга болон албан бичгийн найруулга хийдэг орчуулагч. Баримт бичгийг нууцлалтай хадгална.",
    price: 1, hours: "freelance", phone: "7000 2007", web: "anu-translate.example",
    address: "Дархан хот (зайнаас ажиллана)", tags: ["орчуулга", "найруулга", "англи хэл"], quality: 0.88, reviews: 5,
    services: [["Орчуулгын зөвлөгөө (үнэгүй)", 0, 20, "p"], ["Орчуулга (нэг хуудас)", 18000, 0, "n"], ["Албан бичгийн орчуулга", 25000, 0, "n"], ["Ярианы орчуулга (1 цаг)", 60000, 60]],
  },
  {
    slug: "khuvsgul-lake-lodge", name: "Khuvsgul Lake Lodge", cat: "zochid-buudal", place: "khovsgol", ll: [50.4311, 100.1704],
    tagline: "Хөвсгөл нуурын эрэг дээрх гэр бааз",
    about: "Хөвсгөл нуурын эрэгт байрлах, модон байшин болон гэрээс бүрдсэн амралтын бааз. Завь, морин аялал, загасчлалыг байгаа газраас зохион байгуулна.",
    price: 3, featured: true, hours: "hotel", phone: "7000 3001", insta: "khuvsgul.lodge", web: "khuvsgul-lodge.example",
    address: "Хөвсгөл аймаг, Ханх сум, нуурын баруун эрэг", tags: ["нуур", "гэр бааз", "аялал"], quality: 0.93, reviews: 8,
    services: [["Гэр (2 хүн, нэг шөнө)", 160000, 60, "p"], ["Модон байшин (4 хүн)", 320000, 60], ["Завиар аялах (2 цаг)", 90000, 120], ["Морин аялал (3 цаг)", 70000, 180]],
  },
  {
    slug: "moron-felt-studio", name: "Moron Felt Studio", cat: "gar-urlal", place: "khovsgol", ll: [49.6378, 100.1624],
    tagline: "Хөвсгөлийн ноосоор хийсэн эсгий бүтээл",
    about: "Хөвсгөлийн малчдын ноосыг шууд авч эсгий эдлэл хийдэг жижиг студи. Аялагчид эсгий зургийн хичээлд суух боломжтой.",
    price: 2, hours: "workshop", phone: "7000 3002", insta: "moron.felt",
    address: "Мөрөн хот, 3-р баг", tags: ["эсгий", "гар урлал", "ноос"], quality: 0.89, reviews: 5,
    services: [["Эсгий зургийн хичээл", 45000, 120, "p"], ["Эсгий дэвсгэр", 55000, 0, "n"], ["Захиалгат эсгий", 120000, 30]],
  },
  {
    slug: "blue-pearl-cafe", name: "Blue Pearl Cafe", cat: "kafe", place: "khovsgol", ll: [49.6344, 100.1581],
    tagline: "Мөрөн хотын дулаахан кафе",
    about: "Нуурын аялалаас буцаж ирсэн хүмүүс цай, кофе уун амрах дуртай газар. Хөвсгөлийн жимсний нухаш, гэрийн бялуу онцлог.",
    price: 1, hours: "cafe", phone: "7000 3003",
    address: "Мөрөн хот, 1-р баг", tags: ["кафе", "цай", "бялуу"], quality: 0.84, reviews: 5,
    services: [["Кофе", 6000, 10, "np"], ["Жимсний нухаштай цай", 7500, 10, "n"], ["Гэрийн бялуу", 7000, 10, "n"], ["Ширээ захиалах", 0, 60]],
  },
  {
    slug: "gobi-oasis-camp", name: "Gobi Oasis Camp", cat: "zochid-buudal", place: "umnugovi", ll: [43.6951, 104.1838],
    tagline: "Говийн хөндийд гэр бааз",
    about: "Гурван гайхамшигт нуруунаас холгүй, говийн нам гүм орчинд байрлах гэр бааз. Үдэш одот тэнгэр ажиглах, тэмээ унах аялал зохион байгуулна.",
    price: 3, hours: "hotel", phone: "7000 3004", insta: "gobi.oasis", web: "gobi-oasis.example",
    address: "Өмнөговь аймаг, Даланзадгад, хойд зүгт", tags: ["говь", "гэр бааз", "тэмээ"], quality: 0.92, reviews: 7,
    services: [["Гэр (2 хүн, нэг шөнө)", 180000, 60, "p"], ["Тэмээн аялал (2 цаг)", 60000, 120], ["Одот тэнгэр ажиглах үдэш", 40000, 120], ["Бүлгийн хоол (хүн)", 35000, 90]],
  },
  {
    slug: "dune-guide-services", name: "Dune Guide Services", cat: "uilchilgee", place: "umnugovi", ll: [43.5681, 104.4129],
    tagline: "Говийн аяллын хөтөч, тээвэр",
    about: "Хонгорын элс, Ёлын ам, Баянзаг зэрэг газар очих аяллын хөтөч, жолоочийн үйлчилгээ. Маршрутыг хүссэн хугацаанд тохируулж өгнө.",
    price: 3, hours: "office", phone: "7000 3005",
    address: "Даланзадгад хот, 2-р баг", tags: ["хөтөч", "аялал", "говь"], quality: 0.9, reviews: 5,
    services: [["Аяллын зөвлөгөө (үнэгүй)", 0, 30, "p"], ["Нэг өдрийн аялал", 350000, 480], ["Гурван өдрийн аялал", 1200000, 60]],
  },
  {
    slug: "eastern-steppe-cafe", name: "Eastern Steppe Cafe", cat: "kafe", place: "dornod", ll: [48.0684, 114.5252],
    tagline: "Чойбалсангийн төвд амт, дулаан",
    about: "Дорнод аймгийн төвд өглөө бүр шинэхэн боов, кофе бэлддэг кафе. Хөдөөнөөс ирсэн хүмүүс замын зууш авдаг.",
    price: 1, hours: "cafe6", phone: "7000 3006",
    address: "Чойбалсан хот, 1-р баг", tags: ["кафе", "боов", "кофе"], quality: 0.8, reviews: 5,
    services: [["Кофе", 5500, 10, "np"], ["Шинэ боов", 4000, 5, "n"], ["Ширээ захиалах", 0, 60]],
  },
  {
    slug: "choibalsan-barber", name: "Choibalsan Barber", cat: "uschin", place: "dornod", ll: [48.0734, 114.5411],
    tagline: "Дорнодын эрчүүдийн үсчин",
    about: "Нэг ширээтэй, өндөр ур чадвартай жижиг үсчин. Цагаа урьдчилан захиалж болох бөгөөд сахал засалт онцлог.",
    price: 1, hours: "barber", phone: "7000 3007",
    address: "Чойбалсан хот, 4-р баг", tags: ["үсчин", "сахал", "эрэгтэй"], quality: 0.82, reviews: 5,
    services: [["Үс засалт", 15000, 40, "p"], ["Сахал засалт", 8000, 20], ["Үс, сахал иж бүрэн", 20000, 55]],
    staff: [["Х. Эрдэнэбат", "Үсчин"]],
  },
  {
    slug: "buir-handmade", name: "Buir Handmade", cat: "gar-urlal", place: "dornod", ll: [48.0801, 114.5197],
    tagline: "Буйр нуурын бүсийн гар урлал",
    about: "Дорнодын малчин айлуудын хийсэн арьс, ноос, модон эдлэлийг борлуулдаг жижиг дэлгүүр. Худалдааны орлогын нэг хэсэг урчуудад шууд очдог.",
    price: 1, hours: "shop", phone: "7000 3008", insta: "buir.handmade",
    address: "Чойбалсан хот, 2-р баг", tags: ["гар урлал", "арьс", "ноос"], quality: 0.8, reviews: 5,
    services: [["Арьсан бүс", 35000, 0, "n"], ["Ноосон оймс", 15000, 0, "n"], ["Хувийн үзлэг, зөвлөгөө", 0, 30, "p"]],
  },
  {
    slug: "altai-creative", name: "Altai Creative", cat: "buteelch-studi", place: "khovd", ll: [48.0096, 91.6402],
    tagline: "Баруун бүсийн бүтээлч баг",
    about: "Ховд хотод төвлөрсөн дизайн, видео, сурталчилгааны студи. Баруун бүсийн бизнесүүдэд орон нутгийн онцлогт тохирсон брэнд бүтээхэд тусалдаг.",
    price: 2, featured: true, hours: "studio", phone: "7000 4001", insta: "altai.creative", web: "altai-creative.example",
    address: "Ховд хот, 1-р баг, Жаргалант", tags: ["дизайн", "видео", "сурталчилгаа", "лого"], quality: 0.9, reviews: 6,
    services: [["Танилцах уулзалт (үнэгүй)", 0, 40, "p"], ["Лого дизайн", 700000, 45], ["Видео сурталчилгаа", 1200000, 60], ["Зураг авалт (1 өдөр)", 600000, 480], ["Сошиал хуудас удирдах (сар)", 500000, 0, "n"]],
    staff: [["Ү. Бекболат", "Продюсер"], ["Ж. Аружан", "Дизайнер"]],
  },
  {
    slug: "khovd-kebab-house", name: "Khovd Kebab House", cat: "restoran", place: "khovd", ll: [48.0049, 91.6483],
    tagline: "Баруун бүсийн шарсан мах, шашлык",
    about: "Ховдын уламжлалт аргаар чанасан болон шарсан хоол бэлддэг гэр бүлийн ресторан. Оройн цагаар олон хүн цуглардаг тул ширээгээ урьдчилан захиалахыг зөвлөе.",
    price: 2, hours: "dining", phone: "7000 4002",
    address: "Ховд хот, 3-р баг", tags: ["шашлык", "мах", "хоол"], quality: 0.84, reviews: 5,
    services: [["Шашлык", 22000, 0, "np"], ["Хонины шөл", 12000, 0, "n"], ["Ширээ захиалах (6 хүн)", 0, 120]],
  },
  {
    slug: "altai-syrmak-atelier", name: "Altai Syrmak Atelier", cat: "khuvtsas", place: "bayan-olgii", ll: [48.9701, 89.9582],
    tagline: "Казах сүлжмэл хээтэй хувцас, чимэглэл",
    about: "Баян-Өлгийн казах уламжлалт сүрмэ, оёдлын хээгээр хийсэн хувцас, дэвсгэр, тансаг чимэглэлийн ателье. Хээг захиалагчийн хүслээр сонгож өгнө.",
    price: 3, hours: "workshop", phone: "7000 5001", insta: "altai.syrmak",
    address: "Өлгий хот, 2-р баг", tags: ["сүрмэ", "казах хээ", "оёдол"], quality: 0.93, reviews: 6,
    services: [["Хээ сонгох уулзалт", 0, 45, "p"], ["Сүрмэн дэвсгэр", 180000, 0, "n"], ["Захиалгат хувцас", 450000, 0, "n"]],
  },
  {
    slug: "olgii-tea-house", name: "Olgii Tea House", cat: "kafe", place: "bayan-olgii", ll: [48.9675, 89.9702],
    tagline: "Баурсак, сүүтэй цай, казах амттан",
    about: "Казах уламжлалт баурсак, байшин цай, гэрийн амттанг нэг дор амсах цайны газар. Хоолны ширээ том тул гэр бүлээрээ цугларахад тохиромжтой.",
    price: 1, hours: "cafe", phone: "7000 5002",
    address: "Өлгий хот, 1-р баг", tags: ["цай", "баурсак", "казах"], quality: 0.87, reviews: 5,
    services: [["Сүүтэй цай", 3500, 0, "np"], ["Баурсак (багц)", 8000, 0, "n"], ["Ширээ захиалах", 0, 60]],
  },
  {
    slug: "selenge-river-guesthouse", name: "Selenge River Guesthouse", cat: "zochid-buudal", place: "selenge", ll: [50.2361, 106.2051],
    tagline: "Сэлэнгэ мөрний эрэг дээрх зочны байшин",
    about: "Сүхбаатар хотын төвд, мөрний эрэгт байрлах гэр бүлийн зочны байшин. Өглөөний цай нь хоногийн үнэд багтсан, Орос руу явах галт тэрэгний цагийг мэдэж зөвлөнө.",
    price: 1, hours: "hotel", phone: "7000 6001",
    address: "Сүхбаатар хот, Сэлэнгэ аймаг, 3-р баг", tags: ["зочны байшин", "мөрөн", "хил"], quality: 0.8, reviews: 5,
    services: [["Нэг ортой өрөө", 60000, 60, "p"], ["Хоёр ортой өрөө", 85000, 60], ["Гэр бүлийн өрөө", 120000, 60]],
  },
  {
    slug: "terelj-ger-camp", name: "Terelj Ger Camp", cat: "zochid-buudal", place: "tuv", ll: [47.9918, 107.4541],
    tagline: "Тэрэлжийн байгальд гэр бааз",
    about: "Горхи-Тэрэлжийн үндэсний цэцэрлэгт хүрээлэнгийн ойролцоо байрлах гэр бааз. Гэрт хоноглож, морь унаж, зэргэлдээх ууланд явган аялна.",
    price: 3, featured: true, hours: "hotel", phone: "7000 7001", insta: "terelj.gercamp", web: "terelj-gercamp.example",
    address: "Төв аймаг, Налайх дүүрэг, Тэрэлж", tags: ["гэр бааз", "морин аялал", "байгаль"], quality: 0.91, reviews: 8,
    services: [["Гэр (2 хүн, нэг шөнө)", 180000, 60, "p"], ["Гэр (4 хүн, нэг шөнө)", 280000, 60], ["Морин аялал (1 цаг)", 40000, 60], ["Өглөөний цай", 15000, 45]],
  },
  {
    slug: "steppe-music-weekend", name: "Steppe Music Weekend", cat: "arga-khemjee", place: "tuv", ll: [47.8645, 107.3321],
    tagline: "Хээрийн дунд хоёр өдрийн хөгжмийн баяр",
    about: "Жилд нэг удаа зохиогддог, гурван тайзтай хөгжмийн баяр. Майхантай хонох талбай, хоолны талбай, хүүхдийн булан байгуулагдана.",
    price: 2, hours: "weekend", phone: "7000 7002", insta: "steppe.music.weekend",
    address: "Төв аймаг, Тэрэлжийн зам дагуух талбай", tags: ["фестиваль", "хөгжим", "майхан"], quality: 0.88, reviews: 6,
    services: [["Нэг өдрийн тасалбар", 45000, 480, "p"], ["Хоёр өдрийн тасалбар", 80000, 960], ["Майхны талбай", 30000, 60]],
  },
  {
    slug: "tsetserleg-springs", name: "Tsetserleg Hot Springs", cat: "zochid-buudal", place: "arkhangai", ll: [47.4752, 101.4545],
    tagline: "Архангайн халуун рашааны амралт",
    about: "Цэцэрлэг хотын ойролцоох халуун рашаанд амрах гэр бааз. Рашаанд орох цагийг захиалбал дараалалгүй орж болно.",
    price: 2, hours: "hotel", phone: "7000 8001",
    address: "Архангай аймаг, Цэцэрлэг хот ойролцоо", tags: ["рашаан", "амралт", "гэр бааз"], quality: 0.86, reviews: 5,
    services: [["Гэр (2 хүн, нэг шөнө)", 130000, 60, "p"], ["Рашаанд орох (хүн)", 15000, 60], ["Гэр бүлийн гэр (5 хүн)", 220000, 60]],
  },
];

// ---------- Сэтгэгдлийн бэлтгэл ----------

export const REVIEWER_NAMES = [
  "Б. Болормаа", "Т. Тэмүүлэн", "Н. Анужин", "Э. Мөнхбат", "С. Саруул", "Д. Номин", "О. Энхжин", "Г. Ганбаатар",
  "Ц. Оюунчимэг", "Л. Хулан", "Ж. Билгүүн", "М. Мишээл", "Р. Золбоо", "Ч. Алтанцэцэг", "А. Нандин", "У. Содном",
  "Х. Эрдэнэбат", "Ү. Дэлгэрмаа", "Б. Тулга", "П. Цолмон",
];

export const GENERIC_REVIEWS: Array<[number, string]> = [
  [5, "Үйлчилгээ маш сайн, ажилтнууд найрсаг. Дахин заавал ирнэ."],
  [5, "Хүлээлгүй, цагаа баримталж үйлчиллээ. Үнэ чанартаа тохирсон."],
  [4, "Орчин цэвэрхэн, тохь тухтай. Үнэ бага зэрэг өндөр санагдсан ч үнэхээр сайн."],
  [5, "Найз нөхөддөө зөвлөсөн. Цагийг урьдчилан захиалахад маш хялбар байлаа."],
  [4, "Ерөнхийдөө сэтгэл ханасан. Амралтын өдөр хүн олонтой байдаг тул урьдчилан захиалахыг зөвлөе."],
  [5, "Мэргэжлийн түвшинд хийдэг газар. Асуусан бүх зүйлд тодорхой хариулсан."],
  [3, "Бүтээгдэхүүн сайн, гэхдээ хүлээх хугацаа бодсоноос урт болсон."],
  [4, "Тайван, цэвэр орчин. Ажилтнууд сайн мэдээлэл өгсөн."],
  [5, "Яг хүссэн ёсоороо болсон. Баярлалаа!"],
  [4, "Сайн газар. Дараагийн удаа найзтайгаа хамт ирнэ."],
];

export const CATEGORY_REVIEWS: Record<string, Array<[number, string]>> = {
  kafe: [[5, "Кофе нь үнэхээр амттай, амттан нь гэрийн хийцтэй. Ажиллаж суухад тохиромжтой."], [4, "Өглөөний цагаар нам гүм байдаг. Цонхны дэргэд суухад гоё."], [5, "Бариста маш сайн зөвлөж, миний амтанд таарсан кофег сонгож өгсөн."]],
  restoran: [[5, "Хоол халуунаараа, амт нь тогтвортой. Порц нь том."], [4, "Үдийн цэс тун хямдхан бөгөөд амттай. Оройдоо хүн олон болдог."], [5, "Гэр бүлээрээ очиход тохиромжтой. Ширээгээ урьдчилан захиалсан нь зөв байлаа."]],
  "goo-saikhan": [[5, "Мастер маш болгоомжтой ажилласан. Үр дүн нь миний хүссэнээс ч илүү гарлаа."], [4, "Багаж хэрэгсэл цэвэр, орчин тайван. Цагтаа эхэлсэн."], [5, "Нүүрний арчилгааны дараа арьс минь мэдэгдэхүйц сайжирсан."]],
  uschin: [[5, "Яг хүссэн загвараар засчихсан. Сахлын халуун алчуур нь сайхан байсан."], [4, "Хурдан бөгөөд цэвэрхэн засдаг. Цаг захиалгаар ирэхэд хүлээлгүй."]],
  sport: [[5, "Дасгалжуулагч миний түвшинд тааруулж хөтөлбөр гаргаж өгсөн. Тоног төхөөрөмж шинэ."], [4, "Заал цэвэр, агааржуулалт сайн. Оройн цагаар хүн олонтой байдаг."], [5, "Бүлгийн хичээл маш сайхан уур амьсгалтай. Эхлэгчдэд ч тохиромжтой."]],
  khuvtsas: [[5, "Материал нь маш сайн, оёдол нь нямбай. Хэмжээ тохируулахад тусалсан."], [4, "Загвар нь өвөрмөц, чанар нь сайн. Үнэ бага зэрэг өндөр."]],
  "gar-urlal": [[5, "Бэлэг авахад төгс газар. Нэг бүр нь өвөрмөц, чанартай хийгдсэн."], [5, "Хичээлийн үеэр урчийн ур хүнийг сонирхууллаа. Өөрийнхөө хийсэн зүйлийг гэртээ авч явлаа."]],
  delguur: [[4, "Бүтээгдэхүүний сонголт сайн, зөвлөгөө өгдөг. Бэлэг авахад тохиромжтой."], [5, "Гар хийцийн бараа чанартай. Савлагаа нь гоё."]],
  "zochid-buudal": [[5, "Өрөө тохилог, хоолны өглөө нь амттай. Байршил маш сайн."], [5, "Байгалийн дунд нам гүм хоноглож, үнэхээр амарсан."], [4, "Ажилтнууд тусч, аяллын маршрутаа тохируулж өгсөн. Халуун ус үргэлж гарч байсан."]],
  "arga-khemjee": [[5, "Зохион байгуулалт сайн, тасалбар шалгах дараалал богино байсан."], [4, "Олон сонирхолтой бүтээл үзлээ. Дараагийн жил заавал очно."]],
  uilchilgee: [[5, "Тодорхой тайлбарлаж, хугацаандаа хийж өгсөн. Мэргэжлийн хандлагатай."], [4, "Анхны зөвлөгөө маш хэрэгтэй байлаа. Үнийн санал ойлгомжтой."]],
  frilanser: [[5, "Хугацаандаа хүлээлгэж өгсөн, санал бодлыг тусгахдаа нээлттэй. Ажил маш цэвэрхэн."], [5, "Тодорхой мэдээлэл өгч, ажлын явцыг тогтмол мэдэгдэж байсан."]],
  "buteelch-studi": [[5, "Манай брэндийг сайн ойлгож, нэгдмэл дүр төрх бүтээж өгсөн."], [4, "Зураг авалтын чанар өндөр. Эцсийн үр дүнд бид сэтгэл хангалуун байна."]],
  busad: [[5, "Тусгайлан анхаарч, цагаа баримтлан ажилласан."], [4, "Үнэ боломжийн, ажил нь цэвэрхэн."]],
};
