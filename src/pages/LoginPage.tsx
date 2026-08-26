import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(identifier, password)
    setLoading(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('সফলভাবে লগইন হয়েছে')
      navigate('/account')
    }
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <BookOpen className="size-6 text-primary" />
          <span className="font-bold text-lg">Hamid Store</span>
        </div>
        <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">লগইন</h1>
        <p className="text-sm text-muted-foreground mt-1">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="identifier">ফোন অথবা ইমেইল</Label>
          <Input
            id="identifier"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder="০১৭xxxxxxx অথবা ইমেইল"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">পাসওয়ার্ড</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="পাসওয়ার্ড"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'অপেক্ষা করুন...' : 'লগইন করুন'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        নতুন ব্যবহারকারী?{' '}
        <Link to="/signup" className="text-primary font-medium hover:underline">নিবন্ধন করুন</Link>
      </div>
      <div className="mt-2 text-center">
        <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">পাসওয়ার্ড ভুলে গেছেন?</Link>
      </div>
    </div>
  )
}
