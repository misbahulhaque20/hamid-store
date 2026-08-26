import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Menu, BookText, Moon, Sun, Monitor, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/theme-provider'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

const navLinks = [
  { to: '/', label: 'হোম' },
  { to: '/books', label: 'বইসমূহ' },
  { to: '/author', label: 'লেখক' },
  { to: '/contact', label: 'যোগাযোগ' },
]

export function PublicHeader() {
  const { count } = useCart()
  const { user } = useAuth()
  const { setTheme } = useTheme()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 glass">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <div className="flex size-8 items-center justify-center rounded-lg gradient-emerald">
            <BookText className="size-5 text-white" />
          </div>
          <span className="text-base text-gradient-emerald">Hamid Store</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm transition-colors hover:text-primary relative ${location.pathname === l.to ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
            >
              {l.label}
              {location.pathname === l.to && <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full gradient-emerald" />}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Sun className="size-4 dark:hidden" />
                <Moon className="size-4 hidden dark:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}><Sun className="size-4 mr-2" />লাইট</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}><Moon className="size-4 mr-2" />ডার্ক</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}><Monitor className="size-4 mr-2" />সিস্টেম</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Cart */}
          <Button variant="ghost" size="icon-sm" asChild className="relative">
            <Link to="/cart">
              <ShoppingCart className="size-4" />
              {count > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full px-1 text-[10px] bg-gradient-to-r from-emerald-500 to-teal-600 border-0">{count}</Badge>
              )}
            </Link>
          </Button>

          {/* Account */}
          {user ? (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/account" className="text-sm flex items-center gap-1"><User className="size-3.5" />অ্যাকাউন্ট</Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login" className="text-sm">লগইন</Link>
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="md:hidden">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex items-center gap-2 mt-4 mb-6">
                <div className="flex size-8 items-center justify-center rounded-lg gradient-emerald">
                  <BookText className="size-5 text-white" />
                </div>
                <span className="font-semibold text-gradient-emerald">Hamid Store</span>
              </div>
              <nav className="flex flex-col gap-4">
                {navLinks.map(l => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={`text-sm font-medium hover:text-primary transition-colors py-1 ${location.pathname === l.to ? 'text-primary' : 'text-foreground'}`}
                  >
                    {l.label}
                  </Link>
                ))}
                <hr className="border-border" />
                {user ? (
                  <Link to="/account" onClick={() => setOpen(false)} className="text-sm font-medium">আমার অ্যাকাউন্ট</Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium">লগইন</Link>
                    <Link to="/signup" onClick={() => setOpen(false)} className="text-sm font-medium">নিবন্ধন</Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
