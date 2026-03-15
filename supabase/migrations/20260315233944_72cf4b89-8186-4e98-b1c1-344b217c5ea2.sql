INSERT INTO public.site_content (content_key, value_en, value_ar) VALUES
  ('contact_phone', '+966 XX XXX XXXX', '+966 XX XXX XXXX'),
  ('contact_email', 'info@energyinnvo.com', 'info@energyinnvo.com'),
  ('contact_address', 'Riyadh, Saudi Arabia', 'الرياض، المملكة العربية السعودية')
ON CONFLICT (content_key) DO NOTHING;