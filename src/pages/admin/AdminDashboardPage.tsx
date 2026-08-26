import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Clock, CheckCircle2, XCircle, DollarSign, BookOpen, AlertTriangle, Wallet } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/lib/supabase'
import { formatCurrency, ORDER_STATUS_MAP, ORDER_STATUS_COLORS, PAYMENT_STATUS_MAP } from '@/lib/store'

export function AdminDashboardPage() {
  const [stats, setStats] = useState({ todayOrders: 0, pending: 0, processing: 0, completed: 0, cancelled: 0, todayRevenue: 0, booksSold: 0, lowStock: 0, due: 0 })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      supabase.from('orders').select('*').gte('created_at', today),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('books').select('*').lt('stock', 5),
      supabase.from('orders').select('*').eq('payment_status', 'pending'),
    ]).then(([todayRes, recentRes, lowStockRes, dueRes]) => {
      const todayOrders = todayRes.data || []
      const allRecent = recentRes.data || []
      const lowStock = lowStockRes.data || []
      const dueOrders = dueRes.data || []
      setStats({
        todayOrders: todayOrders.length,
        pending: todayOrders.filter(o => o.order_status === 'received').length,
        processing: todayOrders.filter(o => o.order_status === 'processing').length,
        completed: todayOrders.filter(o => o.order_status === 'completed').length,
        cancelled: todayOrders.filter(o => o.order_status === 'cancelled').length,
        todayRevenue: todayOrders.filter(o => o.order_status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0),
        booksSold: todayOrders.filter(o => o.order_status !== 'cancelled').length,
        lowStock: lowStock.length,
        due: dueOrders.reduce((s, o) => s + Number(o.total), 0),
      })
      setRecentOrders(allRecent)
      setLoading(false)
    })
  }, [])

  const statCards = [
    { label: 'আজকের অর্ডার', value: stats.todayOrders, icon: Package, color: 'text-blue-600' },
    { label: 'অপেক্ষমাণ', value: stats.pending, icon: Clock, color: 'text-yellow-600' },
    { label: 'প্রসেসিং', value: stats.processing, icon: Package, color: 'text-indigo-600' },
    { label: 'সম্পন্ন', value: stats.completed, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'বাতিল', value: stats.cancelled, icon: XCircle, color: 'text-red-600' },
    { label: 'আজকের আয়', value: formatCurrency(stats.todayRevenue), icon: DollarSign, color: 'text-green-600' },
    { label: 'বিক্রি হওয়া বই', value: stats.booksSold, icon: BookOpen, color: 'text-purple-600' },
    { label: 'স্টক কম', value: stats.lowStock, icon: AlertTriangle, color: 'text-orange-600' },
    { label: 'বকেয়া', value: formatCurrency(stats.due), icon: Wallet, color: 'text-red-600' },
  ]

  if (loading) return <div className="animate-pulse text-muted-foreground">লোড হচ্ছে...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ড্যাশবোর্ড</h1>
        <p className="text-sm text-muted-foreground">আজকের সারসংক্ষেপ</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {statCards.map(card => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>{card.label}</CardDescription>
                <card.icon className={`size-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>সাম্প্রতিক অর্ডার</CardTitle>
              <CardDescription>সর্বশেষ ১০টি অর্ডার</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm"><Link to="/admin/orders">সকল অর্ডার</Link></Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">কোনো অর্ডার নেই</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>অর্ডার #</TableHead>
                    <TableHead>গ্রাহক</TableHead>
                    <TableHead>সর্বমোট</TableHead>
                    <TableHead>অবস্থা</TableHead>
                    <TableHead>পেমেন্ট</TableHead>
                    <TableHead>তারিখ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.order_number}</TableCell>
                      <TableCell className="text-sm">{order.customer_name}</TableCell>
                      <TableCell className="font-medium text-sm">{formatCurrency(Number(order.total))}</TableCell>
                      <TableCell><Badge className={ORDER_STATUS_COLORS[order.order_status]}>{ORDER_STATUS_MAP[order.order_status]}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{PAYMENT_STATUS_MAP[order.payment_status]}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('bn-BD')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
