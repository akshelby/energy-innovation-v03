
-- Create product_categories table
CREATE TABLE public.product_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  label_en text NOT NULL DEFAULT '',
  label_ar text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read categories (public site needs them)
CREATE POLICY "Anyone can read product_categories"
ON public.product_categories
FOR SELECT
TO anon, authenticated
USING (true);

-- Authenticated can manage categories
CREATE POLICY "Authenticated can manage product_categories"
ON public.product_categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Seed with existing hardcoded categories
INSERT INTO public.product_categories (key, label_en, label_ar, sort_order) VALUES
  ('cat.fire', 'Fire & Smoke Safety Systems', 'أنظمة السلامة من الحرائق والدخان', 0),
  ('cat.roller', 'Roller Shutters & Doors', 'الأبواب والشتر الدوارة', 1),
  ('cat.oil', 'Oil & Gas Industry Equipment', 'معدات صناعة النفط والغاز', 2),
  ('cat.hvac', 'HVAC & Ventilation Solutions', 'حلول التكييف والتهوية', 3),
  ('cat.loading', 'Loading Bay & Material Handling', 'أرصفة التحميل ومناولة المواد', 4);
