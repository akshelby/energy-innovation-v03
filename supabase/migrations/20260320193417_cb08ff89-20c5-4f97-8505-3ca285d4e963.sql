
-- Table to store whitelisted admin email addresses
CREATE TABLE public.admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  label text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Only authenticated users (admins via edge function) can read
CREATE POLICY "Anyone can read admin_emails"
ON public.admin_emails
FOR SELECT
TO anon, authenticated
USING (true);

-- Only authenticated can manage
CREATE POLICY "Authenticated can manage admin_emails"
ON public.admin_emails
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
