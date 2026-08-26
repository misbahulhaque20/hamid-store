import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function SignUpPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
      return
    }
    const emailVal = email || `${phone}@hamidstore.temp`
    setLoading(true)
    const { error } = await signUp(emailVal, password, name, phone)
    setLoading(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('নিবন্ধন সফল হয়েছে')
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
        <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">নিবন্ধন</h1>
        <p className="text-sm text-muted-foreground mt-1">নতুন অ্যাকাউন্ট তৈরি করুন</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">নাম <span className="text-destructive">*</span></Label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="আপনার নাম" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">ফোন নম্বর <span className="text-destructive">*</span></Label>
          <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="০১৭xxxxxxx" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">ইমেইল <span className="text-muted-foreground text-xs">(ঐচ্ছিক)</span></Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">পাসওয়ার্ড <span className="text-destructive">*</span></Label>
          <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="কমপক্ষে ৬ অক্ষর" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'অপেক্ষা করুন...' : 'নিবন্ধন করুন'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">লগইন করুন</Link>
      </div>
    </div>
  )
}
