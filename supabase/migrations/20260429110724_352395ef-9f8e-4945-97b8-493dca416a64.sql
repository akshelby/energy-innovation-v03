ALTER TABLE public.product_pages
  ADD COLUMN IF NOT EXISTS certifications_en text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS certifications_ar text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ratings jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS operation_modes_en text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS operation_modes_ar text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS applications_en text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS applications_ar text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS tagline_en text DEFAULT '',
  ADD COLUMN IF NOT EXISTS tagline_ar text DEFAULT '';