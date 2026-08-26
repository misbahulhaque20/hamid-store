import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Phone, Mail, MapPin, ArrowRight, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import type { AuthorProfile, Book } from '@/lib/supabase'
import { BookCard } from '@/components/BookCard'

export function AuthorPage() {
  const [author, setAuthor] = useState<AuthorProfile | null>(null)
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    supabase.from('author_profile').select('*').maybeSingle().then(({ data }) => setAuthor(data))
    supabase.from('books').select('*').eq('is_published', true).order('ranking').then(({ data }) => setBooks(data || []))
  }, [])

  if (!author) return <div className="container mx-auto max-w-3xl px-4 py-20"><div className="h-96 rounded-lg bg-muted animate-pulse" /></div>

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-muted/30 to-background py-16">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="flex flex-col items-center text-center gap-6">
            {author.photo_url ? (
              <img src={author.photo_url} alt={author.name} className="size-32 rounded-full object-cover border-4 border-border" />
            ) : (
              <div className="size-32 rounded-full bg-muted border-4 border-border flex items-center justify-center">
                <span className="text-4xl text-muted-foreground font-bold">হ</span>
              </div>
            )}
            <div className="space-y-2">
              <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">{author.name}</h1>
              {author.name_en && <p className="text-muted-foreground">{author.name_en}</p>}
              <p className="text-muted-foreground max-w-xl">{author.short_bio}</p>
            </div>
            {/* Social links */}
            <div className="flex items-center gap-4">
              {author.facebook_url && <a href={author.facebook_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Globe className="size-5" /></a>}
              {author.instagram_url && <a href={author.instagram_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Globe className="size-5" /></a>}
              {author.youtube_url && <a href={author.youtube_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Globe className="size-5" /></a>}
              {author.whatsapp && <a href={`https://wa.me/${author.whatsapp}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Phone className="size-5" /></a>}
            </div>
          </div>
        </div>
      </section>

      {/* Full bio */}
      {author.full_bio && (
        <section className="container mx-auto max-w-3xl px-4 py-12">
          <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-6">পরিচিতি</h2>
          <Separator className="mb-6" />
          <div className="text-muted-foreground leading-relaxed whitespace-pre-line">{author.full_bio}</div>
        </section>
      )}

      {/* Contact info */}
      <section className="container mx-auto max-w-3xl px-4 py-12 bg-muted/30 rounded-lg">
        <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-6">যোগাযোগ</h2>
        <Separator className="mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {author.phone && (
            <div className="flex items-center gap-3">
              <Phone className="size-5 text-primary" />
              <div><div className="text-xs text-muted-foreground">ফোন</div><div className="font-medium">{author.phone}</div></div>
            </div>
          )}
          {author.email && (
            <div className="flex items-center gap-3">
              <Mail className="size-5 text-primary" />
              <div><div className="text-xs text-muted-foreground">ইমেইল</div><div className="font-medium">{author.email}</div></div>
            </div>
          )}
          {author.address && (
            <div className="flex items-center gap-3">
              <MapPin className="size-5 text-primary" />
              <div><div className="text-xs text-muted-foreground">ঠিকানা</div><div className="font-medium">{author.address}</div></div>
            </div>
          )}
        </div>
      </section>

      {/* Published books */}
      {books.length > 0 && (
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">প্রকাশিত বই</h2>
            <Button asChild variant="outline" size="sm">
              <Link to="/books">সকল বই <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto max-w-3xl px-4 text-center space-y-4">
          <h2 className="text-2xl font-bold">বই অর্ডার করুন</h2>
          <Button asChild variant="secondary" size="lg">
            <Link to="/books"><BookOpen className="size-4" />বইসমূহ দেখুন</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
