
-- =============================================
-- 1. LEADS: Remove permissive SELECT & DELETE
-- Keep only the INSERT policy for contact form
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated can delete leads" ON public.leads;

-- =============================================
-- 2. PRODUCT ENQUIRIES: Remove permissive SELECT & DELETE
-- Keep only INSERT for enquiry submissions
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read product_enquiries" ON public.product_enquiries;
DROP POLICY IF EXISTS "Authenticated can delete product_enquiries" ON public.product_enquiries;

-- =============================================
-- 3. CONTACT ADDRESSES: Remove write policies
-- Keep public SELECT only
-- =============================================
DROP POLICY IF EXISTS "Authenticated can delete contact_addresses" ON public.contact_addresses;
DROP POLICY IF EXISTS "Authenticated can insert contact_addresses" ON public.contact_addresses;
DROP POLICY IF EXISTS "Authenticated can update contact_addresses" ON public.contact_addresses;

-- =============================================
-- 4. ADMIN EMAILS: Ensure no access from client
-- (RLS is enabled, just make sure no permissive policies exist)
-- =============================================
-- No policies to drop; RLS enabled = all blocked by default

-- =============================================
-- 5. SITE CONTENT: Remove any write policies
-- (writes happen via admin Edge Function with service_role key)
-- =============================================
-- Drop if they exist (they may have been created outside migrations)
DROP POLICY IF EXISTS "Authenticated can update site_content" ON public.site_content;
DROP POLICY IF EXISTS "Authenticated can insert site_content" ON public.site_content;
DROP POLICY IF EXISTS "Authenticated can delete site_content" ON public.site_content;

-- =============================================
-- 6. STORAGE: Remove permissive upload/update/delete
-- Public read stays. Writes only via service_role (Edge Functions).
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload pdfs" ON storage.objects;
