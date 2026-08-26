import { Link } from 'react-router-dom'
import { BookText, Phone, Mail, Globe } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export function PublicFooter() {
  return (
    <footer className="relative border-t border-border/50 mt-16 overflow-hidden">
      <div className="absolute inset-0 islamic-pattern" />
      <div className="container mx-auto max-w-5xl px-4 py-12 relative">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex size-8 items-center justify-center rounded-lg gradient-emerald">
                <BookText className="size-5 text-white" />
              </div>
              <span className="font-semibold text-gradient-emerald">Hamid Store</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              মোঃ হামিদুল হক নাবিলের বই সরাসরি অর্ডার করুন। প্রিমিয়াম মানের ইসলামী বই।
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold mb-3">দ্রুত লিংক</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/books" className="hover:text-primary transition-colors">বইসমূহ</Link></li>
              <li><Link to="/author" className="hover:text-primary transition-colors">লেখক সম্পর্কে</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">যোগাযোগ</Link></li>
              <li><Link to="/account" className="hover:text-primary transition-colors">আমার অর্ডার</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-3">যোগাযোগ</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Phone className="size-3.5 text-primary" /><span>যোগাযোগ নম্বর</span></li>
              <li className="flex items-center gap-2"><Mail className="size-3.5 text-primary" /><span>ইমেইল</span></li>
            </ul>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="flex size-8 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"><Globe className="size-4" /></a>
              <a href="#" className="flex size-8 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"><Globe className="size-4" /></a>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© ২০২৫ Hamid Store। সর্বস্বত্ব সংরক্ষিত।</p>
          <p>মোঃ হামিদুল হক নাবিল</p>
        </div>
      </div>
    </footer>
  )
}
