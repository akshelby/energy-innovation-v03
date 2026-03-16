
-- Add all fire curtain and smoke curtain child products
-- First update existing entries to use proper product names
UPDATE product_items SET name_en = 'ENERGY-BACHFIRE', name_ar = 'ENERGY-BACHFIRE' WHERE name_en = 'Fire Curtains' AND category_key = 'cat.fire';
UPDATE product_items SET name_en = 'ENERGY-BACHSMOKE', name_ar = 'ENERGY-BACHSMOKE' WHERE name_en = 'Smoke Curtains' AND category_key = 'cat.fire';

-- Insert new fire curtain products
INSERT INTO product_items (category_key, name_en, name_ar, sort_order) VALUES
('cat.fire', 'ENERGY-BACHFIRE EW', 'ENERGY-BACHFIRE EW', 2),
('cat.fire', 'ENERGY-SUPERFIRE', 'ENERGY-SUPERFIRE', 3),
('cat.fire', 'ENERGY-BACHFIRE Z', 'ENERGY-BACHFIRE Z', 4),
('cat.fire', 'ENERGY-SUPERFIRE Z', 'ENERGY-SUPERFIRE Z', 5),
('cat.fire', 'ENERGY-BACHFIRE H', 'ENERGY-BACHFIRE H', 6),
('cat.fire', 'ENERGY-BACHFIRE UL 10D', 'ENERGY-BACHFIRE UL 10D', 7),
('cat.fire', 'ENERGY-BACHFIRE CONFLEX', 'ENERGY-BACHFIRE CONFLEX', 8),
('cat.fire', 'ENERGY-BACHFIRE EGRESS', 'ENERGY-BACHFIRE EGRESS', 9),
('cat.fire', 'ENERGY-MEGAFIRE EI60', 'ENERGY-MEGAFIRE EI60', 10),
('cat.fire', 'ENERGY-MEGAFIRE EI120', 'ENERGY-MEGAFIRE EI120', 11),
('cat.fire', 'ENERGY-BACHSMOKE DA', 'ENERGY-BACHSMOKE DA', 12),
('cat.fire', 'ENERGY-BACHSMOKE DHA', 'ENERGY-BACHSMOKE DHA', 13),
('cat.fire', 'ENERGY-BACHSMOKE EW', 'ENERGY-BACHSMOKE EW', 14),
('cat.fire', 'ENERGY-BACHSMOKE FIX', 'ENERGY-BACHSMOKE FIX', 15),
('cat.fire', 'ENERGY-BACHSMOKE H', 'ENERGY-BACHSMOKE H', 16);
