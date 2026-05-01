ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS show_on_homepage boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS homepage_sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_show_on_homepage ON public.products(show_on_homepage) WHERE show_on_homepage = true;