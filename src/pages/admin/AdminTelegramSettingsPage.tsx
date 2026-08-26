import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface TelegramSettings {
  id: string
  enabled: boolean
  bot_token: string
  chat_id: string
  notification_time: string
  order_threshold: number
}

export function AdminTelegramSettingsPage() {
  const [settings, setSettings] = useState<TelegramSettings | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('telegram_settings').select('*').maybeSingle().then(({ data }) => setSettings(data))
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    const { error } = await supabase.from('telegram_settings').update({
      enabled: settings.enabled,
      bot_token: settings.bot_token,
      chat_id: settings.chat_id,
      notification_time: settings.notification_time,
      order_threshold: Number(settings.order_threshold),
    }).eq('id', settings.id)
    setSaving(false)
    if (error) toast.error('সংরক্ষণ ব্যর্থ')
    else toast.success('টেলিগ্রাম সেটিংস সংরক্ষিত')
  }

  if (!settings) return <div className="animate-pulse text-muted-foreground">লোড হচ্ছে...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">টেলিগ্রাম সতর্কতা</h1>
        <p className="text-sm text-muted-foreground">অর্ডার সারাংশ টেলিগ্রামে পাঠান</p>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div><div className="font-medium text-sm">সক্রিয়</div><div className="text-xs text-muted-foreground">প্রতিদিন রাতে সারাংশ পাঠাবে</div></div>
        <Switch checked={settings.enabled} onCheckedChange={v => setSettings({ ...settings, enabled: v })} />
      </div>

      {settings.enabled && (
        <div className="space-y-4">
          <div className="space-y-2"><Label>Bot Token</Label><Input type="password" value={settings.bot_token} onChange={e => setSettings({ ...settings, bot_token: e.target.value })} placeholder="123456:ABC-DEF..." /></div>
          <div className="space-y-2"><Label>Chat ID</Label><Input value={settings.chat_id} onChange={e => setSettings({ ...settings, chat_id: e.target.value })} placeholder="-1001234567890" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>নোটিফিকেশন সময়</Label><Input type="time" value={settings.notification_time} onChange={e => setSettings({ ...settings, notification_time: e.target.value })} /></div>
            <div className="space-y-2"><Label>অর্ডার থ্রেশহোল্ড</Label><Input type="number" value={settings.order_threshold} onChange={e => setSettings({ ...settings, order_threshold: Number(e.target.value) })} /></div>
          </div>
          <p className="text-xs text-muted-foreground">
            {settings.order_threshold}+ অর্ডার এলে এবং অনিশ্চিত অর্ডার থাকলে প্রতিদিন {settings.notification_time} এ সারাংশ পাঠানো হবে।
          </p>
        </div>
      )}

      <Separator />
      <Button onClick={handleSave} disabled={saving}>{saving ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}</Button>
    </div>
  )
}
