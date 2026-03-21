
-- Product pages table: stores page content for any product_item
CREATE TABLE public.product_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_item_id UUID NOT NULL REFERENCES public.product_items(id) ON DELETE CASCADE UNIQUE,
  headline_en TEXT NOT NULL DEFAULT '',
  headline_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  sub_description_en TEXT NOT NULL DEFAULT '',
  sub_description_ar TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product_pages"
  ON public.product_pages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated can manage product_pages"
  ON public.product_pages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Product page images: gallery images per page
CREATE TABLE public.product_page_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_page_id UUID NOT NULL REFERENCES public.product_pages(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_page_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product_page_images"
  ON public.product_page_images FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated can manage product_page_images"
  ON public.product_page_images FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Product enquiries: form submissions from product pages
CREATE TABLE public.product_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_item_id UUID REFERENCES public.product_items(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  requirement TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert product_enquiries"
  ON public.product_enquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can read product_enquiries"
  ON public.product_enquiries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete product_enquiries"
  ON public.product_enquiries FOR DELETE
  TO authenticated
  USING (true);

-- Add has_page column to product_items for quick filtering
ALTER TABLE public.product_items ADD COLUMN has_page BOOLEAN NOT NULL DEFAULT false;
