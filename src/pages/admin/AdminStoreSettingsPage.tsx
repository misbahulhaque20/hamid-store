import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import type { SiteSettings, AuthorProfile } from '@/lib/supabase'
import { ImageUpload } from '@/components/ImageUpload'
import { toast } from 'sonner'

export function AdminStoreSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [author, setAuthor] = useState<AuthorProfile | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('site_settings').select('*').maybeSingle().then(({ data }) => setSettings(data))
    supabase.from('author_profile').select('*').maybeSingle().then(({ data }) => setAuthor(data))
  }, [])

  const saveSettings = async () => {
    if (!settings) return
    setSaving(true)
    const { error } = await supabase.from('site_settings').update({
      store_name: settings.store_name, store_tagline: settings.store_tagline,
      logo_url: settings.logo_url, favicon_url: settings.favicon_url,
      meta_title: settings.meta_title, meta_description: settings.meta_description,
    }).eq('id', settings.id)
    setSaving(false)
    if (error) toast.error('সংরক্ষণ ব্যর্থ')
    else toast.success('স্টোর তথ্য সংরক্ষিত')
  }

  const saveAuthor = async () => {
    if (!author) return
    setSaving(true)
    const { error } = await supabase.from('author_profile').update({
      name: author.name, name_en: author.name_en, photo_url: author.photo_url,
      short_bio: author.short_bio, full_bio: author.full_bio,
      phone: author.phone, email: author.email, address: author.address,
      facebook_url: author.facebook_url, instagram_url: author.instagram_url,
      youtube_url: author.youtube_url, whatsapp: author.whatsapp,
    }).eq('id', author.id)
    setSaving(false)
    if (error) toast.error('সংরক্ষণ ব্যর্থ')
    else toast.success('লেখক তথ্য সংরক্ষিত')
  }

  if (!settings || !author) return <div className="animate-pulse text-muted-foreground">লোড হচ্ছে...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">স্টোর ও লেখক</h1>
        <p className="text-sm text-muted-foreground">স্টোর ও লেখকের তথ্য পরিচালনা</p>
      </div>

      <Tabs defaultValue="store">
        <TabsList>
          <TabsTrigger value="store">স্টোর</TabsTrigger>
          <TabsTrigger value="author">লেখক</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="pt-6 max-w-2xl space-y-4">
          <div className="space-y-2"><Label>স্টোরের নাম</Label><Input value={settings.store_name} onChange={e => setSettings({ ...settings, store_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>ট্যাগলাইন</Label><Input value={settings.store_tagline || ''} onChange={e => setSettings({ ...settings, store_tagline: e.target.value })} /></div>
          <div className="space-y-2"><Label>লোগো</Label><ImageUpload value={settings.logo_url || null} onChange={url => setSettings({ ...settings, logo_url: url })} bucket="author-photos" label="লোগো আপলোড করুন" aspectRatio="square" className="max-w-[120px]" /></div>
          <div className="space-y-2"><Label>ফেভিকন</Label><ImageUpload value={settings.favicon_url || null} onChange={url => setSettings({ ...settings, favicon_url: url })} bucket="author-photos" label="ফেভিকন আপলোড" aspectRatio="square" className="max-w-[80px]" /></div>
          <Separator />
          <div className="space-y-2"><Label>SEO শিরোনাম</Label><Input value={settings.meta_title || ''} onChange={e => setSettings({ ...settings, meta_title: e.target.value })} /></div>
          <div className="space-y-2"><Label>SEO বর্ণনা</Label><Textarea value={settings.meta_description || ''} onChange={e => setSettings({ ...settings, meta_description: e.target.value })} rows={2} /></div>
          <Button onClick={saveSettings} disabled={saving}>{saving ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}</Button>
        </TabsContent>

        <TabsContent value="author" className="pt-6 max-w-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>নাম</Label><Input value={author.name} onChange={e => setAuthor({ ...author, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>নাম (ইংরেজি)</Label><Input value={author.name_en || ''} onChange={e => setAuthor({ ...author, name_en: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>ছবি</Label><ImageUpload value={author.photo_url || null} onChange={url => setAuthor({ ...author, photo_url: url })} bucket="author-photos" label="ছবি আপলোড করুন" aspectRatio="square" className="max-w-[150px]" /></div>
          <div className="space-y-2"><Label>সংক্ষিপ্ত জীবনী</Label><Textarea value={author.short_bio || ''} onChange={e => setAuthor({ ...author, short_bio: e.target.value })} rows={2} /></div>
          <div className="space-y-2"><Label>বিস্তারিত জীবনী</Label><Textarea value={author.full_bio || ''} onChange={e => setAuthor({ ...author, full_bio: e.target.value })} rows={6} /></div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>ফোন</Label><Input value={author.phone || ''} onChange={e => setAuthor({ ...author, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>ইমেইল</Label><Input value={author.email || ''} onChange={e => setAuthor({ ...author, email: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>ঠিকানা</Label><Input value={author.address || ''} onChange={e => setAuthor({ ...author, address: e.target.value })} /></div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Facebook URL</Label><Input value={author.facebook_url || ''} onChange={e => setAuthor({ ...author, facebook_url: e.target.value })} /></div>
            <div className="space-y-2"><Label>Instagram URL</Label><Input value={author.instagram_url || ''} onChange={e => setAuthor({ ...author, instagram_url: e.target.value })} /></div>
            <div className="space-y-2"><Label>YouTube URL</Label><Input value={author.youtube_url || ''} onChange={e => setAuthor({ ...author, youtube_url: e.target.value })} /></div>
            <div className="space-y-2"><Label>WhatsApp</Label><Input value={author.whatsapp || ''} onChange={e => setAuthor({ ...author, whatsapp: e.target.value })} /></div>
          </div>
          <Button onClick={saveAuthor} disabled={saving}>{saving ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}</Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}
