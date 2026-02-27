ALTER TABLE "predictions" ADD COLUMN "city" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "predictions" ADD COLUMN "session_id" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "predictions" ADD COLUMN "latitude" text;--> statement-breakpoint
ALTER TABLE "predictions" ADD COLUMN "longitude" text;--> statement-breakpoint
ALTER TABLE "predictions" ADD COLUMN "ip_address" text;