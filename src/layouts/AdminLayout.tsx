import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Package, Users, Wallet, Boxes, BookText, Store, Palette, Send, Mail, LogOut } from 'lucide-react'
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

const navItems = [
  { to: '/admin', label: 'ড্যাশবোর্ড', icon: LayoutDashboard, group: 'মূল' },
  { to: '/admin/books', label: 'বই ব্যবস্থাপনা', icon: BookOpen, group: 'মূল' },
  { to: '/admin/orders', label: 'অর্ডার', icon: Package, group: 'মূল' },
  { to: '/admin/customers', label: 'গ্রাহক', icon: Users, group: 'মূল' },
  { to: '/admin/stock', label: 'স্টক', icon: Boxes, group: 'মূল' },
  { to: '/admin/ledger', label: 'হিসাব', icon: Wallet, group: 'মূল' },
]

const settingsItems = [
  { to: '/admin/settings/store', label: 'স্টোর ও লেখক', icon: Store, group: 'সেটিংস' },
  { to: '/admin/settings/appearance', label: 'অ্যাপিয়ারেন্স', icon: Palette, group: 'সেটিংস' },
  { to: '/admin/settings/payment', label: 'পেমেন্ট', icon: Wallet, group: 'সেটিংস' },
  { to: '/admin/settings/delivery', label: 'ডেলিভারি', icon: Package, group: 'সেটিংস' },
  { to: '/admin/settings/telegram', label: 'টেলিগ্রাম', icon: Send, group: 'সেটিংস' },
  { to: '/admin/settings/email', label: 'ইমেইল SMTP', icon: Mail, group: 'সেটিংস' },
]

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAdmin, loading, adminSignOut } = useAuth()

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/admin/login')
  }, [isAdmin, loading, navigate])

  if (loading) return <div className="flex min-h-svh items-center justify-center"><div className="animate-pulse text-primary">লোড হচ্ছে...</div></div>
  if (!isAdmin) return null

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex size-8 items-center justify-center rounded-lg gradient-emerald shrink-0">
              <BookText className="size-5 text-white" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <div className="font-bold text-sm text-gradient-emerald">Hamid Store</div>
              <div className="text-[10px] text-muted-foreground">অ্যাডমিন প্যানেল</div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>মূল</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map(item => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.to} tooltip={item.label}>
                      <Link to={item.to}><item.icon /><span>{item.label}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>সেটিংস</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsItems.map(item => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.to} tooltip={item.label}>
                      <Link to={item.to}><item.icon /><span>{item.label}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="স্টোরে যান">
                <Link to="/"><Store /><span>স্টোর</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="লগআউট" onClick={() => adminSignOut()}>
                <button><LogOut /><span>লগআউট</span></button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b border-border/50 glass px-4">
          <SidebarTrigger />
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">অ্যাডমিন</span>
        </header>
        <div className="flex-1 p-4 md:p-6 islamic-pattern">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
