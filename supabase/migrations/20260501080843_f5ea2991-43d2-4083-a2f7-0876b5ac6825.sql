ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS linked_item_id uuid REFERENCES public.product_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_linked_item_id ON public.products(linked_item_id);