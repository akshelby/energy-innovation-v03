
CREATE TABLE public.product_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  pdf_url text DEFAULT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product_items" ON public.product_items
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Authenticated can manage product_items" ON public.product_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed with existing menu items
INSERT INTO public.product_items (category_key, name_en, name_ar, sort_order) VALUES
  ('cat.fire', 'Fire Curtains', 'ستائر الحريق', 0),
  ('cat.fire', 'Smoke Curtains', 'ستائر الدخان', 1),
  ('cat.roller', 'Industrial & Commercial Doors', 'أبواب صناعية وتجارية', 0),
  ('cat.roller', 'Residential Doors', 'أبواب سكنية', 1),
  ('cat.roller', 'Garage Doors', 'أبواب جراج', 2),
  ('cat.roller', 'High-Speed Doors', 'أبواب عالية السرعة', 3),
  ('cat.roller', 'Steel Doors', 'أبواب فولاذية', 4),
  ('cat.roller', 'Louvers', 'فتحات التهوية', 5),
  ('cat.oil', 'Well Equipment & Devices', 'معدات وأجهزة الآبار', 0),
  ('cat.oil', 'Sensors (Pressure, Flow, Temperature, Gas Detection)', 'أجهزة استشعار (ضغط، تدفق، حرارة، كشف غاز)', 1),
  ('cat.oil', 'Spare Parts & Consumables', 'قطع غيار ومستهلكات', 2),
  ('cat.hvac', 'Industrial Ventilators & Fans', 'مراوح ومنفاخات صناعية', 0),
  ('cat.hvac', 'Vehicle Exhaust Extraction Systems', 'أنظمة استخراج عوادم المركبات', 1),
  ('cat.hvac', 'VAV Thermostats & Controls', 'ثرموستات وأنظمة تحكم VAV', 2),
  ('cat.hvac', 'Dampers', 'مخمدات', 3),
  ('cat.loading', 'Dock Levelers', 'مسويات الرصيف', 0),
  ('cat.loading', 'Dock Shelters', 'مظلات الرصيف', 1);
