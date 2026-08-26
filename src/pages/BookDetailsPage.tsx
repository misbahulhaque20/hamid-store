import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, Zap, Minus, Plus, Check, BookOpen, FileText, ArrowLeft, ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { supabase } from '@/lib/supabase'
import type { Book, BookPricingTier, BookPage } from '@/lib/supabase'
import { formatCurrency, getBookPrice } from '@/lib/store'
import { useCart } from '@/contexts/CartContext'
import { toast } from 'sonner'
import { Book3DMockup } from '@/components/Book3DMockup'
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty'

export function BookDetailsPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [book, setBook] = useState<Book | null>(null)
  const [tiers, setTiers] = useState<BookPricingTier[]>([])
  const [pages, setPages] = useState<BookPage[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [format, setFormat] = useState<'physical' | 'ebook'>('physical')
  const [previewIndex, setPreviewIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    supabase.from('books').select('*').eq('slug', slug).maybeSingle().then(({ data }) => {
      setBook(data)
      setLoading(false)
      if (data) {
        supabase.from('book_pricing_tiers').select('*').eq('book_id', data.id).order('min_quantity').then(({ data: t }) => setTiers(t || []))
        supabase.from('book_pages').select('*').eq('book_id', data.id).order('page_number').then(({ data: p }) => setPages(p || []))
      }
    })
  }, [slug])

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-20">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="h-96 w-64 rounded-lg bg-muted" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 rounded bg-muted" />
            <div className="h-6 w-1/2 rounded bg-muted" />
            <div className="h-40 w-full rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-20">
        <Empty>
          <EmptyMedia variant="icon"><BookOpen className="size-6" /></EmptyMedia>
          <EmptyTitle>বই পাওয়া যায়নি</EmptyTitle>
          <EmptyDescription>এই বইটি আর প্রকাশিত নেই অথবা ভুল লিংক।</EmptyDescription>
          <Button asChild><Link to="/books">বইসমূহে ফিরুন</Link></Button>
        </Empty>
      </div>
    )
  }

  const unitPrice = format === 'ebook'
    ? (book.ebook_free ? 0 : book.ebook_price || 0)
    : getBookPrice(book, quantity, tiers)

  const subtotal = format === 'ebook' ? unitPrice : unitPrice * quantity

  const handleAddToCart = async () => {
    await addItem(book.id, format === 'ebook' ? 1 : quantity, format, book)
    toast.success('কার্টে যোগ করা হয়েছে')
  }

  const handleBuyNow = async () => {
    await addItem(book.id, format === 'ebook' ? 1 : quantity, format, book)
    navigate('/checkout')
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="container mx-auto max-w-5xl px-4 pt-6">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link to="/books"><ArrowLeft className="size-4 mr-1" />বইসমূহ</Link>
        </Button>
      </div>

      {/* Main book section */}
      <section id="order" className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Cover */}
          <div className="flex flex-col items-center gap-6">
            <Book3DMockup coverUrl={book.cover_url} title={book.title} className="w-56 md:w-64" />
            {book.additional_images?.length > 0 && (
              <div className="flex gap-2">
                <img src={book.cover_url ?? ''} alt="cover" className="size-16 rounded border object-cover" />
                {book.additional_images.slice(0, 4).map((img, i) => (
                  <img key={i} src={img} alt={`extra ${i}`} className="size-16 rounded border object-cover" />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                {book.is_new && <Badge>নতুন</Badge>}
                {book.is_bestseller && <Badge variant="secondary">বেস্টসেলার</Badge>}
                {book.is_featured && <Badge variant="outline">ফিচার্ড</Badge>}
              </div>
              <h1 className="scroll-m-20 text-3xl font-bold tracking-tight leading-tight">{book.title}</h1>
              {book.subtitle && <p className="text-lg text-muted-foreground">{book.subtitle}</p>}
              <p className="text-sm text-muted-foreground">লেখক: {book.author}</p>
            </div>

            {book.short_description && (
              <p className="text-muted-foreground leading-relaxed">{book.short_description}</p>
            )}

            <Separator />

            {/* Format selection */}
            <div className="space-y-3">
              <div className="text-sm font-medium">ফরম্যাট নির্বাচন করুন</div>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormat('physical')}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${format === 'physical' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
                >
                  <BookOpen className="size-4" />
                  <div className="text-left">
                    <div className="font-medium">প্রিন্টেড বই</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(book.physical_price)}</div>
                  </div>
                  {format === 'physical' && <Check className="size-4 text-primary ml-2" />}
                </button>
                {book.ebook_enabled && (
                  <button
                    onClick={() => setFormat('ebook')}
                    className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${format === 'ebook' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
                  >
                    <FileText className="size-4" />
                    <div className="text-left">
                      <div className="font-medium">ই-বুক</div>
                      <div className="text-xs text-muted-foreground">
                        {book.ebook_free ? 'ফ্রি' : formatCurrency(book.ebook_price || 0)}
                      </div>
                    </div>
                    {format === 'ebook' && <Check className="size-4 text-primary ml-2" />}
                  </button>
                )}
              </div>
            </div>

            {/* Quantity (physical only) */}
            {format === 'physical' && (
              <div className="space-y-3">
                <div className="text-sm font-medium">পরিমাণ</div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-12 text-center font-medium text-lg">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="size-4" />
                  </Button>
                  {book.stock > 0 ? (
                    <span className="text-xs text-green-600 ml-2">স্টকে আছে ({book.stock} কপি)</span>
                  ) : (
                    <span className="text-xs text-destructive ml-2">স্টকে নেই</span>
                  )}
                </div>
                {/* Quantity pricing tiers */}
                {book.quantity_pricing_enabled && tiers.length > 0 && (
                  <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">পরিমাণ অনুযায়ী ছাড়:</div>
                    {tiers.map(t => (
                      <div key={t.id} className="flex justify-between text-sm">
                        <span>{t.min_quantity}+ কপি</span>
                        <span className="font-medium">{formatCurrency(t.price)} / কপি</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Price + actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(subtotal)}</div>
                  {format === 'physical' && quantity > 1 && (
                    <div className="text-xs text-muted-foreground">{formatCurrency(unitPrice)} × {quantity}</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleAddToCart} variant="outline" size="lg" className="flex-1">
                  <ShoppingCart className="size-4" />কার্টে যোগ করুন
                </Button>
                <Button onClick={handleBuyNow} size="lg" className="flex-1">
                  <Zap className="size-4" />এখনই কিনুন
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Page preview */}
      {pages.length > 0 && (
        <section className="container mx-auto max-w-3xl px-4 py-12">
          <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-6 text-center">বইয়ের প্রিভিউ</h2>
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="relative flex items-center justify-center bg-muted/20 min-h-[400px]">
              <img
                src={pages[previewIndex]?.image_url}
                alt={`পৃষ্ঠা ${previewIndex + 1}`}
                className="max-h-[500px] object-contain transition-transform"
                style={{ transform: `scale(${zoom})` }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2"
                onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                disabled={previewIndex === 0}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2"
                onClick={() => setPreviewIndex(Math.min(pages.length - 1, previewIndex + 1))}
                disabled={previewIndex === pages.length - 1}
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>
                  <ZoomOut className="size-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon-sm" onClick={() => setZoom(Math.min(2, zoom + 0.25))}>
                  <ZoomIn className="size-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">পৃষ্ঠা {previewIndex + 1} / {pages.length}</span>
              <Button variant="ghost" size="icon-sm" onClick={() => setFullscreen(!fullscreen)}>
                <Maximize2 className="size-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Tabs: description, info, faq */}
      <section className="container mx-auto max-w-3xl px-4 py-8">
        <Tabs defaultValue="description">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="description">বইটি সম্পর্কে</TabsTrigger>
            <TabsTrigger value="info">বইয়ের তথ্য</TabsTrigger>
            <TabsTrigger value="faq">প্রশ্নাবলী</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="pt-6">
            {book.description ? (
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line leading-relaxed">
                {book.description}
              </div>
            ) : (
              <p className="text-muted-foreground">এই বই সম্পর্কে বিস্তারিত তথ্য শীঘ্রই আসবে।</p>
            )}
          </TabsContent>

          <TabsContent value="info" className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {book.author && <InfoRow label="লেখক" value={book.author} />}
              {book.edition && <InfoRow label="সংস্করণ" value={book.edition} />}
              {book.page_count && <InfoRow label="পৃষ্ঠা" value={`${book.page_count}`} />}
              {book.category && <InfoRow label="বিভাগ" value={book.category} />}
              {book.isbn && <InfoRow label="ISBN" value={book.isbn} />}
              {book.sku && <InfoRow label="SKU" value={book.sku} />}
              {book.publication_date && <InfoRow label="প্রকাশনী তারিখ" value={book.publication_date} />}
              {book.tags.length > 0 && <InfoRow label="ট্যাগ" value={book.tags.join(', ')} />}
            </div>
          </TabsContent>

          <TabsContent value="faq" className="pt-6">
            <Accordion type="single" collapsible className="space-y-2">
              {[
                { q: 'ডেলিভারি কতদিনে পাব?', a: 'ঢাকায় ২-৩ দিন, ঢাকার বাইরে ৩-৫ কার্যদিবস।' },
                { q: 'পেমেন্ট কীভাবে করব?', a: 'bKash, Nagad অথবা ক্যাশ অন ডেলিভারি।' },
                { q: 'ই-বুক কীভাবে পড়ব?', a: 'অর্ডার নিশ্চিত হওয়ার পর আপনার অ্যাকাউন্ট থেকে পড়তে পারবেন।' },
                { q: 'একসাথে অনেক কপি কিনলে ছাড় আছে কি?', a: 'হ্যাঁ, পরিমাণ অনুযায়ী ছাড় স্বয়ংক্রিয়ভাবে প্রযোজ্য হবে।' },
              ].map(({ q, a }, i) => (
                <AccordionItem key={i} value={`f${i}`}>
                  <AccordionTrigger>{q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        </Tabs>
      </section>

      {/* Final CTA */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto max-w-3xl px-4 text-center space-y-4">
          <h2 className="text-2xl font-bold">আপনার কপি এখনই সংগ্রহ করুন</h2>
          <Button asChild variant="secondary" size="lg">
            <Link to="/cart">কার্টে যান</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}


