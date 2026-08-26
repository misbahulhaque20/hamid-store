import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import type { LedgerEntry } from '@/lib/supabase'
import { formatCurrency } from '@/lib/store'
import { toast } from 'sonner'

export function AdminLedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([])

  const fetch = () => {
    supabase.from('ledger_entries').select('*').order('created_at', { ascending: false }).then(({ data }) => setEntries(data || []))
  }

  useEffect(() => { fetch() }, [])

  const markPaid = async (entry: LedgerEntry) => {
    await supabase.from('ledger_entries').update({ paid: Number(entry.total), payment_date: new Date().toISOString() }).eq('id', entry.id)
    if (entry.order_id) {
      await supabase.from('orders').update({ payment_status: 'verified' }).eq('id', entry.order_id)
    }
    toast.success('পেমেন্ট চিহ্নিত হয়েছে')
    fetch()
  }

  const totalDue = entries.reduce((s, e) => s + Number(e.due), 0)
  const totalPaid = entries.reduce((s, e) => s + Number(e.paid), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">হিসাব</h1>
        <p className="text-sm text-muted-foreground">সরল আর্থিক হিসাব</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">মোট বিক্রয়</div><div className="text-2xl font-bold">{formatCurrency(totalPaid + totalDue)}</div></div>
        <div className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">পরিশোধিত</div><div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div></div>
        <div className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">বকেয়া</div><div className="text-2xl font-bold text-red-600">{formatCurrency(totalDue)}</div></div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>গ্রাহক</TableHead>
              <TableHead>মোট</TableHead>
              <TableHead>পরিশোধিত</TableHead>
              <TableHead>বকেয়া</TableHead>
              <TableHead>তারিখ</TableHead>
              <TableHead>অবস্থা</TableHead>
              <TableHead>অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(e => (
              <TableRow key={e.id}>
                <TableCell className="text-sm font-medium">{e.customer_name}</TableCell>
                <TableCell className="text-sm">{formatCurrency(Number(e.total))}</TableCell>
                <TableCell className="text-sm text-green-600">{formatCurrency(Number(e.paid))}</TableCell>
                <TableCell className="text-sm text-red-600">{formatCurrency(Number(e.due))}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{e.payment_date ? new Date(e.payment_date).toLocaleDateString('bn-BD') : '-'}</TableCell>
                <TableCell>{Number(e.due) > 0 ? <Badge variant="destructive" className="text-[10px]">বকেয়া</Badge> : <Badge variant="outline" className="text-[10px]">পরিশোধিত</Badge>}</TableCell>
                <TableCell>{Number(e.due) > 0 && <Button variant="ghost" size="sm" onClick={() => markPaid(e)} className="text-xs"><Check className="size-3" />পরিশোধ</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
