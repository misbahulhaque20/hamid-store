import { useEffect, useState } from 'react'
import { Eye, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import type { Customer, Order } from '@/lib/supabase'
import { formatCurrency, ORDER_STATUS_MAP, ORDER_STATUS_COLORS } from '@/lib/store'

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<(Customer & { order_count?: number; total_spent?: number; last_order?: string })[]>([])
  const [search, setSearch] = useState('')
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null)
  const [viewOrders, setViewOrders] = useState<Order[]>([])

  useEffect(() => {
    supabase.from('customers').select('*').order('created_at', { ascending: false }).then(async ({ data }) => {
      if (!data) return
      const enriched = await Promise.all(data.map(async c => {
        const { data: orders } = await supabase.from('orders').select('*').eq('customer_id', c.id).order('created_at', { ascending: false })
        return {
          ...c,
          order_count: orders?.length || 0,
          total_spent: orders?.filter(o => o.order_status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0) || 0,
          last_order: orders?.[0]?.created_at,
        }
      }))
      setCustomers(enriched)
    })
  }, [])

  const filtered = customers.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))

  const openView = async (c: Customer) => {
    setViewCustomer(c)
    const { data } = await supabase.from('orders').select('*').eq('customer_id', c.id).order('created_at', { ascending: false })
    setViewOrders(data || [])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">গ্রাহক</h1>
        <p className="text-sm text-muted-foreground">মোট {customers.length} জন</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="নাম বা ফোন..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>নাম</TableHead>
              <TableHead>ফোন</TableHead>
              <TableHead>ইমেইল</TableHead>
              <TableHead>অর্ডার</TableHead>
              <TableHead>মোট ক্রয়</TableHead>
              <TableHead>শেষ অর্ডার</TableHead>
              <TableHead>অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium text-sm">{c.name}</TableCell>
                <TableCell className="text-sm">{c.phone}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.email || '-'}</TableCell>
                <TableCell className="text-sm">{c.order_count}</TableCell>
                <TableCell className="text-sm font-medium">{formatCurrency(c.total_spent || 0)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.last_order ? new Date(c.last_order).toLocaleDateString('bn-BD') : '-'}</TableCell>
                <TableCell><Button variant="ghost" size="icon-sm" onClick={() => openView(c)}><Eye className="size-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!viewCustomer} onOpenChange={open => !open && setViewCustomer(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {viewCustomer && (
            <>
              <DialogHeader><DialogTitle>{viewCustomer.name}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="text-sm space-y-1">
                  <div><span className="text-muted-foreground">ফোন: </span>{viewCustomer.phone}</div>
                  {viewCustomer.email && <div><span className="text-muted-foreground">ইমেইল: </span>{viewCustomer.email}</div>}
                </div>
                <Separator />
                <h4 className="text-sm font-semibold">অর্ডার ইতিহাস ({viewOrders.length})</h4>
                {viewOrders.length === 0 ? <p className="text-sm text-muted-foreground">কোনো অর্ডার নেই</p> : (
                  <div className="space-y-2">
                    {viewOrders.map(o => (
                      <div key={o.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <div>
                          <div className="font-mono text-xs">{o.order_number}</div>
                          <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString('bn-BD')}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={ORDER_STATUS_COLORS[o.order_status]}>{ORDER_STATUS_MAP[o.order_status]}</Badge>
                          <span className="font-medium">{formatCurrency(Number(o.total))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
