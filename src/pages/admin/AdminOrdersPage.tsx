import { useEffect, useState } from 'react'
import { Search, Eye, Check, X, Package, Clock, CheckCircle2, Plus, Trash2, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase'
import type { Order, OrderItem, Book, DeliverySettings } from '@/lib/supabase'
import { formatCurrency, ORDER_STATUS_MAP, ORDER_STATUS_COLORS, PAYMENT_STATUS_MAP } from '@/lib/store'
import { toast } from 'sonner'

const statusActions = [
  { from: 'received', to: 'confirmed', label: 'নিশ্চিত করুন', icon: Check, variant: 'default' as const },
  { from: 'confirmed', to: 'processing', label: 'প্রসেসিং', icon: Clock, variant: 'default' as const },
  { from: 'processing', to: 'ready', label: 'প্রস্তুত', icon: Package, variant: 'default' as const },
  { from: 'ready', to: 'completed', label: 'সম্পন্ন', icon: CheckCircle2, variant: 'default' as const },
]

interface ManualItem {
  bookId: string
  quantity: number
  format: 'physical' | 'ebook'
  customPrice: number | null
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [viewItems, setViewItems] = useState<OrderItem[]>([])
  const [showManual, setShowManual] = useState(false)
  const [allBooks, setAllBooks] = useState<Book[]>([])
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null)
  const [manualName, setManualName] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [manualDistrict, setManualDistrict] = useState('')
  const [manualDelivery, setManualDelivery] = useState<'home' | 'pickup'>('home')
  const [manualDeliveryArea, setManualDeliveryArea] = useState<'dhaka' | 'outside'>('dhaka')
  const [manualPayment, setManualPayment] = useState<'bkash' | 'nagad' | 'cod'>('cod')
  const [manualItems, setManualItems] = useState<ManualItem[]>([])
  const [manualGift, setManualGift] = useState(false)
  const [manualSaving, setManualSaving] = useState(false)

  const fetchOrders = () => {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (statusFilter !== 'all') query = query.eq('order_status', statusFilter)
    if (paymentFilter !== 'all') query = query.eq('payment_status', paymentFilter)
    query.then(({ data }) => setOrders(data || []))
  }

  useEffect(() => { fetchOrders() }, [statusFilter, paymentFilter])

  useEffect(() => {
    supabase.from('books').select('*').order('title').then(({ data }) => setAllBooks(data || []))
    supabase.from('delivery_settings').select('*').maybeSingle().then(({ data }) => setDeliverySettings(data))
  }, [])

  const filtered = orders.filter(o => !search || o.order_number.toLowerCase().includes(search.toLowerCase()) || o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.customer_phone.includes(search))

  const updateStatus = async (order: Order, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ order_status: newStatus }).eq('id', order.id)
    if (error) toast.error('আপডেট ব্যর্থ')
    else {
      toast.success('অবস্থা আপডেট হয়েছে')
      fetchOrders()
      if (viewOrder?.id === order.id) setViewOrder({ ...order, order_status: newStatus as Order['order_status'] })
    }
  }

  const verifyPayment = async (order: Order) => {
    await supabase.from('orders').update({ payment_status: 'verified' }).eq('id', order.id)
    await supabase.from('payments').update({ status: 'verified', verified_at: new Date().toISOString() }).eq('order_id', order.id)
    await supabase.from('ledger_entries').update({ paid: Number(order.total), due: 0, payment_date: new Date().toISOString() }).eq('order_id', order.id)
    toast.success('পেমেন্ট যাচাই হয়েছে')
    fetchOrders()
    if (viewOrder?.id === order.id) setViewOrder({ ...order, payment_status: 'verified' })
  }

  const openView = async (order: Order) => {
    setViewOrder(order)
    const { data } = await supabase.from('order_items').select('*').eq('order_id', order.id)
    setViewItems(data || [])
  }

  const addManualItem = () => setManualItems([...manualItems, { bookId: '', quantity: 1, format: 'physical', customPrice: null }])
  const removeManualItem = (i: number) => setManualItems(manualItems.filter((_, idx) => idx !== i))
  const updateManualItem = (i: number, key: keyof ManualItem, value: string | number | null) => {
    setManualItems(manualItems.map((item, idx) => idx === i ? { ...item, [key]: value } : item))
  }

  const getItemUnitPrice = (item: ManualItem) => {
    const book = allBooks.find(b => b.id === item.bookId)
    if (!book) return 0
    if (item.customPrice !== null && item.customPrice !== undefined) return item.customPrice
    return item.format === 'ebook' ? (book.ebook_free ? 0 : (book.ebook_price || 0)) : Number(book.physical_price)
  }

  const manualSubtotal = manualGift ? 0 : manualItems.reduce((sum, item) => {
    if (!item.bookId) return sum
    return sum + getItemUnitPrice(item) * item.quantity
  }, 0)
  const manualDeliveryCharge = manualGift ? 0 : (manualDelivery === 'pickup'
    ? (deliverySettings?.pickup_charge || 0)
    : manualDeliveryArea === 'dhaka' ? (deliverySettings?.dhaka_charge || 0) : (deliverySettings?.outside_dhaka_charge || 0))
  const manualTotal = manualGift ? 0 : manualSubtotal + manualDeliveryCharge

  const handleManualSubmit = async () => {
    if (!manualName || !manualPhone) { toast.error('নাম ও ফোন আবশ্যক'); return }
    if (manualItems.length === 0 || !manualItems.some(i => i.bookId)) { toast.error('অন্তত একটি বই যোগ করুন'); return }
    setManualSaving(true)
    const deliveryAddress = manualDelivery === 'home' ? { address: manualAddress, district: manualDistrict, area: manualDeliveryArea } : null
    const { data: order, error } = await supabase.from('orders').insert({
      customer_name: manualName, customer_phone: manualPhone,
      delivery_method: manualDelivery, delivery_address: deliveryAddress,
      delivery_charge: manualDeliveryCharge, subtotal: manualSubtotal, total: manualTotal,
      is_gift: manualGift,
      payment_method: manualPayment, payment_status: manualGift ? 'verified' : 'pending', order_status: 'received', source: 'manual',
    }).select().single()
    if (error || !order) { toast.error('অর্ডার তৈরি ব্যর্থ'); setManualSaving(false); return }
    const items = manualItems.filter(i => i.bookId).map(item => {
      const book = allBooks.find(b => b.id === item.bookId)!
      const unitPrice = manualGift ? 0 : getItemUnitPrice(item)
      return {
        order_id: order.id, book_id: item.bookId, book_title: book.title, book_cover_url: book.cover_url,
        format: item.format, quantity: item.format === 'ebook' ? 1 : item.quantity,
        unit_price: unitPrice, total_price: unitPrice * (item.format === 'ebook' ? 1 : item.quantity),
        is_gift: manualGift, custom_price: manualGift ? null : item.customPrice,
      }
    })
    await supabase.from('order_items').insert(items)
    await supabase.from('ledger_entries').insert({
      order_id: order.id, customer_name: manualName, total: manualTotal, paid: 0,
      note: manualGift ? 'Gifted order' : null,
    })
    for (const item of manualItems.filter(i => i.bookId && i.format === 'physical')) {
      const book = allBooks.find(b => b.id === item.bookId)!
      const newStock = Math.max(0, book.stock - item.quantity)
      await supabase.from('books').update({ stock: newStock }).eq('id', item.bookId)
    }
    toast.success('ম্যানুয়াল অর্ডার তৈরি হয়েছে')
    setManualSaving(false)
    setShowManual(false)
    setManualName(''); setManualPhone(''); setManualAddress(''); setManualDistrict(''); setManualItems([]); setManualGift(false)
    fetchOrders()
  }

  const getNextAction = (order: Order) => statusActions.find(a => a.from === order.order_status)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">অর্ডার ব্যবস্থাপনা</h1>
          <p className="text-sm text-muted-foreground">মোট {orders.length}টি অর্ডার</p>
        </div>
        <Button onClick={() => setShowManual(true)}><Plus className="size-4" />ম্যানুয়াল অর্ডার</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="অর্ডার নম্বর, নাম, ফোন..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="অবস্থা" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল অবস্থা</SelectItem>
            <SelectItem value="received">অর্ডার পাওয়া গেছে</SelectItem>
            <SelectItem value="confirmed">নিশ্চিত</SelectItem>
            <SelectItem value="processing">প্রসেসিং</SelectItem>
            <SelectItem value="ready">প্রস্তুত</SelectItem>
            <SelectItem value="completed">সম্পন্ন</SelectItem>
            <SelectItem value="cancelled">বাতিল</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="পেমেন্ট" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল পেমেন্ট</SelectItem>
            <SelectItem value="pending">অপেক্ষমাণ</SelectItem>
            <SelectItem value="submitted">জমা দেওয়া</SelectItem>
            <SelectItem value="verified">যাচাই হয়েছে</SelectItem>
            <SelectItem value="cancelled">বাতিল</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>অর্ডার #</TableHead>
              <TableHead>গ্রাহক</TableHead>
              <TableHead>ফোন</TableHead>
              <TableHead>সর্বমোট</TableHead>
              <TableHead>অবস্থা</TableHead>
              <TableHead>পেমেন্ট</TableHead>
              <TableHead>তারিখ</TableHead>
              <TableHead>অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(order => {
              const nextAction = getNextAction(order)
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.order_number}</TableCell>
                  <TableCell className="text-sm">{order.customer_name}</TableCell>
                  <TableCell className="text-xs">{order.customer_phone}</TableCell>
                  <TableCell className="font-medium text-sm">
                    {order.is_gift ? <Badge className="bg-primary/10 text-primary">Gifted</Badge> : formatCurrency(Number(order.total))}
                  </TableCell>
                  <TableCell><Badge className={ORDER_STATUS_COLORS[order.order_status]}>{ORDER_STATUS_MAP[order.order_status]}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{PAYMENT_STATUS_MAP[order.payment_status]}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('bn-BD')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openView(order)}><Eye className="size-4" /></Button>
                      {nextAction && order.order_status !== 'cancelled' && (
                        <Button variant="outline" size="sm" onClick={() => updateStatus(order, nextAction.to)} className="text-xs h-7">{nextAction.label}</Button>
                      )}
                      {order.order_status !== 'cancelled' && order.order_status !== 'completed' && (
                        <Button variant="ghost" size="icon-sm" onClick={() => updateStatus(order, 'cancelled')} className="text-destructive"><X className="size-4" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* View dialog */}
      <Dialog open={!!viewOrder} onOpenChange={open => !open && setViewOrder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {viewOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  অর্ডার #{viewOrder.order_number}
                  {viewOrder.is_gift && <Badge className="bg-primary/10 text-primary"><Gift className="size-3 mr-1" />Gifted</Badge>}
                </DialogTitle>
                <DialogDescription>{new Date(viewOrder.created_at).toLocaleString('bn-BD')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                <section className="space-y-2">
                  <h4 className="text-sm font-semibold">গ্রাহক</h4>
                  <div className="text-sm space-y-1">
                    <div><span className="text-muted-foreground">নাম: </span>{viewOrder.customer_name}</div>
                    <div><span className="text-muted-foreground">ফোন: </span>{viewOrder.customer_phone}</div>
                    {viewOrder.customer_email && <div><span className="text-muted-foreground">ইমেইল: </span>{viewOrder.customer_email}</div>}
                  </div>
                </section>
                <Separator />
                <section className="space-y-2">
                  <h4 className="text-sm font-semibold">আইটেম</h4>
                  {viewItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      {item.book_cover_url && <img src={item.book_cover_url} alt="" className="size-10 rounded border object-cover" />}
                      <div className="flex-1">
                        <div className="font-medium">{item.book_title}</div>
                        <div className="text-xs text-muted-foreground">{item.format} × {item.quantity}</div>
                      </div>
                      <div className="font-medium">
                        {item.is_gift ? <span className="text-primary">Gifted</span> : formatCurrency(Number(item.total_price))}
                      </div>
                    </div>
                  ))}
                </section>
                <Separator />
                <section className="space-y-2">
                  <h4 className="text-sm font-semibold">ডেলিভারি</h4>
                  <div className="text-sm">
                    <div><span className="text-muted-foreground">পদ্ধতি: </span>{viewOrder.delivery_method === 'home' ? 'হোম ডেলিভারি' : 'পিকআপ'}</div>
                    {viewOrder.delivery_address && (
                      <div className="mt-1 text-muted-foreground">{JSON.stringify(viewOrder.delivery_address)}</div>
                    )}
                  </div>
                </section>
                <Separator />
                <section className="space-y-2 text-sm">
                  {viewOrder.is_gift ? (
                    <div className="flex justify-between font-bold text-lg"><span>সর্বমোট</span><span className="text-primary">Gifted</span></div>
                  ) : (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground">সাবটোটাল</span><span>{formatCurrency(Number(viewOrder.subtotal))}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">ডেলিভারি</span><span>{formatCurrency(Number(viewOrder.delivery_charge))}</span></div>
                      <div className="flex justify-between font-bold text-lg"><span>সর্বমোট</span><span>{formatCurrency(Number(viewOrder.total))}</span></div>
                    </>
                  )}
                </section>
                <Separator />
                <div className="flex items-center gap-4">
                  <div><div className="text-xs text-muted-foreground mb-1">অর্ডার</div><Badge className={ORDER_STATUS_COLORS[viewOrder.order_status]}>{ORDER_STATUS_MAP[viewOrder.order_status]}</Badge></div>
                  <div><div className="text-xs text-muted-foreground mb-1">পেমেন্ট</div><Badge variant="outline">{PAYMENT_STATUS_MAP[viewOrder.payment_status]}</Badge></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getNextAction(viewOrder) && viewOrder.order_status !== 'cancelled' && (
                    <Button size="sm" onClick={() => { updateStatus(viewOrder, getNextAction(viewOrder)!.to) }}>{getNextAction(viewOrder)!.label}</Button>
                  )}
                  {viewOrder.payment_status === 'submitted' && (
                    <Button size="sm" variant="outline" onClick={() => verifyPayment(viewOrder)}>পেমেন্ট যাচাই</Button>
                  )}
                  {viewOrder.order_status !== 'cancelled' && viewOrder.order_status !== 'completed' && (
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(viewOrder, 'cancelled')}>বাতিল</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual order dialog */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ম্যানুয়াল অর্ডার যোগ করুন</DialogTitle>
            <DialogDescription>ফোন/বাসা থেকে নেওয়া অর্ডার এখানে যোগ করুন</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {/* Customer */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold">গ্রাহক</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">নাম *</Label><Input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="গ্রাহকের নাম" /></div>
                <div className="space-y-1"><Label className="text-xs">ফোন *</Label><Input value={manualPhone} onChange={e => setManualPhone(e.target.value)} placeholder="০১৭xxxxxxx" /></div>
              </div>
            </section>
            <Separator />
            {/* Delivery */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold">ডেলিভারি</h4>
              <RadioGroup value={manualDelivery} onValueChange={v => setManualDelivery(v as 'home' | 'pickup')} className="flex gap-4">
                <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm ${manualDelivery === 'home' ? 'border-primary bg-primary/5' : ''}`}>
                  <RadioGroupItem value="home" /> হোম ডেলিভারি
                </label>
                <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm ${manualDelivery === 'pickup' ? 'border-primary bg-primary/5' : ''}`}>
                  <RadioGroupItem value="pickup" /> পিকআপ
                </label>
              </RadioGroup>
              {manualDelivery === 'home' && !manualGift && (
                <>
                  <RadioGroup value={manualDeliveryArea} onValueChange={v => setManualDeliveryArea(v as 'dhaka' | 'outside')} className="flex gap-4">
                    <label className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 cursor-pointer text-xs ${manualDeliveryArea === 'dhaka' ? 'border-primary' : ''}`}>
                      <RadioGroupItem value="dhaka" /> ঢাকা ({formatCurrency(deliverySettings?.dhaka_charge || 0)})
                    </label>
                    <label className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 cursor-pointer text-xs ${manualDeliveryArea === 'outside' ? 'border-primary' : ''}`}>
                      <RadioGroupItem value="outside" /> ঢাকার বাইরে ({formatCurrency(deliverySettings?.outside_dhaka_charge || 0)})
                    </label>
                  </RadioGroup>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input value={manualAddress} onChange={e => setManualAddress(e.target.value)} placeholder="ঠিকানা" />
                    <Input value={manualDistrict} onChange={e => setManualDistrict(e.target.value)} placeholder="জেলা" />
                  </div>
                </>
              )}
            </section>
            <Separator />
            {/* Gift toggle */}
            <section className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Gift className="size-4 text-primary" />
                  <div>
                    <div className="text-sm font-semibold">গিফট অর্ডার</div>
                    <div className="text-xs text-muted-foreground">চালু করলে কোনো টাকা লাগবে না, ডাটাবেজে ০ টাকা</div>
                  </div>
                </div>
                <Switch checked={manualGift} onCheckedChange={setManualGift} />
              </div>
            </section>
            <Separator />
            {/* Items */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">বই</h4>
                <Button size="sm" variant="outline" onClick={addManualItem}><Plus className="size-3" />বই যোগ</Button>
              </div>
              {manualItems.map((item, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Select value={item.bookId} onValueChange={v => updateManualItem(i, 'bookId', v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="বই নির্বাচন" /></SelectTrigger>
                        <SelectContent>{allBooks.map(b => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Select value={item.format} onValueChange={v => updateManualItem(i, 'format', v)}>
                      <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="physical">প্রিন্টেড</SelectItem><SelectItem value="ebook">ই-বুক</SelectItem></SelectContent>
                    </Select>
                    <Input type="number" min={1} value={item.quantity} onChange={e => updateManualItem(i, 'quantity', Number(e.target.value))} className="w-16 h-9" />
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => removeManualItem(i)}><Trash2 className="size-4" /></Button>
                  </div>
                  {!manualGift && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs whitespace-nowrap">কাস্টম দাম</Label>
                      <Input type="number" placeholder="ডিফল্ট দাম ব্যবহার" value={item.customPrice ?? ''} onChange={e => updateManualItem(i, 'customPrice', e.target.value ? Number(e.target.value) : null)} className="h-8 text-sm" />
                      <span className="text-xs text-muted-foreground">খালি রাখলে বইয়ের ডিফল্ট দাম</span>
                    </div>
                  )}
                </div>
              ))}
              {manualItems.length === 0 && <p className="text-xs text-muted-foreground">কোনো বই যোগ করা হয়নি</p>}
            </section>
            {!manualGift && (
              <>
                <Separator />
                {/* Payment */}
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold">পেমেন্ট</h4>
                  <Select value={manualPayment} onValueChange={v => setManualPayment(v as 'bkash' | 'nagad' | 'cod')}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cod">ক্যাশ অন ডেলিভারি</SelectItem>
                      <SelectItem value="bkash">bKash</SelectItem>
                      <SelectItem value="nagad">Nagad</SelectItem>
                    </SelectContent>
                  </Select>
                </section>
              </>
            )}
            <Separator />
            {/* Summary */}
            <div className="space-y-1 text-sm">
              {manualGift ? (
                <div className="flex justify-between font-bold text-lg"><span>সর্বমোট</span><span className="text-primary">Gifted</span></div>
              ) : (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">সাবটোটাল</span><span>{formatCurrency(manualSubtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">ডেলিভারি</span><span>{formatCurrency(manualDeliveryCharge)}</span></div>
                  <div className="flex justify-between font-bold text-lg"><span>সর্বমোট</span><span>{formatCurrency(manualTotal)}</span></div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManual(false)}>বাতিল</Button>
            <Button onClick={handleManualSubmit} disabled={manualSaving}>{manualSaving ? 'তৈরি হচ্ছে...' : 'অর্ডার তৈরি করুন'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
