CREATE TABLE "advice_box" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"guest_name" text DEFAULT '' NOT NULL,
	"advice" text NOT NULL,
	"session_id" text NOT NULL,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "predictions" ADD COLUMN "guest_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "advice_box" ADD CONSTRAINT "advice_box_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;