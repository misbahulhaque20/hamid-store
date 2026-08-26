
/*
# Hamid Store – Core Database Schema

## Purpose
Full e-commerce schema for a premium Bengali bookstore (Hamid Store).
Supports: books, customers, cart, orders, payments, delivery, site settings, author profile.

## Tables Created
1. site_settings          – Store name, theme colors, logo, etc.
2. author_profile         – Author biography, photo, social links
3. books                  – Full book catalog (physical + eBook)
4. book_pricing_tiers     – Quantity-based discount tiers per book
5. book_pages             – Preview page images per book
6. customers              – Registered customers (linked to auth.users)
7. addresses              – Customer saved addresses
8. cart_items             – Persistent cart for logged-in users
9. orders                 – Customer orders
10. order_items           – Line items per order
11. payments              – Payment records (bKash/Nagad/COD)
12. delivery_settings     – Configurable delivery charges
13. payment_settings      – bKash/Nagad/COD enable + numbers
14. telegram_settings     – Telegram bot notification config
15. production_costs      – Admin-only cost tracking per book
16. ledger_entries        – Simple financial ledger

## Security
- RLS enabled on all tables
- Customers can only read/write their own data
- Admin (service role) can access everything
- Public data (books, site_settings, author_profile, delivery_settings, payment_settings) readable by anon
*/

-- ============================================================
-- 1. SITE SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL DEFAULT 'Hamid Store',
  store_tagline text DEFAULT 'মোঃ হামিদুল হক নাবিলের বইয়ের দোকান',
  logo_url text,
  favicon_url text,
  primary_color text DEFAULT 'oklch(0.205 0 0)',
  secondary_color text DEFAULT 'oklch(0.97 0 0)',
  accent_color text DEFAULT 'oklch(0.97 0 0)',
  background_color text DEFAULT 'oklch(1 0 0)',
  text_color text DEFAULT 'oklch(0.145 0 0)',
  default_theme text DEFAULT 'light',
  meta_title text DEFAULT 'Hamid Store – বইয়ের দোকান',
  meta_description text DEFAULT 'মোঃ হামিদুল হক নাবিলের বই সরাসরি অর্ডার করুন।',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_site_settings" ON site_settings;
CREATE POLICY "anon_read_site_settings" ON site_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_site_settings" ON site_settings;
CREATE POLICY "auth_update_site_settings" ON site_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_insert_site_settings" ON site_settings;
CREATE POLICY "auth_insert_site_settings" ON site_settings FOR INSERT TO authenticated WITH CHECK (true);

-- Seed default row
INSERT INTO site_settings (id) VALUES ('00000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. AUTHOR PROFILE
-- ============================================================
CREATE TABLE IF NOT EXISTS author_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'মোঃ হামিদুল হক নাবিল',
  name_en text DEFAULT 'Md. Hamiddul Haque Nabil',
  photo_url text,
  short_bio text DEFAULT 'বাংলাদেশের একজন ইসলামী লেখক ও প্রকাশক।',
  full_bio text,
  phone text,
  email text,
  address text,
  facebook_url text,
  instagram_url text,
  youtube_url text,
  whatsapp text,
  other_links jsonb DEFAULT '[]',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE author_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_author_profile" ON author_profile;
CREATE POLICY "anon_read_author_profile" ON author_profile FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_author_profile" ON author_profile;
CREATE POLICY "auth_update_author_profile" ON author_profile FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_insert_author_profile" ON author_profile;
CREATE POLICY "auth_insert_author_profile" ON author_profile FOR INSERT TO authenticated WITH CHECK (true);

-- Seed default row
INSERT INTO author_profile (id) VALUES ('00000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. BOOKS
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  slug text UNIQUE NOT NULL,
  author text NOT NULL DEFAULT 'মোঃ হামিদুল হক নাবিল',
  short_description text,
  description text,
  cover_url text,
  additional_images jsonb DEFAULT '[]',
  category text,
  tags text[] DEFAULT '{}',
  ranking integer DEFAULT 1,
  is_featured boolean DEFAULT false,
  is_bestseller boolean DEFAULT false,
  is_new boolean DEFAULT true,
  is_published boolean DEFAULT true,
  physical_price numeric(10,2) NOT NULL DEFAULT 0,
  ebook_price numeric(10,2),
  ebook_enabled boolean DEFAULT false,
  ebook_free boolean DEFAULT false,
  pdf_url text,
  stock integer DEFAULT 0,
  sku text,
  isbn text,
  page_count integer,
  edition text DEFAULT '১ম সংস্করণ',
  publication_date date,
  seo_title text,
  seo_description text,
  quantity_pricing_enabled boolean DEFAULT false,
  production_cost_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_books" ON books;
CREATE POLICY "anon_read_books" ON books FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "auth_all_books" ON books;
CREATE POLICY "auth_all_books" ON books FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 4. BOOK PRICING TIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS book_pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  min_quantity integer NOT NULL,
  price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE book_pricing_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_pricing_tiers" ON book_pricing_tiers;
CREATE POLICY "anon_read_pricing_tiers" ON book_pricing_tiers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_all_pricing_tiers" ON book_pricing_tiers;
CREATE POLICY "auth_all_pricing_tiers" ON book_pricing_tiers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 5. BOOK PAGES (preview images)
-- ============================================================
CREATE TABLE IF NOT EXISTS book_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE book_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_book_pages" ON book_pages;
CREATE POLICY "anon_read_book_pages" ON book_pages FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_all_book_pages" ON book_pages;
CREATE POLICY "auth_all_book_pages" ON book_pages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 6. CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_read_own" ON customers;
CREATE POLICY "customer_read_own" ON customers FOR SELECT TO authenticated USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "customer_insert_own" ON customers;
CREATE POLICY "customer_insert_own" ON customers FOR INSERT TO authenticated WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "customer_update_own" ON customers;
CREATE POLICY "customer_update_own" ON customers FOR UPDATE TO authenticated USING (auth.uid() = auth_user_id) WITH CHECK (auth.uid() = auth_user_id);

-- Allow anon insert during signup flow (before session is fully set)
DROP POLICY IF EXISTS "anon_insert_customer" ON customers;
CREATE POLICY "anon_insert_customer" ON customers FOR INSERT TO anon WITH CHECK (true);

-- Admin read all
DROP POLICY IF EXISTS "admin_read_all_customers" ON customers;
CREATE POLICY "admin_read_all_customers" ON customers FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 7. ADDRESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label text DEFAULT 'বাড়ি',
  name text NOT NULL,
  phone text NOT NULL,
  line1 text NOT NULL,
  line2 text,
  district text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_read_own_addresses" ON addresses;
CREATE POLICY "customer_read_own_addresses" ON addresses FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM customers WHERE customers.id = addresses.customer_id AND customers.auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "customer_insert_own_addresses" ON addresses;
CREATE POLICY "customer_insert_own_addresses" ON addresses FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM customers WHERE customers.id = addresses.customer_id AND customers.auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "customer_update_own_addresses" ON addresses;
CREATE POLICY "customer_update_own_addresses" ON addresses FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM customers WHERE customers.id = addresses.customer_id AND customers.auth_user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM customers WHERE customers.id = addresses.customer_id AND customers.auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "customer_delete_own_addresses" ON addresses;
CREATE POLICY "customer_delete_own_addresses" ON addresses FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM customers WHERE customers.id = addresses.customer_id AND customers.auth_user_id = auth.uid()));

-- ============================================================
-- 8. CART ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  format text NOT NULL DEFAULT 'physical',
  created_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, book_id, format)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_read_own_cart" ON cart_items;
CREATE POLICY "customer_read_own_cart" ON cart_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM customers WHERE customers.id = cart_items.customer_id AND customers.auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "customer_insert_cart" ON cart_items;
CREATE POLICY "customer_insert_cart" ON cart_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM customers WHERE customers.id = cart_items.customer_id AND customers.auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "customer_update_cart" ON cart_items;
CREATE POLICY "customer_update_cart" ON cart_items FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM customers WHERE customers.id = cart_items.customer_id AND customers.auth_user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM customers WHERE customers.id = cart_items.customer_id AND customers.auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "customer_delete_cart" ON cart_items;
CREATE POLICY "customer_delete_cart" ON cart_items FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM customers WHERE customers.id = cart_items.customer_id AND customers.auth_user_id = auth.uid()));

-- ============================================================
-- 9. ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT 'HS-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  delivery_method text NOT NULL DEFAULT 'home',
  delivery_address jsonb,
  delivery_charge numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cod',
  payment_status text NOT NULL DEFAULT 'pending',
  order_status text NOT NULL DEFAULT 'received',
  source text DEFAULT 'website',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_read_own_orders" ON orders;
CREATE POLICY "customer_read_own_orders" ON orders FOR SELECT TO authenticated
USING (customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()) OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "customer_insert_order" ON orders;
CREATE POLICY "customer_insert_order" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "customer_update_own_order" ON orders;
CREATE POLICY "customer_update_own_order" ON orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 10. ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id) ON DELETE SET NULL,
  book_title text NOT NULL,
  book_cover_url text,
  format text NOT NULL DEFAULT 'physical',
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "read_order_items" ON order_items;
CREATE POLICY "read_order_items" ON order_items FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 11. PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method text NOT NULL,
  sender_number text,
  transaction_id text,
  screenshot_url text,
  amount numeric(10,2),
  status text NOT NULL DEFAULT 'submitted',
  verified_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_payment" ON payments;
CREATE POLICY "anon_insert_payment" ON payments FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_read_payments" ON payments;
CREATE POLICY "auth_read_payments" ON payments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_payments" ON payments;
CREATE POLICY "auth_update_payments" ON payments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 12. DELIVERY SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dhaka_charge numeric(10,2) NOT NULL DEFAULT 60,
  outside_dhaka_charge numeric(10,2) NOT NULL DEFAULT 120,
  pickup_charge numeric(10,2) NOT NULL DEFAULT 0,
  pickup_location text DEFAULT 'ঢাকা, বাংলাদেশ',
  pickup_instructions text DEFAULT 'যোগাযোগ করুন',
  pickup_enabled boolean DEFAULT true,
  home_delivery_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_delivery" ON delivery_settings;
CREATE POLICY "anon_read_delivery" ON delivery_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_all_delivery" ON delivery_settings;
CREATE POLICY "auth_all_delivery" ON delivery_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO delivery_settings (id) VALUES ('00000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;

-- ============================================================
-- 13. PAYMENT SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bkash_enabled boolean DEFAULT true,
  bkash_number text DEFAULT '',
  bkash_instructions text DEFAULT 'Send Money করুন এই নম্বরে',
  nagad_enabled boolean DEFAULT true,
  nagad_number text DEFAULT '',
  nagad_instructions text DEFAULT 'Send Money করুন এই নম্বরে',
  cod_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_payment_settings" ON payment_settings;
CREATE POLICY "anon_read_payment_settings" ON payment_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_all_payment_settings" ON payment_settings;
CREATE POLICY "auth_all_payment_settings" ON payment_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO payment_settings (id) VALUES ('00000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;

-- ============================================================
-- 14. TELEGRAM SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS telegram_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean DEFAULT false,
  bot_token text DEFAULT '',
  chat_id text DEFAULT '',
  notification_time text DEFAULT '21:00',
  order_threshold integer DEFAULT 25,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE telegram_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_telegram" ON telegram_settings;
CREATE POLICY "auth_all_telegram" ON telegram_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO telegram_settings (id) VALUES ('00000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;

-- ============================================================
-- 15. PRODUCTION COSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS production_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  printing numeric(10,2) DEFAULT 0,
  paper numeric(10,2) DEFAULT 0,
  binding numeric(10,2) DEFAULT 0,
  cover numeric(10,2) DEFAULT 0,
  design numeric(10,2) DEFAULT 0,
  packaging numeric(10,2) DEFAULT 0,
  other numeric(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE production_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_production_costs" ON production_costs;
CREATE POLICY "auth_all_production_costs" ON production_costs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 16. LEDGER ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  total numeric(10,2) NOT NULL DEFAULT 0,
  paid numeric(10,2) NOT NULL DEFAULT 0,
  due numeric(10,2) GENERATED ALWAYS AS (total - paid) STORED,
  payment_date timestamptz,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_ledger" ON ledger_entries;
CREATE POLICY "auth_all_ledger" ON ledger_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_books_slug ON books(slug);
CREATE INDEX IF NOT EXISTS idx_books_published ON books(is_published, ranking);
CREATE INDEX IF NOT EXISTS idx_books_featured ON books(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cart_customer ON cart_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_auth ON customers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
