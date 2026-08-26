/*
# Hamid Store – Security Fixes, Admin Role Separation & Storage Buckets

## Purpose
Fix critical security issues:
1. Any authenticated user (customer) could write to admin tables (books, orders, settings, etc.)
2. Customer login gave admin access — no role separation existed
3. No storage buckets for image/PDF uploads

## Changes

### 1. Admin role identification
- Uses `raw_app_meta_data ->> 'role'` to identify admin users
- Admin users must have `role = 'admin'` in their JWT app metadata
- This is set by the project owner via Supabase dashboard or SQL

### 2. RLS policy fixes — admin-only write tables
All admin tables now require `is_admin()` check for writes:
- site_settings, author_profile, books, book_pricing_tiers, book_pages
- delivery_settings, payment_settings, telegram_settings
- production_costs, ledger_entries, payments
- orders (update), order_items (update)

### 3. Storage buckets
- `book-covers` — public bucket for book cover images
- `book-pages` — public bucket for page preview images
- `author-photos` — public bucket for author/store photos
- `ebooks` — private bucket for PDF files (authenticated read)

### 4. Order policies
- Customers can only read their own orders (via customer.auth_user_id = auth.uid())
- Anon can still insert orders (checkout flow)
- Only admin can update order status/payment

## Security
- Admin writes require `is_admin()` function checking JWT metadata
- Customer reads limited to own data
- Public reads preserved for books, settings, author profile
*/

-- ============================================================
-- Helper function: is_admin()
-- Checks if the current user has role='admin' in JWT app metadata
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

-- ============================================================
-- Fix BOOKS policies — admin-only writes
-- ============================================================
DROP POLICY IF EXISTS "anon_read_books" ON books;
DROP POLICY IF EXISTS "auth_all_books" ON books;

CREATE POLICY "anon_read_books" ON books FOR SELECT
  TO anon, authenticated USING (is_published = true);

CREATE POLICY "admin_all_books" ON books FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- Fix BOOK PRICING TIERS — admin-only writes
-- ============================================================
DROP POLICY IF EXISTS "anon_read_pricing_tiers" ON book_pricing_tiers;
DROP POLICY IF EXISTS "auth_all_pricing_tiers" ON book_pricing_tiers;

CREATE POLICY "anon_read_pricing_tiers" ON book_pricing_tiers FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "admin_all_pricing_tiers" ON book_pricing_tiers FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- Fix BOOK PAGES — admin-only writes
-- ============================================================
DROP POLICY IF EXISTS "anon_read_book_pages" ON book_pages;
DROP POLICY IF EXISTS "auth_all_book_pages" ON book_pages;

CREATE POLICY "anon_read_book_pages" ON book_pages FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "admin_all_book_pages" ON book_pages FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- Fix SITE SETTINGS — admin-only writes
-- ============================================================
DROP POLICY IF EXISTS "anon_read_site_settings" ON site_settings;
DROP POLICY IF EXISTS "auth_update_site_settings" ON site_settings;
DROP POLICY IF EXISTS "auth_insert_site_settings" ON site_settings;

CREATE POLICY "anon_read_site_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "admin_all_site_settings" ON site_settings FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- Fix AUTHOR PROFILE — admin-only writes
-- ============================================================
DROP POLICY IF EXISTS "anon_read_author_profile" ON author_profile;
DROP POLICY IF EXISTS "auth_update_author_profile" ON author_profile;
DROP POLICY IF EXISTS "auth_insert_author_profile" ON author_profile;

CREATE POLICY "anon_read_author_profile" ON author_profile FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "admin_all_author_profile" ON author_profile FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- Fix DELIVERY SETTINGS — admin-only writes
-- ============================================================
DROP POLICY IF EXISTS "anon_read_delivery" ON delivery_settings;
DROP POLICY IF EXISTS "auth_all_delivery" ON delivery_settings;

CREATE POLICY "anon_read_delivery" ON delivery_settings FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "admin_all_delivery" ON delivery_settings FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- Fix PAYMENT SETTINGS — admin-only writes
-- ============================================================
DROP POLICY IF EXISTS "anon_read_payment_settings" ON payment_settings;
DROP POLICY IF EXISTS "auth_all_payment_settings" ON payment_settings;

CREATE POLICY "anon_read_payment_settings" ON payment_settings FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "admin_all_payment_settings" ON payment_settings FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- Fix TELEGRAM SETTINGS — admin-only
-- ============================================================
DROP POLICY IF EXISTS "auth_all_telegram" ON telegram_settings;

CREATE POLICY "admin_all_telegram" ON telegram_settings FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Allow admin to read telegram settings (anon cannot)
CREATE POLICY "admin_read_telegram" ON telegram_settings FOR SELECT
  TO authenticated USING (public.is_admin());

-- ============================================================
-- Fix PRODUCTION COSTS — admin-only
-- ============================================================
DROP POLICY IF EXISTS "auth_all_production_costs" ON production_costs;

CREATE POLICY "admin_all_production_costs" ON production_costs FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- Fix LEDGER ENTRIES — admin-only
-- ============================================================
DROP POLICY IF EXISTS "auth_all_ledger" ON ledger_entries;

CREATE POLICY "admin_all_ledger" ON ledger_entries FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- Fix PAYMENTS — admin-only update, anon insert for checkout
-- ============================================================
DROP POLICY IF EXISTS "anon_insert_payment" ON payments;
DROP POLICY IF EXISTS "auth_read_payments" ON payments;
DROP POLICY IF EXISTS "auth_update_payments" ON payments;

CREATE POLICY "anon_insert_payment" ON payments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_read_payments" ON payments FOR SELECT
  TO authenticated USING (public.is_admin());

CREATE POLICY "admin_update_payments" ON payments FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- Fix ORDERS — customer reads own, admin reads all, admin updates
-- ============================================================
DROP POLICY IF EXISTS "customer_read_own_orders" ON orders;
DROP POLICY IF EXISTS "customer_insert_order" ON orders;
DROP POLICY IF EXISTS "customer_update_own_order" ON orders;

-- Customers can read their own orders (linked via customers table)
CREATE POLICY "customer_read_own_orders" ON orders FOR SELECT
  TO authenticated
  USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
    OR public.is_admin()
  );

-- Anon + authenticated can insert orders (checkout flow)
CREATE POLICY "anon_insert_order" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Only admin can update order status/payment
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- Fix ORDER ITEMS — anon insert for checkout, admin read
-- ============================================================
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
DROP POLICY IF EXISTS "read_order_items" ON order_items;

CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Customers can read items for their own orders, admin can read all
CREATE POLICY "read_order_items" ON order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      WHERE o.customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
    )
    OR public.is_admin()
  );

-- ============================================================
-- Fix CUSTOMERS — remove admin read all (was too permissive)
-- ============================================================
DROP POLICY IF EXISTS "admin_read_all_customers" ON customers;

-- Admin can read all customers
CREATE POLICY "admin_read_customers" ON customers FOR SELECT
  TO authenticated USING (public.is_admin());

-- Admin can update customer info
CREATE POLICY "admin_update_customers" ON customers FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- Add missing customer DELETE policy
-- ============================================================
DROP POLICY IF EXISTS "customer_delete_own" ON customers;
CREATE POLICY "customer_delete_own" ON customers FOR DELETE
  TO authenticated USING (auth.uid() = auth_user_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('book-pages', 'book-pages', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('author-photos', 'author-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ebooks', 'ebooks', false) ON CONFLICT DO NOTHING;

-- Storage policies: public read for public buckets, admin write
-- Book covers
DROP POLICY IF EXISTS "anon_read_book_covers" ON storage.objects;
CREATE POLICY "anon_read_book_covers" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'book-covers');

DROP POLICY IF EXISTS "admin_write_book_covers" ON storage.objects;
CREATE POLICY "admin_write_book_covers" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'book-covers' AND public.is_admin());

DROP POLICY IF EXISTS "admin_update_book_covers" ON storage.objects;
CREATE POLICY "admin_update_book_covers" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'book-covers' AND public.is_admin());

DROP POLICY IF EXISTS "admin_delete_book_covers" ON storage.objects;
CREATE POLICY "admin_delete_book_covers" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'book-covers' AND public.is_admin());

-- Book pages
DROP POLICY IF EXISTS "anon_read_book_pages_storage" ON storage.objects;
CREATE POLICY "anon_read_book_pages_storage" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'book-pages');

DROP POLICY IF EXISTS "admin_write_book_pages_storage" ON storage.objects;
CREATE POLICY "admin_write_book_pages_storage" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'book-pages' AND public.is_admin());

DROP POLICY IF EXISTS "admin_delete_book_pages_storage" ON storage.objects;
CREATE POLICY "admin_delete_book_pages_storage" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'book-pages' AND public.is_admin());

-- Author photos
DROP POLICY IF EXISTS "anon_read_author_photos" ON storage.objects;
CREATE POLICY "anon_read_author_photos" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'author-photos');

DROP POLICY IF EXISTS "admin_write_author_photos" ON storage.objects;
CREATE POLICY "admin_write_author_photos" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'author-photos' AND public.is_admin());

DROP POLICY IF EXISTS "admin_update_author_photos" ON storage.objects;
CREATE POLICY "admin_update_author_photos" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'author-photos' AND public.is_admin());

-- eBooks (private — authenticated read, admin write)
DROP POLICY IF EXISTS "auth_read_ebooks" ON storage.objects;
CREATE POLICY "auth_read_ebooks" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'ebooks');

DROP POLICY IF EXISTS "admin_write_ebooks" ON storage.objects;
CREATE POLICY "admin_write_ebooks" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'ebooks' AND public.is_admin());

DROP POLICY IF EXISTS "admin_delete_ebooks" ON storage.objects;
CREATE POLICY "admin_delete_ebooks" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'ebooks' AND public.is_admin());
