import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, BookOpen, Star, Package, Truck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { supabase } from '@/lib/supabase'
import type { Book, AuthorProfile } from '@/lib/supabase'
import { formatCurrency } from '@/lib/store'
import { BookCard } from '@/components/BookCard'
import { Book3DMockup } from '@/components/Book3DMockup'

export function HomePage() {
  const [featuredBook, setFeaturedBook] = useState<Book | null>(null)
  const [allBooks, setAllBooks] = useState<Book[]>([])
  const [author, setAuthor] = useState<AuthorProfile | null>(null)

  useEffect(() => {
    supabase.from('books').select('*').eq('is_published', true).order('ranking').then(({ data }) => {
      if (data) {
        setAllBooks(data)
        setFeaturedBook(data.find(b => b.is_featured) || data[0] || null)
      }
    })
    supabase.from('author_profile').select('*').maybeSingle().then(({ data }) => setAuthor(data))
  }, [])

  const otherBooks = allBooks.filter(b => b.id !== featuredBook?.id)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 islamic-pattern" />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-background to-background dark:from-emerald-950/20 dark:via-background dark:to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto max-w-5xl px-4 relative">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-center">
            <div className="space-y-6 animate-fade-in-up">
              <div className="space-y-3">
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
                  <Sparkles className="size-3 mr-1" />
                  {featuredBook?.is_new ? 'নতুন বই' : featuredBook?.is_bestseller ? 'বেস্টসেলার' : 'প্রিমিয়াম বই'}
                </Badge>
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance leading-tight md:text-5xl text-gradient-emerald">
                  Hamid Store
                </h1>
                <p className="text-xl text-muted-foreground">
                  মোঃ হামিদুল হক নাবিলের বই সরাসরি আপনার দরজায়।
                </p>
              </div>
              {featuredBook && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{featuredBook.title}</h2>
                    {featuredBook.subtitle && <p className="text-muted-foreground">{featuredBook.subtitle}</p>}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{featuredBook.short_description}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-gradient-emerald">{formatCurrency(featuredBook.physical_price)}</span>
                    {featuredBook.ebook_enabled && featuredBook.ebook_price && (
                      <span className="text-sm text-muted-foreground">+ ই-বুক {formatCurrency(featuredBook.ebook_price)}</span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/20">
                      <Link to={`/book/${featuredBook.slug}`}>
                        বইটি দেখুন <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="border-emerald-500/30">
                      <Link to={`/book/${featuredBook.slug}#order`}>অর্ডার করুন</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Book mockup */}
            <div className="flex justify-center animate-float">
              {featuredBook ? (
                <Book3DMockup coverUrl={featuredBook.cover_url} title={featuredBook.title} />
              ) : (
                <div className="h-72 w-52 rounded-lg bg-muted animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured book detail */}
      {featuredBook && (
        <section className="py-16">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-start">
              <div className="space-y-6">
                <div>
                  <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight mb-3">বইটি সম্পর্কে</h2>
                  <Separator className="mb-6" />
                </div>
                {featuredBook.description && (
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-line">{featuredBook.description}</div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {featuredBook.page_count && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="size-4 text-primary" />
                      <span>{featuredBook.page_count} পৃষ্ঠা</span>
                    </div>
                  )}
                  {featuredBook.edition && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Star className="size-4 text-primary" />
                      <span>{featuredBook.edition}</span>
                    </div>
                  )}
                </div>
                <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
                  <Link to={`/book/${featuredBook.slug}`}>বইয়ের বিস্তারিত দেখুন <ArrowRight className="size-4" /></Link>
                </Button>
              </div>

              {/* Why this book */}
              <div className="space-y-6">
                <div>
                  <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight mb-3">কেন পড়বেন?</h2>
                  <Separator className="mb-6" />
                </div>
                <ul className="space-y-4">
                  {[
                    'ইসলামী জীবনদর্শনের আলোকে রচিত',
                    'সহজ বাংলায় গভীর বিষয় আলোচনা',
                    'প্রতিটি অধ্যায় বাস্তব জীবনের সাথে সম্পর্কিত',
                    'নতুন ও অভিজ্ঞ পাঠক উভয়ের জন্য উপযুক্ত',
                    'উচ্চমানের প্রিন্ট ও বাঁধাই',
                  ].map((point, i) => (
                    <li key={i} className="flex items-start gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 mt-0.5">
                        <CheckCircle2 className="size-4 text-primary" />
                      </div>
                      <span className="text-muted-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Delivery info */}
      <section className="py-12 relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern" />
        <div className="container mx-auto max-w-5xl px-4 relative">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { icon: Package, title: 'সুরক্ষিত প্যাকেজিং', desc: 'প্রতিটি বই সযত্নে প্যাক করা হয়।' },
              { icon: Truck, title: 'সারাদেশে ডেলিভারি', desc: 'ঢাকাসহ সারাদেশে হোম ডেলিভারি।' },
              { icon: CheckCircle2, title: 'নিশ্চিত পেমেন্ট', desc: 'bKash, Nagad ও ক্যাশ অন ডেলিভারি।' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="group flex items-start gap-4 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-primary group-hover:scale-110 transition-transform">
                  <Icon className="size-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">{title}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Author section */}
      {author && (
        <section className="py-16">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="text-center mb-10">
              <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight mb-2 text-gradient-emerald">লেখক সম্পর্কে</h2>
              <Separator className="mx-auto w-16 mt-3 bg-primary/30" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-10">
              {author.photo_url ? (
                <img
                  src={author.photo_url}
                  alt={author.name}
                  className="size-36 rounded-full object-cover border-4 border-primary/20 shadow-lg shrink-0 animate-float"
                />
              ) : (
                <div className="size-36 rounded-full gradient-emerald border-4 border-primary/20 flex items-center justify-center shrink-0 animate-float">
                  <span className="text-3xl text-white font-bold">হ</span>
                </div>
              )}
              <div className="space-y-4 text-center md:text-left">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{author.name}</h3>
                  {author.name_en && <p className="text-muted-foreground">{author.name_en}</p>}
                </div>
                <p className="text-muted-foreground leading-relaxed max-w-xl">{author.short_bio || author.full_bio}</p>
                <Button variant="outline" asChild className="border-primary/30">
                  <Link to="/author">লেখক সম্পর্কে আরও জানুন <ArrowRight className="size-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Other books */}
      {otherBooks.length > 0 && (
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 islamic-pattern" />
          <div className="container mx-auto max-w-5xl px-4 relative">
            <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight mb-8 text-center text-gradient-emerald">অন্যান্য বই</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherBooks.map((book, i) => (
                <div key={book.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight mb-8 text-center text-gradient-emerald">সাধারণ প্রশ্নাবলী</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {[
              { q: 'অর্ডার করতে কতক্ষণ লাগে?', a: 'সাধারণত ঢাকায় ২-৩ দিন এবং ঢাকার বাইরে ৩-৫ কার্যদিবসের মধ্যে ডেলিভারি দেওয়া হয়।' },
              { q: 'পেমেন্ট কীভাবে করতে হয়?', a: 'আপনি bKash, Nagad অথবা ক্যাশ অন ডেলিভারির মাধ্যমে পেমেন্ট করতে পারবেন।' },
              { q: 'ই-বুক কীভাবে পড়ব?', a: 'অর্ডার নিশ্চিত হওয়ার পর আপনার অ্যাকাউন্ট থেকে সরাসরি ব্রাউজারে পড়তে পারবেন।' },
              { q: 'অর্ডার বাতিল করা যাবে কি?', a: 'ডেলিভারি প্রক্রিয়া শুরু হওয়ার আগে অর্ডার বাতিল করা যাবে। আমাদের সাথে যোগাযোগ করুন।' },
              { q: 'বাল্ক অর্ডারে কি ছাড় পাওয়া যায়?', a: 'হ্যাঁ, একাধিক কপি অর্ডারে বিশেষ ছাড় পাওয়া যায়। বিস্তারিত বইয়ের পেইজে দেখুন।' },
            ].map(({ q, a }, i) => (
              <AccordionItem key={i} value={`q${i}`} className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
                <AccordionTrigger className="text-left px-4 hover:no-underline">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground px-4">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      {featuredBook && (
        <section className="py-16 relative overflow-hidden gradient-emerald">
          <div className="absolute inset-0 islamic-pattern-dark" />
          <div className="container mx-auto max-w-3xl px-4 text-center space-y-6 relative">
            <h2 className="scroll-m-20 text-3xl font-bold tracking-tight text-white">আপনার কপি এখনই সংগ্রহ করুন</h2>
            <p className="text-white/80 text-lg">সীমিত স্টক। দেরি না করে এখনই অর্ডার করুন।</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="bg-white text-emerald-700 hover:bg-white/90">
                <Link to={`/book/${featuredBook.slug}`}>বইটি দেখুন</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Link to="/cart">কার্ট দেখুন</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
