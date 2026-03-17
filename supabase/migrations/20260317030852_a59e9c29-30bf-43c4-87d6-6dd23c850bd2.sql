
-- Add parent_id column for nested product items
ALTER TABLE product_items ADD COLUMN parent_id uuid REFERENCES product_items(id) ON DELETE CASCADE;

-- Move ENERGY-BACHFIRE items under Fire Curtains (eb5b16c4)
UPDATE product_items SET parent_id = 'eb5b16c4-efe4-4ffa-b9ea-2ead41f31f81'
WHERE category_key = 'cat.fire' 
AND id != 'eb5b16c4-efe4-4ffa-b9ea-2ead41f31f81'
AND id != '8e615ba8-deca-46ab-bcd4-4a0747d78a08';

-- Move ENERGY-BACHSMOKE items under Smoke Curtains (8e615ba8)
UPDATE product_items SET parent_id = '8e615ba8-deca-46ab-bcd4-4a0747d78a08'
WHERE category_key = 'cat.smoke';

-- Move Smoke Curtains to cat.fire so both appear under same category heading
UPDATE product_items SET category_key = 'cat.fire'
WHERE id = '8e615ba8-deca-46ab-bcd4-4a0747d78a08';
