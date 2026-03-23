-- Allow authenticated users to manage contact_addresses
CREATE POLICY "Authenticated can insert contact_addresses"
ON public.contact_addresses FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update contact_addresses"
ON public.contact_addresses FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete contact_addresses"
ON public.contact_addresses FOR DELETE TO authenticated
USING (true);