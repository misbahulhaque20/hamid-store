import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, ArrowRight, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import type { Order, OrderItem } from '@/lib/supabase'
import { formatCurrency, ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from '@/lib/store'

export function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])

  useEffect(() => {
    if (!orderId) return
    supabase.from('orders').select('*').eq('id', orderId).maybeSingle().then(({ data }) => setOrder(data))
    supabase.from('order_items').select('*').eq('order_id', orderId).then(({ data }) => setItems(data || []))
  }, [orderId])

  if (!order) return <div className="container mx-auto max-w-2xl px-4 py-20"><div className="h-64 rounded-lg bg-muted animate-pulse" /></div>

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <div className="text-center mb-8">
        <div className="inline-flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="scroll-m-20 text-2xl font-bold tracking-tight mb-2">আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।</h1>
        <p className="text-muted-foreground">অর্ডার নম্বর: <span className="font-mono font-bold text-foreground">{order.order_number}</span></p>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-5">
        <div className="space-y-3">
          <h2 className="font-semibold">অর্ডারের বিবরণ</h2>
          <Separator />
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 text-sm">
              {item.book_cover_url && <img src={item.book_cover_url} alt="" className="size-12 rounded border object-cover" />}
              <div className="flex-1">
                <div className="font-medium">{item.book_title}</div>
                <div className="text-xs text-muted-foreground">{item.format} × {item.quantity}</div>
              </div>
              <div className="font-medium">{formatCurrency(item.total_price)}</div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <InfoRow label="ডেলিভারি পদ্ধতি" value={order.delivery_method === 'home' ? 'হোম ডেলিভারি' : 'পিকআপ'} />
          <InfoRow label="পেমেন্ট পদ্ধতি" value={order.payment_method === 'bkash' ? 'bKash' : order.payment_method === 'nagad' ? 'Nagad' : 'ক্যাশ অন ডেলিভারি'} />
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">অর্ডারের অবস্থা</span>
            <Badge variant="outline">{ORDER_STATUS_MAP[order.order_status]}</Badge>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">পেমেন্ট অবস্থা</span>
            <Badge variant="outline">{PAYMENT_STATUS_MAP[order.payment_status]}</Badge>
          </div>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">সাবটোটাল</span><span>{formatCurrency(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">ডেলিভারি চার্জ</span><span>{formatCurrency(order.delivery_charge)}</span></div>
          <div className="flex justify-between font-bold text-lg"><span>সর্বমোট</span><span>{formatCurrency(order.total)}</span></div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button asChild className="flex-1">
          <Link to={`/track-order/${order.id}`}><Package className="size-4" />অর্ডারের অবস্থা দেখুন</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link to="/books">আরও বই দেখুন <ArrowRight className="size-4" /></Link>
        </Button>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
