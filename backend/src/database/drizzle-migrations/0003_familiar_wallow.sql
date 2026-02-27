DO $$ BEGIN
  ALTER TABLE "revelation" ADD COLUMN IF NOT EXISTS "pdf_text" text DEFAULT '' NOT NULL;
END $$;
