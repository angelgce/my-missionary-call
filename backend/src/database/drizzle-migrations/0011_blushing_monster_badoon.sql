CREATE TABLE "diary_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diary_entry_images" (
	"id" text PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"image_key" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "diary_entry_images" ADD CONSTRAINT "diary_entry_images_entry_id_diary_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."diary_entries"("id") ON DELETE cascade ON UPDATE no action;