CREATE TABLE "service_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"description" text NOT NULL,
	"technician_label" text,
	"created_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_reports_description_length" CHECK (char_length("description") between 1 and 2000),
	CONSTRAINT "service_reports_technician_label_length" CHECK ("technician_label" is null or char_length("technician_label") between 1 and 80)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "service_reports_client_id_unique" ON "service_reports" USING btree ("client_id");