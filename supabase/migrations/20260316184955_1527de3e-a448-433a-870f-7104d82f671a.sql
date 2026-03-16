
-- Move smoke curtain items to their own category
UPDATE product_items SET category_key = 'cat.smoke' WHERE category_key = 'cat.fire' AND name_en LIKE 'ENERGY-BACHSMOKE%';
UPDATE product_items SET category_key = 'cat.smoke' WHERE category_key = 'cat.fire' AND name_en = 'ENERGY-BACHSMOKE';
