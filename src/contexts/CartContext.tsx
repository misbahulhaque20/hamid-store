import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Book } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface LocalCartItem {
  bookId: string
  quantity: number
  format: 'physical' | 'ebook'
  book?: Book
}

interface CartContextValue {
  items: LocalCartItem[]
  count: number
  addItem: (bookId: string, quantity: number, format: 'physical' | 'ebook', book: Book) => Promise<void>
  removeItem: (bookId: string, format: 'physical' | 'ebook') => Promise<void>
  updateQuantity: (bookId: string, format: 'physical' | 'ebook', qty: number) => Promise<void>
  clearCart: () => Promise<void>
  loading: boolean
}

const CartContext = createContext<CartContextValue | null>(null)

const CART_KEY = 'hamidstore_cart'

function getLocalCart(): LocalCartItem[] {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]')
  } catch {
    return []
  }
}

function saveLocalCart(items: LocalCartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { customer } = useAuth()
  const [items, setItems] = useState<LocalCartItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (customer) {
      syncFromDB()
    } else {
      setItems(getLocalCart())
    }
  }, [customer])

  const syncFromDB = async () => {
    if (!customer) return
    setLoading(true)
    const { data } = await supabase
      .from('cart_items')
      .select('*, book:books(*)')
      .eq('customer_id', customer.id)
    if (data) {
      setItems(data.map(d => ({ bookId: d.book_id, quantity: d.quantity, format: d.format as 'physical' | 'ebook', book: d.book })))
    }
    setLoading(false)
  }

  const addItem = async (bookId: string, quantity: number, format: 'physical' | 'ebook', book: Book) => {
    const existing = items.find(i => i.bookId === bookId && i.format === format)
    const updated = existing
      ? items.map(i => i.bookId === bookId && i.format === format ? { ...i, quantity: i.quantity + quantity } : i)
      : [...items, { bookId, quantity, format, book }]
    setItems(updated)
    if (customer) {
      await supabase.from('cart_items').upsert({
        customer_id: customer.id,
        book_id: bookId,
        quantity: (existing?.quantity || 0) + quantity,
        format,
      }, { onConflict: 'customer_id,book_id,format' })
    } else {
      saveLocalCart(updated)
    }
  }

  const removeItem = async (bookId: string, format: 'physical' | 'ebook') => {
    const updated = items.filter(i => !(i.bookId === bookId && i.format === format))
    setItems(updated)
    if (customer) {
      await supabase.from('cart_items')
        .delete()
        .eq('customer_id', customer.id)
        .eq('book_id', bookId)
        .eq('format', format)
    } else {
      saveLocalCart(updated)
    }
  }

  const updateQuantity = async (bookId: string, format: 'physical' | 'ebook', qty: number) => {
    if (qty < 1) { await removeItem(bookId, format); return }
    const updated = items.map(i => i.bookId === bookId && i.format === format ? { ...i, quantity: qty } : i)
    setItems(updated)
    if (customer) {
      await supabase.from('cart_items')
        .update({ quantity: qty })
        .eq('customer_id', customer.id)
        .eq('book_id', bookId)
        .eq('format', format)
    } else {
      saveLocalCart(updated)
    }
  }

  const clearCart = async () => {
    setItems([])
    if (customer) {
      await supabase.from('cart_items').delete().eq('customer_id', customer.id)
    } else {
      saveLocalCart([])
    }
  }

  return (
    <CartContext.Provider value={{ items, count: items.reduce((s, i) => s + i.quantity, 0), addItem, removeItem, updateQuantity, clearCart, loading }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
