DO $$ BEGIN
  ALTER TABLE "revelation" ADD COLUMN IF NOT EXISTS "normalized_pdf_text" text DEFAULT '' NOT NULL;
END $$;
