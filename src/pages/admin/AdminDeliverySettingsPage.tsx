import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import type { DeliverySettings } from '@/lib/supabase'
import { toast } from 'sonner'

export function AdminDeliverySettingsPage() {
  const [settings, setSettings] = useState<DeliverySettings | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('delivery_settings').select('*').maybeSingle().then(({ data }) => setSettings(data))
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    const { error } = await supabase.from('delivery_settings').update({
      dhaka_charge: Number(settings.dhaka_charge),
      outside_dhaka_charge: Number(settings.outside_dhaka_charge),
      pickup_charge: Number(settings.pickup_charge),
      pickup_location: settings.pickup_location,
      pickup_instructions: settings.pickup_instructions,
      pickup_enabled: settings.pickup_enabled,
      home_delivery_enabled: settings.home_delivery_enabled,
    }).eq('id', settings.id)
    setSaving(false)
    if (error) toast.error('সংরক্ষণ ব্যর্থ')
    else toast.success('ডেলিভারি সেটিংস সংরক্ষিত')
  }

  if (!settings) return <div className="animate-pulse text-muted-foreground">লোড হচ্ছে...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ডেলিভারি সেটিংস</h1>
        <p className="text-sm text-muted-foreground">ডেলিভারি চার্জ ও তথ্য</p>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div><div className="font-medium text-sm">হোম ডেলিভারি</div><div className="text-xs text-muted-foreground">গ্রাহকের ঠিকানায়</div></div>
        <Switch checked={settings.home_delivery_enabled} onCheckedChange={v => setSettings({ ...settings, home_delivery_enabled: v })} />
      </div>

      {settings.home_delivery_enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>ঢাকার ভিতরে (৳)</Label><Input type="number" value={settings.dhaka_charge} onChange={e => setSettings({ ...settings, dhaka_charge: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>ঢাকার বাইরে (৳)</Label><Input type="number" value={settings.outside_dhaka_charge} onChange={e => setSettings({ ...settings, outside_dhaka_charge: Number(e.target.value) })} /></div>
        </div>
      )}

      <Separator />

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div><div className="font-medium text-sm">পিকআপ</div><div className="text-xs text-muted-foreground">গ্রাহক নিজে তুলে নেবে</div></div>
        <Switch checked={settings.pickup_enabled} onCheckedChange={v => setSettings({ ...settings, pickup_enabled: v })} />
      </div>

      {settings.pickup_enabled && (
        <>
          <div className="space-y-2"><Label>পিকআপ চার্জ (৳)</Label><Input type="number" value={settings.pickup_charge} onChange={e => setSettings({ ...settings, pickup_charge: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>পিকআপ লোকেশন</Label><Input value={settings.pickup_location || ''} onChange={e => setSettings({ ...settings, pickup_location: e.target.value })} /></div>
          <div className="space-y-2"><Label>নির্দেশনা</Label><Textarea value={settings.pickup_instructions || ''} onChange={e => setSettings({ ...settings, pickup_instructions: e.target.value })} rows={2} /></div>
        </>
      )}

      <Separator />
      <Button onClick={handleSave} disabled={saving}>{saving ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}</Button>
    </div>
  )
}
