DO $$ BEGIN
  ALTER TABLE "revelation" ADD COLUMN IF NOT EXISTS "opening_date" text DEFAULT '';
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "revelation" ADD COLUMN IF NOT EXISTS "location_address" text DEFAULT '';
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "revelation" ADD COLUMN IF NOT EXISTS "location_url" text DEFAULT '';
END $$;
