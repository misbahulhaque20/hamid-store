import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import type { Book } from '@/lib/supabase'
import { formatCurrency } from '@/lib/store'
import { ImageUpload } from '@/components/ImageUpload'
import { PdfUpload } from '@/components/PdfUpload'
import { toast } from 'sonner'

const emptyBook: Partial<Book> = {
  title: '', subtitle: '', slug: '', author: 'মোঃ হামিদুল হক নাবিল', short_description: '', description: '',
  cover_url: '', additional_images: [], category: '', tags: [], ranking: 1,
  is_featured: false, is_bestseller: false, is_new: true, is_published: true,
  physical_price: 0, ebook_price: 0, ebook_enabled: false, ebook_free: false, pdf_url: '',
  stock: 0, sku: '', isbn: '', page_count: 0, edition: '১ম সংস্করণ', publication_date: '',
  seo_title: '', seo_description: '', quantity_pricing_enabled: false, production_cost_enabled: false,
}

export function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Partial<Book> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchBooks = () => {
    supabase.from('books').select('*').order('ranking').then(({ data }) => setBooks(data || []))
  }

  useEffect(() => { fetchBooks() }, [])

  const filtered = books.filter(b => !search || b.title.toLowerCase().includes(search.toLowerCase()))

  const handleOpenNew = () => { setEditing({ ...emptyBook }); setIsNew(true) }
  const handleEdit = (book: Book) => { setEditing({ ...book }); setIsNew(false) }

  const handleSave = async () => {
    if (!editing) return
    if (!editing.title || !editing.slug) { toast.error('শিরোনাম ও স্লাগ আবশ্যক'); return }
    setSaving(true)
    const payload = {
      ...editing,
      tags: Array.isArray(editing.tags) ? editing.tags : [],
      additional_images: Array.isArray(editing.additional_images) ? editing.additional_images : [],
      physical_price: Number(editing.physical_price) || 0,
      ebook_price: editing.ebook_price ? Number(editing.ebook_price) : null,
      stock: Number(editing.stock) || 0,
      page_count: editing.page_count ? Number(editing.page_count) : null,
      ranking: Number(editing.ranking) || 1,
    }
    if (isNew) {
      const { error } = await supabase.from('books').insert(payload)
      if (error) toast.error('বই যোগ করতে সমস্যা')
      else toast.success('বই যোগ হয়েছে')
    } else {
      const { error } = await supabase.from('books').update(payload).eq('id', editing.id)
      if (error) toast.error('আপডেট ব্যর্থ')
      else toast.success('বই আপডেট হয়েছে')
    }
    setSaving(false)
    setEditing(null)
    fetchBooks()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from('books').delete().eq('id', deleteId)
    if (error) toast.error('মুছতে সমস্যা')
    else toast.success('বই মুছে ফেলা হয়েছে')
    setDeleteId(null)
    fetchBooks()
  }

  const togglePublish = async (book: Book) => {
    await supabase.from('books').update({ is_published: !book.is_published }).eq('id', book.id)
    fetchBooks()
  }

  const toggleFeatured = async (book: Book) => {
    await supabase.from('books').update({ is_featured: !book.is_featured }).eq('id', book.id)
    fetchBooks()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">বই ব্যবস্থাপনা</h1>
          <p className="text-sm text-muted-foreground">মোট {books.length}টি বই</p>
        </div>
        <Button onClick={handleOpenNew}><Plus className="size-4" />নতুন বই</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="বই খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>বই</TableHead>
              <TableHead>র‍্যাংক</TableHead>
              <TableHead>দাম</TableHead>
              <TableHead>স্টক</TableHead>
              <TableHead>ব্যাজ</TableHead>
              <TableHead>প্রকাশিত</TableHead>
              <TableHead>অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(book => (
              <TableRow key={book.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {book.cover_url && <img src={book.cover_url} alt="" className="size-10 rounded border object-cover" />}
                    <div>
                      <div className="font-medium text-sm line-clamp-1">{book.title}</div>
                      <div className="text-xs text-muted-foreground">{book.author}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{book.ranking}</TableCell>
                <TableCell className="text-sm font-medium">{formatCurrency(Number(book.physical_price))}</TableCell>
                <TableCell>
                  <span className={`text-sm ${book.stock < 5 ? 'text-destructive font-medium' : ''}`}>{book.stock}</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {book.is_featured && <Badge className="text-[10px]">ফিচার্ড</Badge>}
                    {book.is_bestseller && <Badge variant="secondary" className="text-[10px]">বেস্ট</Badge>}
                    {book.is_new && <Badge variant="outline" className="text-[10px]">নতুন</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon-sm" onClick={() => togglePublish(book)}>
                    {book.is_published ? <Eye className="size-4 text-green-600" /> : <EyeOff className="size-4 text-muted-foreground" />}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(book)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => toggleFeatured(book)}><Star className={`size-4 ${book.is_featured ? 'text-yellow-500 fill-yellow-500' : ''}`} /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(book.id)} className="text-destructive"><Trash2 className="size-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit/Create dialog */}
      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? 'নতুন বই যোগ করুন' : 'বই সম্পাদনা'}</DialogTitle>
            <DialogDescription>বইয়ের সকল তথ্য পূরণ করুন</DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-6">
              {/* Basic */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold">মূল তথ্য</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>শিরোনাম *</Label><Input value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} /></div>
                  <div className="space-y-2"><Label>সাবটাইটেল</Label><Input value={editing.subtitle || ''} onChange={e => setEditing({ ...editing, subtitle: e.target.value })} /></div>
                  <div className="space-y-2"><Label>স্লাগ *</Label><Input value={editing.slug || ''} onChange={e => setEditing({ ...editing, slug: e.target.value })} placeholder="nobobi-jibon-dorshon" /></div>
                  <div className="space-y-2"><Label>লেখক</Label><Input value={editing.author || ''} onChange={e => setEditing({ ...editing, author: e.target.value })} /></div>
                  <div className="space-y-2"><Label>বিভাগ</Label><Input value={editing.category || ''} onChange={e => setEditing({ ...editing, category: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>কভার ছবি</Label><ImageUpload value={editing.cover_url || null} onChange={url => setEditing({ ...editing, cover_url: url })} bucket="book-covers" label="কভার ছবি আপলোড করুন" aspectRatio="portrait" className="max-w-[160px]" /></div>
                <div className="space-y-2"><Label>সংক্ষিপ্ত বর্ণনা</Label><Textarea value={editing.short_description || ''} onChange={e => setEditing({ ...editing, short_description: e.target.value })} rows={2} /></div>
                <div className="space-y-2"><Label>বিস্তারিত বর্ণনা</Label><Textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={4} /></div>
              </section>

              {/* Pricing */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold">মূল্য ও স্টক</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>প্রিন্টেড দাম</Label><Input type="number" value={editing.physical_price ?? 0} onChange={e => setEditing({ ...editing, physical_price: Number(e.target.value) })} /></div>
                  <div className="space-y-2"><Label>স্টক</Label><Input type="number" value={editing.stock ?? 0} onChange={e => setEditing({ ...editing, stock: Number(e.target.value) })} /></div>
                  <div className="space-y-2"><Label>র‍্যাংক</Label><Input type="number" value={editing.ranking ?? 1} onChange={e => setEditing({ ...editing, ranking: Number(e.target.value) })} /></div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2"><Switch checked={editing.quantity_pricing_enabled} onCheckedChange={v => setEditing({ ...editing, quantity_pricing_enabled: v })} /><Label className="text-xs">পরিমাণ মূল্য</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={editing.production_cost_enabled} onCheckedChange={v => setEditing({ ...editing, production_cost_enabled: v })} /><Label className="text-xs">প্রোডাকশন খরচ</Label></div>
                </div>
              </section>

              {/* eBook */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold">ই-বুক</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><Switch checked={editing.ebook_enabled} onCheckedChange={v => setEditing({ ...editing, ebook_enabled: v })} /><Label className="text-xs">ই-বুক চালু</Label></div>
                  {editing.ebook_enabled && <div className="flex items-center gap-2"><Switch checked={editing.ebook_free} onCheckedChange={v => setEditing({ ...editing, ebook_free: v })} /><Label className="text-xs">ফ্রি</Label></div>}
                </div>
                {editing.ebook_enabled && !editing.ebook_free && (
                  <>
                  <div className="space-y-2"><Label>ই-বুক দাম</Label><Input type="number" value={editing.ebook_price ?? 0} onChange={e => setEditing({ ...editing, ebook_price: Number(e.target.value) })} /></div>
                  <div className="space-y-2"><Label>PDF ফাইল</Label><PdfUpload value={editing.pdf_url || null} onChange={path => setEditing({ ...editing, pdf_url: path })} /></div>
                  </>
                )}
              </section>

              {/* Meta */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold">মেটা ও প্রকাশনা</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>পৃষ্ঠা</Label><Input type="number" value={editing.page_count ?? 0} onChange={e => setEditing({ ...editing, page_count: Number(e.target.value) })} /></div>
                  <div className="space-y-2"><Label>সংস্করণ</Label><Input value={editing.edition || ''} onChange={e => setEditing({ ...editing, edition: e.target.value })} /></div>
                  <div className="space-y-2"><Label>ISBN</Label><Input value={editing.isbn || ''} onChange={e => setEditing({ ...editing, isbn: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>SEO শিরোনাম</Label><Input value={editing.seo_title || ''} onChange={e => setEditing({ ...editing, seo_title: e.target.value })} /></div>
                <div className="space-y-2"><Label>SEO বর্ণনা</Label><Textarea value={editing.seo_description || ''} onChange={e => setEditing({ ...editing, seo_description: e.target.value })} rows={2} /></div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2"><Switch checked={editing.is_published} onCheckedChange={v => setEditing({ ...editing, is_published: v })} /><Label className="text-xs">প্রকাশিত</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={editing.is_featured} onCheckedChange={v => setEditing({ ...editing, is_featured: v })} /><Label className="text-xs">ফিচার্ড</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={editing.is_bestseller} onCheckedChange={v => setEditing({ ...editing, is_bestseller: v })} /><Label className="text-xs">বেস্টসেলার</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={editing.is_new} onCheckedChange={v => setEditing({ ...editing, is_new: v })} /><Label className="text-xs">নতুন</Label></div>
                </div>
              </section>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>বই মুছবেন?</DialogTitle>
            <DialogDescription>এটি ফেরানো যাবে না।</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>না</Button>
            <Button variant="destructive" onClick={handleDelete}>হ্যাঁ, মুছুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
