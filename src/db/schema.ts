import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType() {
    return "bytea";
  },
  fromDriver(value) {
    return Buffer.from(value);
  },
});

export type Role = "USER" | "OWNER" | "ADMIN";
export type UserStatus = "ACTIVE" | "BANNED";
export type BusinessStatus = "PENDING" | "ACTIVE" | "SUSPENDED";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type ReviewStatus = "VISIBLE" | "HIDDEN";
export type ReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";
export type ReportTarget = "BUSINESS" | "REVIEW";
export type LocationKind = "AIMAG" | "CITY" | "DISTRICT";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
/** Хаалттай өдөр нь null, ажлын цаг нь ["09:00", "18:00"] хэлбэртэй. */
export type OpeningHours = Record<DayKey, [string, string] | null>;

export const users = pgTable(
  "users",
  {
    id: id(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<Role>().notNull().default("USER"),
    status: text("status").$type<UserStatus>().notNull().default("ACTIVE"),
    phone: text("phone"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const locations = pgTable(
  "locations",
  {
    id: id(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    kind: text("kind").$type<LocationKind>().notNull(),
    parentId: text("parent_id"),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("locations_slug_idx").on(t.slug)],
);

export const categories = pgTable(
  "business_categories",
  {
    id: id(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    icon: text("icon").notNull(),
    description: text("description").notNull().default(""),
    keywords: text("keywords").array().notNull().default([]),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("categories_slug_idx").on(t.slug)],
);

export const businesses = pgTable(
  "businesses",
  {
    id: id(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    tagline: text("tagline").notNull().default(""),
    description: text("description").notNull().default(""),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    locationId: text("location_id")
      .notNull()
      .references(() => locations.id),
    address: text("address").notNull().default(""),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    phone: text("phone").notNull().default(""),
    email: text("email").notNull().default(""),
    website: text("website").notNull().default(""),
    instagram: text("instagram").notNull().default(""),
    facebook: text("facebook").notNull().default(""),
    priceLevel: integer("price_level").notNull().default(2),
    status: text("status").$type<BusinessStatus>().notNull().default("PENDING"),
    featured: boolean("featured").notNull().default(false),
    isDemo: boolean("is_demo").notNull().default(false),
    logoUrl: text("logo_url").notNull().default(""),
    coverUrl: text("cover_url").notNull().default(""),
    hours: jsonb("hours").$type<OpeningHours>().notNull(),
    popularService: text("popular_service").notNull().default(""),
    tags: text("tags").array().notNull().default([]),
    ratingAvg: real("rating_avg").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("businesses_slug_idx").on(t.slug),
    index("businesses_category_idx").on(t.categoryId),
    index("businesses_location_idx").on(t.locationId),
    index("businesses_status_idx").on(t.status),
  ],
);

export const businessOwners = pgTable(
  "business_owners",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.businessId] })],
);

export const services = pgTable(
  "business_services",
  {
    id: id(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    priceMnt: integer("price_mnt").notNull().default(0),
    durationMin: integer("duration_min").notNull().default(30),
    popular: boolean("popular").notNull().default(false),
    bookable: boolean("bookable").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("services_business_idx").on(t.businessId)],
);

export const staff = pgTable(
  "business_staff",
  {
    id: id(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("staff_business_idx").on(t.businessId)],
);

export const images = pgTable(
  "business_images",
  {
    id: id(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("images_business_idx").on(t.businessId)],
);

export const reviews = pgTable(
  "business_reviews",
  {
    id: id(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    photos: text("photos").array().notNull().default([]),
    status: text("status").$type<ReviewStatus>().notNull().default("VISIBLE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reviews_business_idx").on(t.businessId)],
);

export const bookings = pgTable(
  "bookings",
  {
    id: id(),
    code: text("code").notNull(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    serviceId: text("service_id").references(() => services.id, { onDelete: "set null" }),
    staffId: text("staff_id").references(() => staff.id, { onDelete: "set null" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    serviceName: text("service_name").notNull(),
    priceMnt: integer("price_mnt").notNull().default(0),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    note: text("note").notNull().default(""),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    durationMin: integer("duration_min").notNull().default(30),
    status: text("status").$type<BookingStatus>().notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("bookings_code_idx").on(t.code),
    index("bookings_business_idx").on(t.businessId, t.startsAt),
    index("bookings_user_idx").on(t.userId),
  ],
);

export const savedBusinesses = pgTable(
  "saved_businesses",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.businessId] })],
);

export const dailyStats = pgTable(
  "business_daily_stats",
  {
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    day: text("day").notNull(),
    impressions: integer("impressions").notNull().default(0),
    profileViews: integer("profile_views").notNull().default(0),
    contacts: integer("contacts").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.businessId, t.day] })],
);

export const contactRequests = pgTable(
  "contact_requests",
  {
    id: id(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("contacts_business_idx").on(t.businessId)],
);

export const reports = pgTable("reports", {
  id: id(),
  targetType: text("target_type").$type<ReportTarget>().notNull(),
  targetId: text("target_id").notNull(),
  reporterId: text("reporter_id").references(() => users.id, { onDelete: "set null" }),
  reason: text("reason").notNull(),
  status: text("status").$type<ReportStatus>().notNull().default("OPEN"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const media = pgTable("media", {
  id: id(),
  mime: text("mime").notNull(),
  data: bytea("data").notNull(),
  ownerId: text("owner_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
