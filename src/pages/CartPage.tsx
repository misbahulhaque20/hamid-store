import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency, getBookPrice } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import type { BookPricingTier } from '@/lib/supabase'
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty'

export function CartPage() {
  const { items, removeItem, updateQuantity, count } = useCart()
  const navigate = useNavigate()
  const [tierMap, setTierMap] = useState<Record<string, BookPricingTier[]>>({})

  useEffect(() => {
    items.forEach(item => {
      if (item.book?.quantity_pricing_enabled && !tierMap[item.bookId]) {
        supabase.from('book_pricing_tiers').select('*').eq('book_id', item.bookId).order('min_quantity').then(({ data }) => {
          if (data) setTierMap(prev => ({ ...prev, [item.bookId]: data }))
        })
      }
    })
  }, [items])

  const subtotal = items.reduce((sum, item) => {
    if (item.format === 'ebook') return sum + (item.book?.ebook_free ? 0 : (item.book?.ebook_price || 0))
    const price = getBookPrice(item.book!, item.quantity, tierMap[item.bookId] || [])
    return sum + price * item.quantity
  }, 0)

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-20">
        <Empty>
          <EmptyMedia variant="icon"><ShoppingCart className="size-6" /></EmptyMedia>
          <EmptyTitle>আপনার কার্ট খালি</EmptyTitle>
          <EmptyDescription>এখনো কোনো বই কার্টে যোগ করেননি।</EmptyDescription>
          <Button asChild><Link to="/books">বই কিনুন</Link></Button>
        </Empty>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Button variant="ghost" size="sm" asChild className="mb-4 text-muted-foreground">
        <Link to="/books"><ArrowLeft className="size-4 mr-1" />আরও বই দেখুন</Link>
      </Button>

      <h1 className="scroll-m-20 text-2xl font-bold tracking-tight mb-6">কার্ট ({count})</h1>

      <div className="space-y-4">
        {items.map(item => {
          const unitPrice = item.format === 'ebook'
            ? (item.book?.ebook_free ? 0 : (item.book?.ebook_price || 0))
            : getBookPrice(item.book!, item.quantity, tierMap[item.bookId] || [])
          const itemTotal = unitPrice * (item.format === 'ebook' ? 1 : item.quantity)

          return (
            <div key={`${item.bookId}-${item.format}`} className="flex gap-4 rounded-lg border bg-card p-4">
              <div className="size-20 shrink-0 rounded-md overflow-hidden bg-muted">
                {item.book?.cover_url ? (
                  <img src={item.book.cover_url} alt="" className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center"><BookOpen className="size-6 text-muted-foreground" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <Link to={`/book/${item.book?.slug}`} className="font-medium hover:underline line-clamp-1">{item.book?.title}</Link>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{item.format === 'ebook' ? 'ই-বুক' : 'প্রিন্টেড'}</Badge>
                    <span className="text-xs text-muted-foreground">{formatCurrency(unitPrice)} / কপি</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {item.format === 'physical' ? (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon-sm" onClick={() => updateQuantity(item.bookId, item.format, item.quantity - 1)}>
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button variant="outline" size="icon-sm" onClick={() => updateQuantity(item.bookId, item.format, item.quantity + 1)}>
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  ) : <span className="text-xs text-muted-foreground">ডিজিটাল কপি</span>}
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm">{formatCurrency(itemTotal)}</span>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeItem(item.bookId, item.format)} className="text-destructive">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Separator className="my-6" />

      <div className="flex items-center justify-between mb-6">
        <span className="text-muted-foreground">সাবটোটাল</span>
        <span className="text-xl font-bold">{formatCurrency(subtotal)}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild variant="outline" className="flex-1">
          <Link to="/books">আরও কেনাকাটা</Link>
        </Button>
        <Button onClick={() => navigate('/checkout')} className="flex-1" size="lg">
          চেকআউটে যান
        </Button>
      </div>
    </div>
  )
}
