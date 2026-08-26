import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function ForgotPasswordPage() {
  const { adminResetPassword } = useAuth()
  const [mode, setMode] = useState<'customer' | 'admin'>('customer')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (mode === 'customer') {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      setLoading(false)
      if (error) toast.error('পুনঃসেট লিংক পাঠাতে সমস্যা হয়েছে')
      else { setSent(true); toast.success('পুনঃসেট লিংক পাঠানো হয়েছে') }
    } else {
      // Admin: reset using admin client
      const { data: { user } } = await supabaseAdmin.auth.getUser()
      if (!user) {
        // If no admin session, try reset by email
        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email)
        setLoading(false)
        if (error) toast.error('পুনঃসেট লিংক পাঠাতে সমস্যা হয়েছে')
        else { setSent(true); toast.success('পুনঃসেট লিংক পাঠানো হয়েছে') }
      } else {
        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(user.email!)
        setLoading(false)
        if (error) toast.error('পুনঃসেট লিংক পাঠাতে সমস্যা হয়েছে')
        else { setSent(true); toast.success('পুনঃসেট লিংক পাঠানো হয়েছে') }
      }
    }
  }

  if (sent) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">ইমেইল চেক করুন</h1>
        <p className="text-muted-foreground">আপনার ইমেইলে পাসওয়ার্ড পুনঃসেট লিংক পাঠানো হয়েছে।</p>
        <Button asChild variant="outline"><Link to="/login">লগইন পেইজে ফিরুন</Link></Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">পাসওয়ার্ড ভুলে গেছেন?</h1>
        <p className="text-sm text-muted-foreground mt-1">আপনার অ্যাকাউন্ট নির্বাচন করুন</p>
      </div>

      <div className="space-y-4 mb-6">
        <Select value={mode} onValueChange={v => setMode(v as 'customer' | 'admin')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="customer">গ্রাহক</SelectItem>
            <SelectItem value="admin">অ্যাডমিন</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">ইমেইল</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'অপেক্ষা করুন...' : 'পুনঃসেট লিংক পাঠান'}
        </Button>
      </form>
      <div className="mt-6 text-center">
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">লগইন পেইজে ফিরুন</Link>
      </div>
    </div>
  )
}
