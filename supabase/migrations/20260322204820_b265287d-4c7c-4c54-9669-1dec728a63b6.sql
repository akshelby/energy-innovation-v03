
-- Remove the dangerous public read policy on admin_emails
DROP POLICY IF EXISTS "Anyone can read admin_emails" ON public.admin_emails;

-- Remove the overly permissive authenticated manage policies
DROP POLICY IF EXISTS "Authenticated can manage admin_emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Authenticated can manage careers" ON public.careers;
DROP POLICY IF EXISTS "Authenticated can manage site content" ON public.site_content;
DROP POLICY IF EXISTS "Authenticated can manage product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated can manage product_items" ON public.product_items;
DROP POLICY IF EXISTS "Authenticated can manage product_pages" ON public.product_pages;
DROP POLICY IF EXISTS "Authenticated can manage product_page_images" ON public.product_page_images;
DROP POLICY IF EXISTS "Authenticated can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated can manage services" ON public.services;
DROP POLICY IF EXISTS "Authenticated can manage contact_addresses" ON public.contact_addresses;

-- All write operations go through the admin-api edge function (which uses service_role key),
-- so no authenticated write RLS policies are needed. Public read stays for the website.
