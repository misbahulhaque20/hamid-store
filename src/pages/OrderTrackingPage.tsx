import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Check, Package, Truck, Clock, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import type { Order, OrderItem } from '@/lib/supabase'
import { formatCurrency, ORDER_STATUS_MAP, PAYMENT_STATUS_MAP, ORDER_STATUS_COLORS } from '@/lib/store'

const STATUS_FLOW = ['received', 'confirmed', 'processing', 'ready', 'completed']

export function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!orderId) return
    supabase.from('orders').select('*').eq('id', orderId).maybeSingle().then(({ data }) => {
      if (!data) setNotFound(true)
      setOrder(data)
    })
    supabase.from('order_items').select('*').eq('order_id', orderId).then(({ data }) => setItems(data || []))
  }, [orderId])

  if (notFound) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold">অর্ডার পাওয়া যায়নি</h1>
        <p className="text-muted-foreground">এই অর্ডারটি খুঁজে পাওয়া যায়নি।</p>
        <Button asChild><Link to="/account">আমার অর্ডার</Link></Button>
      </div>
    )
  }

  if (!order) return <div className="container mx-auto max-w-2xl px-4 py-20"><div className="h-64 rounded-lg bg-muted animate-pulse" /></div>

  const currentIndex = STATUS_FLOW.indexOf(order.order_status)
  const isCancelled = order.order_status === 'cancelled'

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Button variant="ghost" size="sm" asChild className="mb-4 text-muted-foreground">
        <Link to="/account"><ArrowLeft className="size-4 mr-1" />আমার অ্যাকাউন্ট</Link>
      </Button>

      <div className="text-center mb-8">
        <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">অর্ডারের অবস্থা</h1>
        <p className="text-muted-foreground mt-1">অর্ডার #{order.order_number}</p>
      </div>

      {/* Timeline */}
      <div className="rounded-lg border bg-card p-6 mb-6">
        {isCancelled ? (
          <div className="flex flex-col items-center text-center py-8">
            <div className="inline-flex size-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-3">
              <XCircle className="size-7 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="font-bold text-lg text-red-600 dark:text-red-400">অর্ডার বাতিল করা হয়েছে</h2>
            <p className="text-sm text-muted-foreground mt-1">এই অর্ডারটি বাতিল করা হয়েছে।</p>
          </div>
        ) : (
          <div className="space-y-0">
            {STATUS_FLOW.map((status, i) => {
              const isDone = i <= currentIndex
              const isCurrent = i === currentIndex
              const isLast = i === STATUS_FLOW.length - 1
              const icons = [Clock, Check, Package, Truck, CheckCircle2]
              const Icon = icons[i]
              return (
                <div key={status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`flex size-9 items-center justify-center rounded-full border-2 transition-colors ${isDone ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground'} ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                      {isDone ? <Check className="size-4" /> : <Icon className="size-4" />}
                    </div>
                    {!isLast && <div className={`w-0.5 h-12 ${i < currentIndex ? 'bg-primary' : 'bg-border'}`} />}
                  </div>
                  <div className="pt-1.5 pb-12">
                    <div className={`font-medium text-sm ${isDone ? 'text-foreground' : 'text-muted-foreground'}`}>{ORDER_STATUS_MAP[status]}</div>
                    {isCurrent && <div className="text-xs text-primary mt-0.5">বর্তমান অবস্থা</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Order details */}
      <div className="rounded-lg border bg-card p-6 space-y-5">
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
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={ORDER_STATUS_COLORS[order.order_status]}>{ORDER_STATUS_MAP[order.order_status]}</Badge>
            <Badge variant="outline">{PAYMENT_STATUS_MAP[order.payment_status]}</Badge>
          </div>
          <span className="font-bold">{formatCurrency(order.total)}</span>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <Button asChild variant="outline">
          <Link to="/books">আরও বই দেখুন</Link>
        </Button>
      </div>
    </div>
  )
}
