import { useEffect, useState } from 'react'
import { Search, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Book } from '@/lib/supabase'
import { BookCard } from '@/components/BookCard'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty'

export function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    supabase.from('books').select('*').eq('is_published', true).order('ranking').then(({ data }) => {
      setBooks(data || [])
      setLoading(false)
    })
  }, [])

  const filtered = books.filter(b => {
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ||
      (filter === 'new' && b.is_new) ||
      (filter === 'bestseller' && b.is_bestseller) ||
      (filter === 'featured' && b.is_featured)
    return matchSearch && matchFilter
  })

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight mb-2">বইসমূহ</h1>
        <p className="text-muted-foreground">মোঃ হামিদুল হক নাবিলের সকল প্রকাশিত বই</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="বই খুঁজুন..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="ফিল্টার" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল বই</SelectItem>
            <SelectItem value="new">নতুন</SelectItem>
            <SelectItem value="bestseller">বেস্টসেলার</SelectItem>
            <SelectItem value="featured">ফিচার্ড</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-80 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon"><BookOpen className="size-6" /></EmptyMedia>
          <EmptyTitle>কোনো বই পাওয়া যায়নি</EmptyTitle>
          <EmptyDescription>আপনার অনুসন্ধানে কোনো বই মেলেনি।</EmptyDescription>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(book => <BookCard key={book.id} book={book} />)}
        </div>
      )}
    </div>
  )
}
