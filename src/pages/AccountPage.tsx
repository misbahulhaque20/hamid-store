import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Package, LogOut, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Order, OrderItem } from '@/lib/supabase'
import { formatCurrency, ORDER_STATUS_MAP, ORDER_STATUS_COLORS, PAYMENT_STATUS_MAP } from '@/lib/store'
import { toast } from 'sonner'
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty'

export function AccountPage() {
  const { user, customer, signOut, refreshCustomer } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({})
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (customer) {
      setName(customer.name)
      setPhone(customer.phone)
      setEmail(customer.email || '')
    }
    if (customer) {
      supabase.from('orders').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }).then(({ data }) => {
        setOrders(data || [])
        if (data && data.length > 0) {
          data.forEach(o => {
            supabase.from('order_items').select('*').eq('order_id', o.id).then(({ data: items }) => {
              if (items) setOrderItems(prev => ({ ...prev, [o.id]: items }))
            })
          })
        }
      })
    }
  }, [user, customer, navigate])

  const handleUpdateProfile = async () => {
    if (!customer) return
    const { error } = await supabase.from('customers').update({ name, phone, email }).eq('id', customer.id)
    if (error) toast.error('আপডেট ব্যর্থ')
    else { toast.success('প্রোফাইল আপডেট হয়েছে'); refreshCustomer() }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">আমার অ্যাকাউন্ট</h1>
          <p className="text-sm text-muted-foreground">{customer?.name}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" />লগআউট
        </Button>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders"><Package className="size-4" />আমার অর্ডার</TabsTrigger>
          <TabsTrigger value="profile"><User className="size-4" />প্রোফাইল</TabsTrigger>
        </TabsList>

        {/* Orders */}
        <TabsContent value="orders" className="pt-6 space-y-4">
          {orders.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon"><BookOpen className="size-6" /></EmptyMedia>
              <EmptyTitle>কোনো অর্ডার নেই</EmptyTitle>
              <EmptyDescription>আপনার অর্ডার এখানে দেখা যাবে।</EmptyDescription>
              <Button asChild><Link to="/books">বই কিনুন</Link></Button>
            </Empty>
          ) : (
            orders.map(order => (
              <div key={order.id} className="rounded-lg border bg-card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">অর্ডার #{order.order_number}</div>
                    <div className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('bn-BD')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={ORDER_STATUS_COLORS[order.order_status]}>{ORDER_STATUS_MAP[order.order_status]}</Badge>
                    <Badge variant="outline">{PAYMENT_STATUS_MAP[order.payment_status]}</Badge>
                  </div>
                </div>
                <Separator />
                {/* Order items */}
                <div className="space-y-2">
                  {(orderItems[order.id] || []).map(item => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      {item.book_cover_url && <img src={item.book_cover_url} alt="" className="size-10 rounded border object-cover" />}
                      <div className="flex-1">
                        <div className="font-medium">{item.book_title}</div>
                        <div className="text-xs text-muted-foreground">{item.format} × {item.quantity}</div>
                      </div>
                      <div className="font-medium">{formatCurrency(item.total_price)}</div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">সর্বমোট: </span>
                    <span className="font-bold">{formatCurrency(order.total)}</span>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/track-order/${order.id}`}>অর্ডারের অবস্থা দেখুন</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Profile */}
        <TabsContent value="profile" className="pt-6">
          <div className="rounded-lg border bg-card p-6 space-y-6 max-w-md">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">নাম</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">ফোন</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">ইমেইল</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <Button onClick={handleUpdateProfile}>আপডেট করুন</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
