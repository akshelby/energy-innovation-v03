INSERT INTO public.product_items (category_key, name_en, name_ar, sort_order, is_active, has_page)
VALUES
  ('cat.spares', 'Fire Curtain Spare Parts', 'قطع غيار ستائر الحريق', 0, true, false),
  ('cat.spares', 'Roller Shutter Spare Parts', 'قطع غيار الشتر الدوار', 1, true, false),
  ('cat.spares', 'HVAC Spare Parts', 'قطع غيار التكييف والتهوية', 2, true, false),
  ('cat.spares', 'Oil & Gas Spare Parts', 'قطع غيار النفط والغاز', 3, true, false),
  ('cat.spares', 'Consumables', 'المستهلكات', 4, true, false),
  ('cat.spares', 'Seals & Gaskets', 'المانعات والحشوات', 5, true, false)
ON CONFLICT DO NOTHING;