
-- Products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  tag_en text NOT NULL DEFAULT '',
  tag_ar text NOT NULL DEFAULT '',
  image_url text DEFAULT NULL,
  pdf_url text DEFAULT NULL,
  icon text NOT NULL DEFAULT 'Flame',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read products" ON public.products
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Authenticated can manage products" ON public.products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Services table
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  tag_en text NOT NULL DEFAULT '',
  tag_ar text NOT NULL DEFAULT '',
  image_url text DEFAULT NULL,
  pdf_url text DEFAULT NULL,
  icon text NOT NULL DEFAULT 'Wrench',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read services" ON public.services
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Authenticated can manage services" ON public.services
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
