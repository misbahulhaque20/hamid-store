import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Customer-facing client — stores its session under a unique key
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'hamidstore-customer',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Admin-facing client — separate storage key means admin and customer
// sessions never interfere with each other even in the same browser.
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'hamidstore-admin',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

// For data queries (no auth context needed) — use the customer client
// Admin data queries also use this; RLS policies with `is_admin()` check
// the JWT role, which is set correctly from whichever client signed in.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Book {
  id: string
  title: string
  subtitle: string | null
  slug: string
  author: string
  short_description: string | null
  description: string | null
  cover_url: string | null
  additional_images: string[]
  category: string | null
  tags: string[]
  ranking: number
  is_featured: boolean
  is_bestseller: boolean
  is_new: boolean
  is_published: boolean
  physical_price: number
  ebook_price: number | null
  ebook_enabled: boolean
  ebook_free: boolean
  pdf_url: string | null
  stock: number
  sku: string | null
  isbn: string | null
  page_count: number | null
  edition: string | null
  publication_date: string | null
  seo_title: string | null
  seo_description: string | null
  quantity_pricing_enabled: boolean
  production_cost_enabled: boolean
  custom_price_enabled: boolean
  created_at: string
  updated_at: string
}

export interface BookPricingTier {
  id: string
  book_id: string
  min_quantity: number
  price: number
}

export interface BookPage {
  id: string
  book_id: string
  page_number: number
  image_url: string
}

export interface Customer {
  id: string
  auth_user_id: string | null
  name: string
  phone: string
  email: string | null
  created_at: string
}

export interface Address {
  id: string
  customer_id: string
  label: string
  name: string
  phone: string
  line1: string
  line2: string | null
  district: string
  is_default: boolean
}

export interface CartItem {
  id: string
  customer_id: string
  book_id: string
  quantity: number
  format: 'physical' | 'ebook'
  book?: Book
}

export interface Order {
  id: string
  order_number: string
  customer_id: string | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  delivery_method: 'home' | 'pickup'
  delivery_address: Json | null
  delivery_charge: number
  subtotal: number
  total: number
  is_gift: boolean
  payment_method: 'bkash' | 'nagad' | 'cod'
  payment_status: 'pending' | 'submitted' | 'verified' | 'cancelled'
  order_status: 'received' | 'confirmed' | 'processing' | 'ready' | 'completed' | 'cancelled'
  source: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  book_id: string | null
  book_title: string
  book_cover_url: string | null
  format: string
  quantity: number
  unit_price: number
  total_price: number
  is_gift: boolean
  custom_price: number | null
}

export interface SiteSettings {
  id: string
  store_name: string
  store_tagline: string | null
  logo_url: string | null
  favicon_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  text_color: string
  default_theme: string
  active_theme: string
  meta_title: string | null
  meta_description: string | null
}

export interface AuthorProfile {
  id: string
  name: string
  name_en: string | null
  photo_url: string | null
  short_bio: string | null
  full_bio: string | null
  phone: string | null
  email: string | null
  address: string | null
  facebook_url: string | null
  instagram_url: string | null
  youtube_url: string | null
  whatsapp: string | null
  other_links: { label: string; url: string }[]
}

export interface DeliverySettings {
  id: string
  dhaka_charge: number
  outside_dhaka_charge: number
  pickup_charge: number
  pickup_location: string | null
  pickup_instructions: string | null
  pickup_enabled: boolean
  home_delivery_enabled: boolean
}

export interface PaymentSettings {
  id: string
  bkash_enabled: boolean
  bkash_number: string
  bkash_instructions: string
  nagad_enabled: boolean
  nagad_number: string
  nagad_instructions: string
  cod_enabled: boolean
}

export interface LedgerEntry {
  id: string
  order_id: string | null
  customer_name: string
  total: number
  paid: number
  due: number
  payment_date: string | null
  note: string | null
  created_at: string
}

export interface EmailSettings {
  id: string
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_password: string
  from_email: string
  from_name: string
  enabled: boolean
}
