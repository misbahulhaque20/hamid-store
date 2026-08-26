import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase'
import type { EmailSettings } from '@/lib/supabase'
import { toast } from 'sonner'
import { Mail, Save } from 'lucide-react'

export function AdminEmailSettingsPage() {
  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('email_settings').select('*').maybeSingle().then(({ data }) => setSettings(data))
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    const { error } = await supabase.from('email_settings').update({
      smtp_host: settings.smtp_host,
      smtp_port: settings.smtp_port,
      smtp_username: settings.smtp_username,
      smtp_password: settings.smtp_password,
      from_email: settings.from_email,
      from_name: settings.from_name,
      enabled: settings.enabled,
    }).eq('id', settings.id)
    setSaving(false)
    if (error) toast.error('সংরক্ষণ ব্যর্থ')
    else toast.success('ইমেইল সেটিংস সংরক্ষিত হয়েছে')
  }

  if (!settings) return <div className="animate-pulse text-muted-foreground">লোড হচ্ছে...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ইমেইল SMTP সেটিংস</h1>
        <p className="text-sm text-muted-foreground">অর্ডারের প্রতিটি ধাপে গ্রাহককে ইমেইল পাঠানো হবে</p>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-primary" />
          <div>
            <div className="text-sm font-semibold">ইমেইল নোটিফিকেশন</div>
            <div className="text-xs text-muted-foreground">চালু করলে অর্ডারের সব ধাপে ইমেইল যাবে</div>
          </div>
        </div>
        <Switch checked={settings.enabled} onCheckedChange={v => setSettings({ ...settings, enabled: v })} />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>SMTP হোস্ট</Label>
          <Input value={settings.smtp_host || ''} onChange={e => setSettings({ ...settings, smtp_host: e.target.value })} placeholder="smtp.gmail.com" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>SMTP পোর্ট</Label>
            <Input type="number" value={settings.smtp_port || 587} onChange={e => setSettings({ ...settings, smtp_port: Number(e.target.value) })} placeholder="587" />
          </div>
          <div className="space-y-2">
            <Label>প্রেরকের নাম</Label>
            <Input value={settings.from_name || ''} onChange={e => setSettings({ ...settings, from_name: e.target.value })} placeholder="Hamid Store" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>SMTP ইউজারনেম</Label>
          <Input value={settings.smtp_username || ''} onChange={e => setSettings({ ...settings, smtp_username: e.target.value })} placeholder="your-email@gmail.com" />
        </div>
        <div className="space-y-2">
          <Label>SMTP পাসওয়ার্ড / অ্যাপ পাসওয়ার্ড</Label>
          <Input type="password" value={settings.smtp_password || ''} onChange={e => setSettings({ ...settings, smtp_password: e.target.value })} placeholder="••••••••" />
        </div>
        <div className="space-y-2">
          <Label>প্রেরকের ইমেইল</Label>
          <Input type="email" value={settings.from_email || ''} onChange={e => setSettings({ ...settings, from_email: e.target.value })} placeholder="noreply@hamidstore.com" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        <Save className="size-4 mr-1" />
        {saving ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}
      </Button>
    </div>
  )
}
