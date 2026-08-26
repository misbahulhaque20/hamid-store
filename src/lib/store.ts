import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { SiteSettings, AuthorProfile, DeliverySettings, PaymentSettings } from '@/lib/supabase'

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('site_settings').select('*').maybeSingle().then(({ data }) => {
      setSettings(data)
      setLoading(false)
    })
  }, [])

  return { settings, loading }
}

export function useAuthorProfile() {
  const [profile, setProfile] = useState<AuthorProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('author_profile').select('*').maybeSingle().then(({ data }) => {
      setProfile(data)
      setLoading(false)
    })
  }, [])

  return { profile, loading }
}

export function useDeliverySettings() {
  const [settings, setSettings] = useState<DeliverySettings | null>(null)
  useEffect(() => {
    supabase.from('delivery_settings').select('*').maybeSingle().then(({ data }) => setSettings(data))
  }, [])
  return settings
}

export function usePaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  useEffect(() => {
    supabase.from('payment_settings').select('*').maybeSingle().then(({ data }) => setSettings(data))
  }, [])
  return settings
}

export function getBookPrice(book: { physical_price: number; quantity_pricing_enabled: boolean }, quantity: number, tiers: { min_quantity: number; price: number }[]): number {
  if (!book.quantity_pricing_enabled || !tiers.length) return book.physical_price
  const applicable = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity)
  for (const tier of applicable) {
    if (quantity >= tier.min_quantity) return tier.price
  }
  return book.physical_price
}

export function formatCurrency(amount: number): string {
  return '৳' + amount.toLocaleString('bn-BD')
}

export const ORDER_STATUS_MAP: Record<string, string> = {
  received: 'অর্ডার পাওয়া গেছে',
  confirmed: 'নিশ্চিত করা হয়েছে',
  processing: 'প্রসেসিং',
  ready: 'ডেলিভারির জন্য প্রস্তুত',
  completed: 'সম্পন্ন',
  cancelled: 'বাতিল',
}

export const PAYMENT_STATUS_MAP: Record<string, string> = {
  pending: 'অপেক্ষমাণ',
  submitted: 'জমা দেওয়া হয়েছে',
  verified: 'যাচাই হয়েছে',
  cancelled: 'বাতিল',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  received: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  confirmed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  ready: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}
