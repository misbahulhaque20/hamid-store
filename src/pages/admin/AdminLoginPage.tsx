import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BookText, ShieldCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function AdminLoginPage() {
  const { adminSignIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await adminSignIn(email, password)
    setLoading(false)
    if (error) toast.error(error)
    else { toast.success('অ্যাডমিন লগইন সফল'); navigate('/admin') }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-background to-background px-4">
      {/* Decorative Islamic pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M30 0L37 23L60 30L37 37L30 60L23 37L0 30L23 23Z' fill='%2310b981'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
            <BookText className="size-8 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="font-bold text-xl text-foreground">Hamid Store</h1>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <ShieldCheck className="size-3" /> অ্যাডমিন প্যানেল
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-6 shadow-xl">
          <div className="space-y-2">
            <Label htmlFor="email">অ্যাডমিন ইমেইল</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@hamidstore.com"
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">পাসওয়ার্ড</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-background/50"
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md" disabled={loading}>
            {loading ? <><Loader2 className="size-4 animate-spin mr-1" />অপেক্ষা করুন...</> : 'লগইন করুন'}
          </Button>
        </form>

        <div className="text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">স্টোরে ফিরুন</Link>
        </div>
      </div>
    </div>
  )
}
