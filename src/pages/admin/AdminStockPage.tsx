import { useEffect, useState } from 'react'
import { AlertTriangle, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import type { Book } from '@/lib/supabase'
import { toast } from 'sonner'

export function AdminStockPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [adjustments, setAdjustments] = useState<Record<string, number>>({})

  const fetchBooks = () => {
    supabase.from('books').select('*').order('title').then(({ data }) => setBooks(data || []))
  }

  useEffect(() => { fetchBooks() }, [])

  const applyAdjustment = async (book: Book) => {
    const adj = adjustments[book.id]
    if (!adj) return
    const newStock = Math.max(0, book.stock + adj)
    const { error } = await supabase.from('books').update({ stock: newStock }).eq('id', book.id)
    if (error) toast.error('স্টক আপডেট ব্যর্থ')
    else { toast.success(`স্টক আপডেট: ${book.title}`); setAdjustments({ ...adjustments, [book.id]: 0 }); fetchBooks() }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">স্টক ব্যবস্থাপনা</h1>
        <p className="text-sm text-muted-foreground">বইয়ের বর্তমান স্টক</p>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>বই</TableHead>
              <TableHead>বর্তমান স্টক</TableHead>
              <TableHead>অবস্থা</TableHead>
              <TableHead>পরিবর্তন</TableHead>
              <TableHead>প্রয়োগ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map(book => (
              <TableRow key={book.id}>
                <TableCell className="font-medium text-sm">{book.title}</TableCell>
                <TableCell className={`font-bold ${book.stock < 5 ? 'text-destructive' : ''}`}>{book.stock}</TableCell>
                <TableCell>
                  {book.stock === 0 ? <Badge variant="destructive" className="text-[10px]">নেই</Badge>
                    : book.stock < 5 ? <Badge className="text-[10px] bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"><AlertTriangle className="size-3 mr-1" />কম</Badge>
                    : <Badge variant="outline" className="text-[10px]">আছে</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon-sm" onClick={() => setAdjustments({ ...adjustments, [book.id]: (adjustments[book.id] || 0) - 1 })}><Minus className="size-3" /></Button>
                    <Input type="number" value={adjustments[book.id] ?? 0} onChange={e => setAdjustments({ ...adjustments, [book.id]: Number(e.target.value) })} className="w-20 h-8 text-center" />
                    <Button variant="outline" size="icon-sm" onClick={() => setAdjustments({ ...adjustments, [book.id]: (adjustments[book.id] || 0) + 1 })}><Plus className="size-3" /></Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => applyAdjustment(book)} disabled={!adjustments[book.id]}>প্রয়োগ</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
