
-- Table for multiple addresses with active toggle
CREATE TABLE public.contact_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label_en TEXT NOT NULL DEFAULT '',
  label_ar TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read contact_addresses"
  ON public.contact_addresses FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated can manage contact_addresses"
  ON public.contact_addresses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert visibility toggle keys into site_content (default visible = "true")
INSERT INTO public.site_content (content_key, value_en, value_ar)
VALUES
  ('contact_phone_visible', 'true', 'true'),
  ('contact_email_visible', 'true', 'true'),
  ('contact_address_visible', 'true', 'true')
ON CONFLICT (content_key) DO NOTHING;
