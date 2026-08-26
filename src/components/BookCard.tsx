import type { Book } from '@/lib/supabase'
import { formatCurrency } from '@/lib/store'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'

interface BookCardProps {
  book: Book
}

export function BookCard({ book }: BookCardProps) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300">
      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="size-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="size-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
            <BookOpen className="size-12 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-2 left-2 flex gap-1">
          {book.is_new && <Badge className="text-[10px] bg-gradient-to-r from-emerald-500 to-teal-600 border-0 text-white">নতুন</Badge>}
          {book.is_bestseller && <Badge className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white">বেস্টসেলার</Badge>}
        </div>
      </div>
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground line-clamp-2 leading-snug">{book.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{book.author}</p>
          {book.short_description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{book.short_description}</p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-gradient-emerald">{formatCurrency(book.physical_price)}</span>
          <Button asChild size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 group-hover:shadow-md transition-shadow">
            <Link to={`/book/${book.slug}`}>দেখুন</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
