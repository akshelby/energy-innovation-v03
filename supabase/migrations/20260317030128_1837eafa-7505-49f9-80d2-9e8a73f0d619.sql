
-- Delete all fire & smoke product items except the two we want to keep
DELETE FROM product_items 
WHERE category_key IN ('cat.fire', 'cat.smoke') 
AND id NOT IN ('eb5b16c4-efe4-4ffa-b9ea-2ead41f31f81', '8e615ba8-deca-46ab-bcd4-4a0747d78a08');

-- Rename the kept items to "Fire Curtains" and "Smoke Curtains"
UPDATE product_items 
SET name_en = 'Fire Curtains', name_ar = 'ستائر الحريق'
WHERE id = 'eb5b16c4-efe4-4ffa-b9ea-2ead41f31f81';

UPDATE product_items 
SET name_en = 'Smoke Curtains', name_ar = 'ستائر الدخان'
WHERE id = '8e615ba8-deca-46ab-bcd4-4a0747d78a08';
