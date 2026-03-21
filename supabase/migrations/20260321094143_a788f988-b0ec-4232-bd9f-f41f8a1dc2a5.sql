
-- Add missing product categories
INSERT INTO product_categories (key, label_en, label_ar, sort_order) VALUES
  ('cat.exhaust', 'Vehicle Exhaust Extraction', 'أنظمة شفط عوادم المركبات', 5),
  ('cat.controls', 'Controls & Thermostats', 'أجهزة التحكم والثرموستات', 6),
  ('cat.dampers', 'Dampers', 'المخمدات', 7),
  ('cat.cooling', 'Close Control Units', 'وحدات التحكم الدقيق بالتبريد', 8),
  ('cat.spares', 'Spare Parts & Consumables', 'قطع الغيار والمستهلكات', 9)
ON CONFLICT DO NOTHING;

-- Update the 6 empty products with names and category_keys
UPDATE products SET name_en = 'Oil & Gas Equipment', name_ar = 'معدات النفط والغاز', category_key = 'cat.oil' WHERE id = 'fa3f2f50-f610-4198-bb80-ee746690d3e9';
UPDATE products SET name_en = 'Vehicle Exhaust Extraction', name_ar = 'أنظمة شفط عوادم المركبات', category_key = 'cat.exhaust' WHERE id = '46d56d81-ad17-4c05-b048-84fcaa493f43';
UPDATE products SET name_en = 'Controls & Thermostats', name_ar = 'أجهزة التحكم والثرموستات', category_key = 'cat.controls' WHERE id = 'ba70d34f-11cc-4640-a6b1-1b8d40423eed';
UPDATE products SET name_en = 'Dampers', name_ar = 'المخمدات', category_key = 'cat.dampers' WHERE id = '7bf6f562-1ba1-4b1f-8ee5-31e7cf313259';
UPDATE products SET name_en = 'Close Control Units', name_ar = 'وحدات التحكم الدقيق بالتبريد', category_key = 'cat.cooling' WHERE id = 'a9b19422-df2a-49d5-af09-c33f0cdaa0ef';
UPDATE products SET name_en = 'Spare Parts & Consumables', name_ar = 'قطع الغيار والمستهلكات', category_key = 'cat.spares' WHERE id = '5ef40fc4-2403-4885-b24e-8669f16c84a9';
