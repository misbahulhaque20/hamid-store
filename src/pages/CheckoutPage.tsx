import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Copy, Truck, Package, Check, ShieldCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { DeliverySettings, PaymentSettings, BookPricingTier } from '@/lib/supabase'
import { formatCurrency, getBookPrice } from '@/lib/store'
import { toast } from 'sonner'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, clearCart } = useCart()
  const { user, customer } = useAuth()
  const [delivery, setDelivery] = useState<DeliverySettings | null>(null)
  const [payment, setPayment] = useState<PaymentSettings | null>(null)
  const [tierMap, setTierMap] = useState<Record<string, BookPricingTier[]>>({})

  const [name, setName] = useState(customer?.name || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [email, setEmail] = useState(customer?.email || '')
  const [deliveryMethod, setDeliveryMethod] = useState<'home' | 'pickup'>('home')
  const [deliveryArea, setDeliveryArea] = useState<'dhaka' | 'outside'>('dhaka')
  const [address, setAddress] = useState('')
  const [district, setDistrict] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'cod'>('cod')
  const [senderNumber, setSenderNumber] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.from('delivery_settings').select('*').maybeSingle().then(({ data }) => setDelivery(data))
    supabase.from('payment_settings').select('*').maybeSingle().then(({ data }) => {
      setPayment(data)
      if (data?.cod_enabled) setPaymentMethod('cod')
      else if (data?.bkash_enabled) setPaymentMethod('bkash')
      else if (data?.nagad_enabled) setPaymentMethod('nagad')
    })
    items.forEach(item => {
      if (item.book?.quantity_pricing_enabled && !tierMap[item.bookId]) {
        supabase.from('book_pricing_tiers').select('*').eq('book_id', item.bookId).order('min_quantity').then(({ data }) => {
          if (data) setTierMap(prev => ({ ...prev, [item.bookId]: data }))
        })
      }
    })
  }, [items])

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  const subtotal = items.reduce((sum, item) => {
    if (item.format === 'ebook') return sum + (item.book?.ebook_free ? 0 : (item.book?.ebook_price || 0))
    const price = getBookPrice(item.book!, item.quantity, tierMap[item.bookId] || [])
    return sum + price * item.quantity
  }, 0)

  const deliveryCharge = deliveryMethod === 'pickup'
    ? (delivery?.pickup_charge || 0)
    : deliveryArea === 'dhaka'
      ? (delivery?.dhaka_charge || 0)
      : (delivery?.outside_dhaka_charge || 0)

  const total = subtotal + deliveryCharge

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num)
    toast.success('নম্বর কপি হয়েছে')
  }

  const handleSubmit = async () => {
    if (!name || !phone) { toast.error('নাম ও ফোন নম্বর দিন'); return }
    if (deliveryMethod === 'home' && (!address || !district)) { toast.error('ঠিকানা দিন'); return }
    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && (!senderNumber || !transactionId)) {
      toast.error('পেমেন্ট তথ্য দিন'); return
    }

    setSubmitting(true)
    const deliveryAddress = deliveryMethod === 'home' ? { address, district, area: deliveryArea } : null

    const { data: order, error } = await supabase.from('orders').insert({
      customer_id: customer?.id || null,
      customer_name: name,
      customer_phone: phone,
      customer_email: email || null,
      delivery_method: deliveryMethod,
      delivery_address: deliveryAddress,
      delivery_charge: deliveryCharge,
      subtotal,
      total,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'cod' ? 'pending' : 'submitted',
      order_status: 'received',
      source: 'website',
    }).select().single()

    if (error || !order) {
      toast.error('অর্ডার করতে সমস্যা হয়েছে')
      setSubmitting(false)
      return
    }

    // Insert order items
    const orderItems = items.map(item => {
      const unitPrice = item.format === 'ebook'
        ? (item.book?.ebook_free ? 0 : (item.book?.ebook_price || 0))
        : getBookPrice(item.book!, item.quantity, tierMap[item.bookId] || [])
      return {
        order_id: order.id,
        book_id: item.bookId,
        book_title: item.book?.title || 'বই',
        book_cover_url: item.book?.cover_url || null,
        format: item.format,
        quantity: item.format === 'ebook' ? 1 : item.quantity,
        unit_price: unitPrice,
        total_price: unitPrice * (item.format === 'ebook' ? 1 : item.quantity),
      }
    })

    await supabase.from('order_items').insert(orderItems)

    // Insert payment record for bKash/Nagad
    if (paymentMethod !== 'cod') {
      await supabase.from('payments').insert({
        order_id: order.id,
        method: paymentMethod,
        sender_number: senderNumber,
        transaction_id: transactionId,
        amount: total,
        status: 'submitted',
      })
    }

    // Ledger entry
    await supabase.from('ledger_entries').insert({
      order_id: order.id,
      customer_name: name,
      total,
      paid: paymentMethod === 'cod' ? 0 : total,
      payment_date: paymentMethod === 'cod' ? null : new Date().toISOString(),
    })

    // Decrement stock for physical books
    for (const item of items) {
      if (item.format === 'physical' && item.book) {
        const newStock = Math.max(0, item.book.stock - item.quantity)
        await supabase.from('books').update({ stock: newStock }).eq('id', item.bookId)
      }
    }

    await clearCart()
    setSubmitting(false)
    navigate(`/order-confirmation/${order.id}`)
  }

  const activePaymentNumber = paymentMethod === 'bkash' ? payment?.bkash_number : payment?.nagad_number
  const activePaymentInstructions = paymentMethod === 'bkash' ? payment?.bkash_instructions : payment?.nagad_instructions

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Button variant="ghost" size="sm" asChild className="mb-4 text-muted-foreground">
        <Link to="/cart"><ArrowLeft className="size-4 mr-1" />কার্টে ফিরুন</Link>
      </Button>

      <h1 className="scroll-m-20 text-2xl font-bold tracking-tight mb-8">চেকআউট</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Customer info */}
          <section className="space-y-4">
            <h2 className="font-semibold">গ্রাহকের তথ্য</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">নাম *</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">ফোন নম্বর *</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল (ঐচ্ছিক)</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </section>

          <Separator />

          {/* Delivery method */}
          <section className="space-y-4">
            <h2 className="font-semibold">ডেলিভারি পদ্ধতি</h2>
            <RadioGroup value={deliveryMethod} onValueChange={v => setDeliveryMethod(v as 'home' | 'pickup')}>
              <div className="space-y-2">
                {delivery?.home_delivery_enabled && (
                  <label className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${deliveryMethod === 'home' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}>
                    <RadioGroupItem value="home" />
                    <Truck className="size-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">হোম ডেলিভারি</div>
                      <div className="text-xs text-muted-foreground">দরজায় পৌঁছে দেওয়া হবে</div>
                    </div>
                  </label>
                )}
                {delivery?.pickup_enabled && (
                  <label className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${deliveryMethod === 'pickup' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}>
                    <RadioGroupItem value="pickup" />
                    <Package className="size-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">পিকআপ</div>
                      <div className="text-xs text-muted-foreground">{delivery.pickup_location}</div>
                    </div>
                  </label>
                )}
              </div>
            </RadioGroup>
          </section>

          {/* Delivery area + address */}
          {deliveryMethod === 'home' && (
            <section className="space-y-4">
              <div className="space-y-2">
                <Label>ডেলিভারি এলাকা</Label>
                <RadioGroup value={deliveryArea} onValueChange={v => setDeliveryArea(v as 'dhaka' | 'outside')} className="flex gap-4">
                  <label className={`flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer text-sm ${deliveryArea === 'dhaka' ? 'border-primary' : ''}`}>
                    <RadioGroupItem value="dhaka" /> ঢাকার ভিতরে ({formatCurrency(delivery?.dhaka_charge || 0)})
                  </label>
                  <label className={`flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer text-sm ${deliveryArea === 'outside' ? 'border-primary' : ''}`}>
                    <RadioGroupItem value="outside" /> ঢাকার বাইরে ({formatCurrency(delivery?.outside_dhaka_charge || 0)})
                  </label>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">পূর্ণ ঠিকানা *</Label>
                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="বাড়ি/হোল্ডিং নম্বর, রোড, এলাকা" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">জেলা *</Label>
                <Input id="district" value={district} onChange={e => setDistrict(e.target.value)} placeholder="জেলার নাম" />
              </div>
            </section>
          )}

          {deliveryMethod === 'pickup' && delivery?.pickup_instructions && (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              {delivery.pickup_instructions}
            </div>
          )}

          <Separator />

          {/* Payment method */}
          <section className="space-y-4">
            <h2 className="font-semibold">পেমেন্ট পদ্ধতি</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {payment?.bkash_enabled && (
                <button onClick={() => setPaymentMethod('bkash')} className={`rounded-lg border p-4 text-center transition-colors ${paymentMethod === 'bkash' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}>
                  <div className="font-bold text-pink-600">bKash</div>
                </button>
              )}
              {payment?.nagad_enabled && (
                <button onClick={() => setPaymentMethod('nagad')} className={`rounded-lg border p-4 text-center transition-colors ${paymentMethod === 'nagad' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}>
                  <div className="font-bold text-orange-600">Nagad</div>
                </button>
              )}
              {payment?.cod_enabled && (
                <button onClick={() => setPaymentMethod('cod')} className={`rounded-lg border p-4 text-center transition-colors ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}>
                  <div className="font-bold">ক্যাশ অন ডেলিভারি</div>
                </button>
              )}
            </div>

            {/* Payment instructions */}
            {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && activePaymentNumber && (
              <div className="rounded-lg border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="size-4 text-primary" />
                  {activePaymentInstructions || 'Send Money করুন এই নম্বরে'}
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div>
                    <div className="text-xs text-muted-foreground">{paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} নম্বর</div>
                    <div className="font-mono font-bold text-lg">{activePaymentNumber}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleCopyNumber(activePaymentNumber)}>
                    <Copy className="size-4" />কপি
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  পরিমাণ: <span className="font-bold text-foreground">{formatCurrency(total)}</span>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sender">যে নম্বর থেকে পাঠানো হয়েছে *</Label>
                    <Input id="sender" value={senderNumber} onChange={e => setSenderNumber(e.target.value)} placeholder="০১৭xxxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trx">Transaction ID *</Label>
                    <Input id="trx" value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="TRX ID" />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'cod' && (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                পণ্য হাতে পেয়ে টাকা পরিশোধ করুন।
              </div>
            )}
          </section>
        </div>

        {/* Right: order summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-lg border bg-card p-5 space-y-4">
            <h2 className="font-semibold">অর্ডার সারাংশ</h2>
            <Separator />
            <div className="space-y-3 text-sm">
              {items.map(item => {
                const unitPrice = item.format === 'ebook'
                  ? (item.book?.ebook_free ? 0 : (item.book?.ebook_price || 0))
                  : getBookPrice(item.book!, item.quantity, tierMap[item.bookId] || [])
                return (
                  <div key={`${item.bookId}-${item.format}`} className="flex justify-between">
                    <span className="text-muted-foreground line-clamp-1 pr-2">{item.book?.title} × {item.quantity}</span>
                    <span className="font-medium whitespace-nowrap">{formatCurrency(unitPrice * (item.format === 'ebook' ? 1 : item.quantity))}</span>
                  </div>
                )
              })}
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">সাবটোটাল</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ডেলিভারি</span><span>{formatCurrency(deliveryCharge)}</span></div>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>সর্বমোট</span><span>{formatCurrency(total)}</span>
            </div>
            <Button onClick={handleSubmit} className="w-full" size="lg" disabled={submitting}>
              {submitting ? 'প্রসেসিং...' : 'অর্ডার নিশ্চিত করুন'}
              {!submitting && <Check className="size-4" />}
            </Button>
            {!user && (
              <p className="text-xs text-center text-muted-foreground">
                অর্ডার করতে <Link to="/login" className="text-primary hover:underline">লগইন</Link> করুন (ঐচ্ছিক)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
