
-- Site content table for editable website content
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key text NOT NULL UNIQUE,
  value_en text NOT NULL DEFAULT '',
  value_ar text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read site content (public website)
CREATE POLICY "Anyone can read site content"
ON public.site_content
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow inserts for authenticated (admin will use service role via edge function)
CREATE POLICY "Authenticated can manage site content"
ON public.site_content
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Also allow anon to read leads for the admin page (via edge function with service role)
-- Add SELECT policy on leads for authenticated users
CREATE POLICY "Authenticated can read leads"
ON public.leads
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (true);
