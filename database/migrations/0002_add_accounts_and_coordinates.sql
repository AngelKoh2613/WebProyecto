CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_name_length" CHECK (char_length("name") between 1 and 80),
	CONSTRAINT "users_email_length" CHECK (char_length("email") between 3 and 254)
);
--> statement-breakpoint
ALTER TABLE "service_reports" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "service_reports" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "service_reports" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
ALTER TABLE "service_reports" ADD CONSTRAINT "service_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_reports" ADD CONSTRAINT "service_reports_latitude_range" CHECK ("latitude" is null or ("latitude" >= -90 and "latitude" <= 90));--> statement-breakpoint
ALTER TABLE "service_reports" ADD CONSTRAINT "service_reports_longitude_range" CHECK ("longitude" is null or ("longitude" >= -180 and "longitude" <= 180));