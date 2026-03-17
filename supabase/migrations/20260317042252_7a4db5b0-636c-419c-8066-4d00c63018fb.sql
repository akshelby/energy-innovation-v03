
-- Rename 'ENERGY-BACHFIRE E 120' to 'ENERGY-BACHFIRE'
UPDATE product_items SET name_en = 'ENERGY-BACHFIRE', name_ar = 'ENERGY-BACHFIRE', sort_order = 1 WHERE id = '4984dcd9-bb1e-4896-8442-82fc67be7449';

-- Fix sort orders for existing fire children
UPDATE product_items SET sort_order = 2 WHERE id = 'd39b4f83-2897-4f76-93ab-52bea1aec6c5'; -- BACHFIRE EW
UPDATE product_items SET sort_order = 3 WHERE id = 'c9f1cf8d-4568-4fa0-81a2-991bee3109b0'; -- SUPERFIRE
UPDATE product_items SET sort_order = 4 WHERE id = 'a2cb0d77-ee6a-4eff-9084-efb04b7b4d71'; -- BACHFIRE Z
UPDATE product_items SET sort_order = 10 WHERE id = 'd1d895c8-4bf9-40c8-8035-cf62474e6546'; -- MEGAFIRE EI60

-- Add missing fire curtain children
INSERT INTO product_items (category_key, name_en, name_ar, parent_id, sort_order) VALUES
('cat.fire', 'ENERGY-SUPERFIRE Z', 'ENERGY-SUPERFIRE Z', 'eb5b16c4-efe4-4ffa-b9ea-2ead41f31f81', 5),
('cat.fire', 'ENERGY-BACHFIRE H', 'ENERGY-BACHFIRE H', 'eb5b16c4-efe4-4ffa-b9ea-2ead41f31f81', 6),
('cat.fire', 'ENERGY-BACHFIRE UL 10D', 'ENERGY-BACHFIRE UL 10D', 'eb5b16c4-efe4-4ffa-b9ea-2ead41f31f81', 7),
('cat.fire', 'ENERGY-BACHFIRE CONFLEX', 'ENERGY-BACHFIRE CONFLEX', 'eb5b16c4-efe4-4ffa-b9ea-2ead41f31f81', 8),
('cat.fire', 'ENERGY-BACHFIRE EGRESS', 'ENERGY-BACHFIRE EGRESS', 'eb5b16c4-efe4-4ffa-b9ea-2ead41f31f81', 9),
('cat.fire', 'ENERGY-MEGAFIRE EI120', 'ENERGY-MEGAFIRE EI120', 'eb5b16c4-efe4-4ffa-b9ea-2ead41f31f81', 11);

-- Add missing smoke curtain children
INSERT INTO product_items (category_key, name_en, name_ar, parent_id, sort_order) VALUES
('cat.smoke', 'ENERGY-BACHSMOKE FIX', 'ENERGY-BACHSMOKE FIX', '8e615ba8-deca-46ab-bcd4-4a0747d78a08', 5),
('cat.smoke', 'ENERGY-BACHSMOKE H', 'ENERGY-BACHSMOKE H', '8e615ba8-deca-46ab-bcd4-4a0747d78a08', 6);
