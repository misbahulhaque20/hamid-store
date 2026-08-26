import { useEffect, useState } from 'react'
import { Globe, Phone, Mail, MapPin, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import type { AuthorProfile, DeliverySettings } from '@/lib/supabase'
import { toast } from 'sonner'

export function ContactPage() {
  const [author, setAuthor] = useState<AuthorProfile | null>(null)
  const [delivery, setDelivery] = useState<DeliverySettings | null>(null)

  useEffect(() => {
    supabase.from('author_profile').select('*').maybeSingle().then(({ data }) => setAuthor(data))
    supabase.from('delivery_settings').select('*').maybeSingle().then(({ data }) => setDelivery(data))
  }, [])

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} কপি হয়েছে`)
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight mb-2">যোগাযোগ</h1>
        <p className="text-muted-foreground">Hamid Store — মোঃ হামিদুল হক নাবিল</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Contact info card */}
        <div className="rounded-lg border bg-card p-6 space-y-6">
          <h2 className="font-semibold text-lg">যোগাযোগের তথ্য</h2>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {author?.phone && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="size-3.5" />ফোন</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{author.phone}</span>
                  <Button variant="ghost" size="icon-sm" onClick={() => copyText(author.phone!, 'ফোন নম্বর')}><Copy className="size-3.5" /></Button>
                </div>
              </div>
            )}
            {author?.email && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="size-3.5" />ইমেইল</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{author.email}</span>
                  <Button variant="ghost" size="icon-sm" onClick={() => copyText(author.email!, 'ইমেইল')}><Copy className="size-3.5" /></Button>
                </div>
              </div>
            )}
            {author?.address && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3.5" />ঠিকানা</div>
                <div className="font-medium">{author.address}</div>
              </div>
            )}
          </div>

          {/* Social links */}
          <div className="flex items-center gap-4 pt-2">
            {author?.facebook_url && <a href={author.facebook_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Globe className="size-5" /></a>}
            {author?.instagram_url && <a href={author.instagram_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Globe className="size-5" /></a>}
            {author?.youtube_url && <a href={author.youtube_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Globe className="size-5" /></a>}
          </div>
        </div>

        {/* Pickup info */}
        {delivery?.pickup_enabled && delivery.pickup_location && (
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="font-semibold text-lg">পিকআপ তথ্য</h2>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="size-5 text-primary mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">পিকআপ লোকেশন</div>
                  <div className="font-medium">{delivery.pickup_location}</div>
                </div>
              </div>
              {delivery.pickup_instructions && (
                <p className="text-sm text-muted-foreground">{delivery.pickup_instructions}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
