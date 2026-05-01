WITH RECURSIVE item_tree AS (
  SELECT id, category_key, parent_id
  FROM public.product_items
  WHERE parent_id IS NULL AND category_key IS NOT NULL AND category_key <> ''

  UNION ALL

  SELECT child.id, parent.category_key, child.parent_id
  FROM public.product_items child
  JOIN item_tree parent ON child.parent_id = parent.id
  WHERE child.category_key IS NULL OR child.category_key = ''
)
UPDATE public.product_items pi
SET category_key = tree.category_key
FROM item_tree tree
WHERE pi.id = tree.id
  AND (pi.category_key IS NULL OR pi.category_key = '');