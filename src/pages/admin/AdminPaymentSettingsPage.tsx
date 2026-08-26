import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import type { PaymentSettings } from '@/lib/supabase'
import { toast } from 'sonner'

export function AdminPaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('payment_settings').select('*').maybeSingle().then(({ data }) => setSettings(data))
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    const { error } = await supabase.from('payment_settings').update({
      bkash_enabled: settings.bkash_enabled, bkash_number: settings.bkash_number, bkash_instructions: settings.bkash_instructions,
      nagad_enabled: settings.nagad_enabled, nagad_number: settings.nagad_number, nagad_instructions: settings.nagad_instructions,
      cod_enabled: settings.cod_enabled,
    }).eq('id', settings.id)
    setSaving(false)
    if (error) toast.error('সংরক্ষণ ব্যর্থ')
    else toast.success('পেমেন্ট সেটিংস সংরক্ষিত')
  }

  if (!settings) return <div className="animate-pulse text-muted-foreground">লোড হচ্ছে...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">পেমেন্ট সেটিংস</h1>
        <p className="text-sm text-muted-foreground">পেমেন্ট পদ্ধতি পরিচালনা</p>
      </div>

      {/* bKash */}
      <section className="space-y-4 rounded-lg border p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">bKash</h3>
          <Switch checked={settings.bkash_enabled} onCheckedChange={v => setSettings({ ...settings, bkash_enabled: v })} />
        </div>
        {settings.bkash_enabled && (
          <>
            <div className="space-y-2"><Label>নম্বর</Label><Input value={settings.bkash_number} onChange={e => setSettings({ ...settings, bkash_number: e.target.value })} placeholder="01XXXXXXXXX" /></div>
            <div className="space-y-2"><Label>নির্দেশনা</Label><Textarea value={settings.bkash_instructions} onChange={e => setSettings({ ...settings, bkash_instructions: e.target.value })} rows={2} /></div>
          </>
        )}
      </section>

      {/* Nagad */}
      <section className="space-y-4 rounded-lg border p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Nagad</h3>
          <Switch checked={settings.nagad_enabled} onCheckedChange={v => setSettings({ ...settings, nagad_enabled: v })} />
        </div>
        {settings.nagad_enabled && (
          <>
            <div className="space-y-2"><Label>নম্বর</Label><Input value={settings.nagad_number} onChange={e => setSettings({ ...settings, nagad_number: e.target.value })} placeholder="01XXXXXXXXX" /></div>
            <div className="space-y-2"><Label>নির্দেশনা</Label><Textarea value={settings.nagad_instructions} onChange={e => setSettings({ ...settings, nagad_instructions: e.target.value })} rows={2} /></div>
          </>
        )}
      </section>

      {/* COD */}
      <section className="space-y-4 rounded-lg border p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">ক্যাশ অন ডেলিভারি</h3>
          <Switch checked={settings.cod_enabled} onCheckedChange={v => setSettings({ ...settings, cod_enabled: v })} />
        </div>
      </section>

      <Separator />
      <Button onClick={handleSave} disabled={saving}>{saving ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}</Button>
    </div>
  )
}
