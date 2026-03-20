
-- Create careers table for job listings
CREATE TABLE public.careers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT NOT NULL DEFAULT '',
  title_ar TEXT NOT NULL DEFAULT '',
  department_en TEXT NOT NULL DEFAULT '',
  department_ar TEXT NOT NULL DEFAULT '',
  location_en TEXT NOT NULL DEFAULT '',
  location_ar TEXT NOT NULL DEFAULT '',
  type_en TEXT NOT NULL DEFAULT 'Full-time',
  type_ar TEXT NOT NULL DEFAULT 'دوام كامل',
  description_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  requirements_en TEXT NOT NULL DEFAULT '',
  requirements_ar TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read careers"
ON public.careers
FOR SELECT
TO anon, authenticated
USING (true);

-- Authenticated can manage
CREATE POLICY "Authenticated can manage careers"
ON public.careers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
