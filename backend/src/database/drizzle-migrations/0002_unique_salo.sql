DO $$ BEGIN
  ALTER TABLE "revelation" ADD COLUMN IF NOT EXISTS "missionary_name" text DEFAULT '' NOT NULL;
END $$;
