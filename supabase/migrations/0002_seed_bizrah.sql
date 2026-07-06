-- ════════════════════════════════════════════════════════════════════════
-- 0002 seed — Bizrah Electronics as tenant #1
-- Deterministic UUIDs so the app and tests can reference known rows.
-- ════════════════════════════════════════════════════════════════════════

insert into businesses (id, slug, name, ref_prefix, currency, branding, vat_enabled, vat_rate, vat_reg_no, status)
values (
  '11111111-1111-1111-1111-111111111111',
  'bizrah',
  'Bizrah Electronics',
  'BZR',
  'KES',
  jsonb_build_object(
    'logoUrl', null,
    'faviconUrl', null,
    'accent', '#D8A24A',
    'tagline', 'Premium electronics, delivered across Kenya.',
    'heroHeadline', 'Technology worth the upgrade.',
    'heroSubcopy', 'Phones, televisions, computers and appliances from the brands you trust — with M-Pesa checkout and countrywide delivery.'
  ),
  true,
  0.1600,
  'P051234567X',
  'active'
);

-- Sandbox payment config (Daraja test shortcode). Replace with production
-- credentials — encrypted — before going live.
insert into business_payment_configs (business_id, provider, environment, mpesa_shortcode, mpesa_passkey, callback_url)
values (
  '11111111-1111-1111-1111-111111111111',
  'mpesa',
  'sandbox',
  '174379',
  'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  null
);

-- ─── Categories ─────────────────────────────────────────────────────────

insert into categories (id, business_id, slug, name, position) values
  ('22220000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'phones',       'Phones & Tablets',  1),
  ('22220000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'televisions',  'Televisions',       2),
  ('22220000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'computers',    'Computers',         3),
  ('22220000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'audio',        'Audio',             4),
  ('22220000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'appliances',   'Home Appliances',   5),
  ('22220000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'accessories',  'Accessories',       6);

-- ─── Products ───────────────────────────────────────────────────────────

insert into products (id, business_id, category_id, slug, name, description, status, attributes) values
  ('33330000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22220000-0000-0000-0000-000000000001',
   'samsung-galaxy-a55-5g', 'Samsung Galaxy A55 5G',
   'A premium mid-range 5G phone with a 6.6" Super AMOLED 120Hz display, 50MP OIS camera and all-day battery.',
   'published', jsonb_build_object('brand','Samsung','display','6.6" Super AMOLED','battery','5000mAh')),

  ('33330000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '22220000-0000-0000-0000-000000000001',
   'apple-iphone-15', 'Apple iPhone 15',
   'The iPhone 15 with Dynamic Island, a 48MP main camera and USB-C. Aerospace-grade aluminium design.',
   'published', jsonb_build_object('brand','Apple','display','6.1" Super Retina XDR','chip','A16 Bionic')),

  ('33330000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '22220000-0000-0000-0000-000000000001',
   'tecno-camon-30', 'Tecno Camon 30',
   'Big display, big battery and a 50MP camera at a value price. Built for the Kenyan market.',
   'published', jsonb_build_object('brand','Tecno','display','6.78" AMOLED','battery','5000mAh')),

  ('33330000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '22220000-0000-0000-0000-000000000002',
   'samsung-55-crystal-uhd', 'Samsung 55" Crystal UHD 4K',
   'Crystal Processor 4K upscaling, HDR and a slim design. Smart TV powered by Tizen.',
   'published', jsonb_build_object('brand','Samsung','size','55"','resolution','4K UHD')),

  ('33330000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '22220000-0000-0000-0000-000000000002',
   'lg-65-oled-evo', 'LG 65" OLED evo C4',
   'Self-lit OLED pixels for perfect blacks, α9 AI Processor and 144Hz gaming. Reference-grade picture.',
   'published', jsonb_build_object('brand','LG','size','65"','panel','OLED evo')),

  ('33330000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '22220000-0000-0000-0000-000000000003',
   'apple-macbook-air-m3', 'Apple MacBook Air 13" (M3)',
   'The M3 chip brings serious performance and up to 18 hours of battery in a fanless 1.24kg design.',
   'published', jsonb_build_object('brand','Apple','screen','13.6" Liquid Retina','chip','Apple M3')),

  ('33330000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', '22220000-0000-0000-0000-000000000003',
   'hp-pavilion-15', 'HP Pavilion 15',
   'A dependable everyday laptop: 13th-gen Intel Core i5, 8GB RAM and a fast 512GB SSD.',
   'published', jsonb_build_object('brand','HP','screen','15.6" FHD','cpu','Intel Core i5')),

  ('33330000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', '22220000-0000-0000-0000-000000000004',
   'sony-wh-1000xm5', 'Sony WH-1000XM5 Headphones',
   'Industry-leading noise cancellation, 30-hour battery and crystal-clear hands-free calling.',
   'published', jsonb_build_object('brand','Sony','type','Over-ear','anc','Yes')),

  ('33330000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', '22220000-0000-0000-0000-000000000006',
   'anker-usb-c-charger-20w', 'Anker 20W USB-C Charger',
   'Compact PIQ 3.0 fast charger. Fills a compatible phone to 50% in around 25 minutes.',
   'published', jsonb_build_object('brand','Anker','output','20W','port','USB-C')),

  ('33330000-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', '22220000-0000-0000-0000-000000000005',
   'ramtons-2door-fridge', 'Ramtons 2-Door Fridge 213L',
   'Frost-free 213L double-door refrigerator with a large vegetable crisper. Energy efficient.',
   'published', jsonb_build_object('brand','Ramtons','capacity','213L','type','Double door'));

-- ─── Variants (stock + price live here) ─────────────────────────────────

insert into product_variants (business_id, product_id, sku, label, price_cents, compare_at_cents, stock, attributes, is_default) values
  -- Galaxy A55
  ('11111111-1111-1111-1111-111111111111', '33330000-0000-0000-0000-000000000001', 'SAM-A55-128', '128GB / 8GB · Awesome Navy', 5299900, 5699900, 24, jsonb_build_object('storage','128GB','ram','8GB','color','Navy'), true),
  ('11111111-1111-1111-1111-111111111111', '33330000-0000-0000-0000-000000000001', 'SAM-A55-256', '256GB / 8GB · Awesome Navy', 5999900, null,     12, jsonb_build_object('storage','256GB','ram','8GB','color','Navy'), false),
  -- iPhone 15
  ('11111111-1111-1111-1111-111111111111', '33330000-0000-0000-0000-000000000002', 'APL-IP15-128', '128GB · Blue',  11499900, null, 15, jsonb_build_object('storage','128GB','color','Blue'), true),
  ('11111111-1111-1111-1111-111111111111', '33330000-0000-0000-0000-000000000002', 'APL-IP15-256', '256GB · Blue',  12999900, null,  9, jsonb_build_object('storage','256GB','color','Blue'), false),
  -- Tecno Camon 30
  ('11111111-1111-1111-1111-111111111111', '33330000-0000-0000-0000-000000000003', 'TEC-C30-256', '256GB / 8GB', 2899900, 3199900, 40, jsonb_build_object('storage','256GB','ram','8GB'), true),
  -- Samsung 55" TV
  ('11111111-1111-1111-1111-111111111111', '33330000-0000-0000-0000-000000000004', 'SAM-TV55-CU', '55" Crystal UHD', 6299900, 6999900, 8, jsonb_build_object('size','55"'), true),
  -- LG 65" OLED
  ('11111111-1111-1111-1111-111111111111', '33330000-0000-0000-0000-000000000005', 'LG-OLED65-C4', '65" OLED evo C4', 18999900, null, 4, jsonb_build_object('size','65"'), true),
  -- MacBook Air M3
  ('11111111-1111-1111-1111-111111111111', '33330000-0000-0000-0000-000000000006', 'APL-MBA-M3-256', 'M3 · 8GB / 256GB · Midnight',  16499900, null, 10, jsonb_build_object('ram','8GB','storage','256GB','color','Midnight'), true),
  ('11111111-1111-1111-1111-111111111111', '33330000-0000-0000-0000-000000000006', 'APL-MBA-M3-512', 'M3 · 16GB / 512GB · Midnight', 21499900, null,  6, jsonb_build_object('ram','16GB','storage','512GB','color','Midnight'), false),
  -- HP Pavilion 15
  ('11111111-1111-1111-1111-111111111111', '33330000-0000-0000-0000-000000000007', 'HP-PAV15-I5', 'Core i5 · 8GB / 512GB', 7999900, 8499900, 14, jsonb_build_object('cpu','i5','ram','8GB','storage','512GB SSD'), true),
  -- Sony WH-1000XM5
  ('11111111-1111-1111-1111-111111111111', '33330000-0000-0000-0000-000000000008', 'SNY-XM5-BLK', 'Black',  4499900, null, 22, jsonb_build_object('color','Black'), true),
  ('11111111-1111-1111-1111-111111111111', '33330000-0000-0000-0000-000000000008', 'SNY-XM5-SLV', 'Silver', 4499900, null, 18, jsonb_build_object('color','Silver'), false),
  -- Anker charger
  ('11111111-1111-1111-1111-111111111111', '33330000-0000-0000-0000-000000000009', 'ANK-20W-C', '20W USB-C', 249900, 299900, 120, jsonb_build_object('output','20W'), true),
  -- Ramtons fridge
  ('11111111-1111-1111-1111-111111111111', '33330000-0000-0000-0000-000000000010', 'RAM-FR-213', '213L · Silver', 5499900, 5999900, 7, jsonb_build_object('capacity','213L','color','Silver'), true);
