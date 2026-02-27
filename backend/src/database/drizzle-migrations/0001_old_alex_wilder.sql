DO $$ BEGIN
  ALTER TABLE "predictions" ADD COLUMN IF NOT EXISTS "city" text NOT NULL DEFAULT '';
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "predictions" ADD COLUMN IF NOT EXISTS "session_id" text NOT NULL DEFAULT '';
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "predictions" ADD COLUMN IF NOT EXISTS "latitude" text;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "predictions" ADD COLUMN IF NOT EXISTS "longitude" text;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "predictions" ADD COLUMN IF NOT EXISTS "ip_address" text;
END $$;
