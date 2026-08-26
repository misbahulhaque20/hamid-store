import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import type { SiteSettings } from '@/lib/supabase'
import { useColorTheme, THEMES, type ThemeName } from '@/contexts/ColorThemeContext'
import { Check } from 'lucide-react'
import { toast } from 'sonner'

export function AdminAppearancePage() {
  const { activeTheme, setColorTheme } = useColorTheme()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('site_settings').select('*').maybeSingle().then(({ data }) => {
      if (data) {
        setSettings(data)
        if (data.active_theme) setColorTheme(data.active_theme as ThemeName)
      }
    })
  }, [])

  const applyTheme = (theme: ThemeName) => {
    setColorTheme(theme)
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    const { error } = await supabase.from('site_settings').update({
      default_theme: settings.default_theme,
      active_theme: activeTheme,
    }).eq('id', settings.id)
    setSaving(false)
    if (error) toast.error('সংরক্ষণ ব্যর্থ')
    else toast.success('থিম সংরক্ষিত হয়েছে')
  }

  if (!settings) return <div className="animate-pulse text-muted-foreground">লোড হচ্ছে...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">অ্যাপিয়ারেন্স</h1>
        <p className="text-sm text-muted-foreground">থিম ও রঙ নির্বাচন করুন</p>
      </div>

      {/* Theme selector */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">থিম নির্বাচন করুন</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {THEMES.map(theme => (
            <Card
              key={theme.id}
              className={`relative cursor-pointer p-4 transition-all hover:shadow-lg ${activeTheme === theme.id ? 'ring-2 ring-primary shadow-md' : 'hover:border-primary/30'}`}
              onClick={() => applyTheme(theme.id)}
            >
              {activeTheme === theme.id && (
                <div className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" />
                </div>
              )}
              <div className="flex gap-2 mb-3">
                {theme.colors.map((color, i) => (
                  <div key={i} className="size-8 rounded-full" style={{ background: color }} />
                ))}
              </div>
              <div className="text-sm font-medium">{theme.name}</div>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">থিম সিলেক্ট করার সাথে সাথে প্রিভিউ দেখা যাবে। সেভ করতে নিচের বাটনে ক্লিক করুন।</p>
      </div>

      {/* Dark/Light mode */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">ডিফল্ট মোড</h3>
        <Select value={settings.default_theme} onValueChange={v => setSettings({ ...settings, default_theme: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="light">লাইট</SelectItem>
            <SelectItem value="dark">ডার্ক</SelectItem>
            <SelectItem value="system">সিস্টেম</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSave} disabled={saving}>{saving ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}</Button>
    </div>
  )
}
