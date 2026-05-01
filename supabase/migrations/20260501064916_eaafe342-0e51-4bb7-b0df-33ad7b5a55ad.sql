-- Set has_page = true for all items that have an active product_page row
UPDATE public.product_items pi
SET has_page = true
WHERE EXISTS (
  SELECT 1 FROM public.product_pages pp
  WHERE pp.product_item_id = pi.id
  AND pp.is_active = true
);

-- Set has_page = false for all items that have NO product_page row
UPDATE public.product_items pi
SET has_page = false
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_pages pp
  WHERE pp.product_item_id = pi.id
);