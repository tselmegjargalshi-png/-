CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"business_id" text NOT NULL,
	"service_id" text,
	"staff_id" text,
	"user_id" text,
	"service_name" text NOT NULL,
	"price_mnt" integer DEFAULT 0 NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"duration_min" integer DEFAULT 30 NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_owners" (
	"user_id" text NOT NULL,
	"business_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_owners_user_id_business_id_pk" PRIMARY KEY("user_id","business_id")
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category_id" text NOT NULL,
	"location_id" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"website" text DEFAULT '' NOT NULL,
	"instagram" text DEFAULT '' NOT NULL,
	"facebook" text DEFAULT '' NOT NULL,
	"price_level" integer DEFAULT 2 NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"logo_url" text DEFAULT '' NOT NULL,
	"cover_url" text DEFAULT '' NOT NULL,
	"hours" jsonb NOT NULL,
	"popular_service" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"rating_avg" real DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"keywords" text[] DEFAULT '{}' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_daily_stats" (
	"business_id" text NOT NULL,
	"day" text NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"profile_views" integer DEFAULT 0 NOT NULL,
	"contacts" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "business_daily_stats_business_id_day_pk" PRIMARY KEY("business_id","day")
);
--> statement-breakpoint
CREATE TABLE "business_images" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"url" text NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"parent_id" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"owner_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"reporter_id" text,
	"reason" text NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"user_id" text,
	"author_name" text NOT NULL,
	"rating" integer NOT NULL,
	"body" text NOT NULL,
	"photos" text[] DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'VISIBLE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_businesses" (
	"user_id" text NOT NULL,
	"business_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_businesses_user_id_business_id_pk" PRIMARY KEY("user_id","business_id")
);
--> statement-breakpoint
CREATE TABLE "business_services" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_mnt" integer DEFAULT 0 NOT NULL,
	"duration_min" integer DEFAULT 30 NOT NULL,
	"popular" boolean DEFAULT false NOT NULL,
	"bookable" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_staff" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"name" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'USER' NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"phone" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_business_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."business_services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_staff_id_business_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."business_staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_owners" ADD CONSTRAINT "business_owners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_owners" ADD CONSTRAINT "business_owners_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_category_id_business_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."business_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_daily_stats" ADD CONSTRAINT "business_daily_stats_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_images" ADD CONSTRAINT "business_images_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_reviews" ADD CONSTRAINT "business_reviews_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_reviews" ADD CONSTRAINT "business_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_businesses" ADD CONSTRAINT "saved_businesses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_businesses" ADD CONSTRAINT "saved_businesses_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_services" ADD CONSTRAINT "business_services_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_staff" ADD CONSTRAINT "business_staff_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_code_idx" ON "bookings" USING btree ("code");--> statement-breakpoint
CREATE INDEX "bookings_business_idx" ON "bookings" USING btree ("business_id","starts_at");--> statement-breakpoint
CREATE INDEX "bookings_user_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "businesses_slug_idx" ON "businesses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "businesses_category_idx" ON "businesses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "businesses_location_idx" ON "businesses" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "businesses_status_idx" ON "businesses" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_idx" ON "business_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "contacts_business_idx" ON "contact_requests" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "images_business_idx" ON "business_images" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_slug_idx" ON "locations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "reviews_business_idx" ON "business_reviews" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "services_business_idx" ON "business_services" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "staff_business_idx" ON "business_staff" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");