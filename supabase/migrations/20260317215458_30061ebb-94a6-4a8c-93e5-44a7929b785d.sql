
ALTER TABLE public.product_categories ADD COLUMN is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.product_items ADD COLUMN is_active boolean NOT NULL DEFAULT true;
