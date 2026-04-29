CREATE TABLE public.countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL DEFAULT '',
  name_ar TEXT NOT NULL DEFAULT '',
  flag_url TEXT,
  country_code TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read countries"
ON public.countries
FOR SELECT
TO anon, authenticated
USING (true);

INSERT INTO public.site_content (content_key, value_en, value_ar) VALUES
  ('countries.tag', 'Global Reach', 'انتشار عالمي'),
  ('countries.title', 'Proudly serving our customers in the Middle East', 'نخدم عملاءنا بفخر في الشرق الأوسط'),
  ('countries.subtitle', 'Trusted partners across the region', 'شركاء موثوقون في جميع أنحاء المنطقة')
ON CONFLICT (content_key) DO NOTHING;

INSERT INTO public.countries (name_en, name_ar, country_code, flag_url, sort_order) VALUES
  ('Saudi Arabia', 'المملكة العربية السعودية', 'SA', 'https://flagcdn.com/w320/sa.png', 1),
  ('UAE', 'الإمارات العربية المتحدة', 'AE', 'https://flagcdn.com/w320/ae.png', 2),
  ('Iraq', 'العراق', 'IQ', 'https://flagcdn.com/w320/iq.png', 3),
  ('Lebanon', 'لبنان', 'LB', 'https://flagcdn.com/w320/lb.png', 4),
  ('Qatar', 'قطر', 'QA', 'https://flagcdn.com/w320/qa.png', 5),
  ('Jordan', 'الأردن', 'JO', 'https://flagcdn.com/w320/jo.png', 6),
  ('Bahrain', 'البحرين', 'BH', 'https://flagcdn.com/w320/bh.png', 7),
  ('Oman', 'عُمان', 'OM', 'https://flagcdn.com/w320/om.png', 8);