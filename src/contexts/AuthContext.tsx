import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { Customer } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextValue {
  user: User | null
  session: Session | null
  customer: Customer | null
  isAdmin: boolean
  loading: boolean
  signUp: (email: string, password: string, name: string, phone: string) => Promise<{ error: string | null }>
  signIn: (identifier: string, password: string) => Promise<{ error: string | null }>
  adminSignIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  adminSignOut: () => Promise<void>
  refreshCustomer: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  adminResetPassword: () => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchCustomer = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle()
    setCustomer(data)
  }, [])

  const refreshCustomer = useCallback(async () => {
    if (user) await fetchCustomer(user.id)
  }, [user, fetchCustomer])

  // Customer session listener — only listens to the customer-scoped client
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      const u = session?.user ?? null
      setUser(u)
      setIsAdmin(false) // Customer client is never admin
      if (u) fetchCustomer(u.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      const u = session?.user ?? null
      setUser(u)
      setIsAdmin(false)
      if (u) {
        ;(async () => { await fetchCustomer(u.id) })()
      } else {
        setCustomer(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchCustomer])

  const signUp = async (email: string, password: string, name: string, phone: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    if (data.user) {
      const { error: profileError } = await supabase.from('customers').insert({
        auth_user_id: data.user.id,
        name,
        phone,
        email,
      })
      if (profileError) return { error: profileError.message }
      await fetchCustomer(data.user.id)
    }
    return { error: null }
  }

  const signIn = async (identifier: string, password: string) => {
    const email = identifier.includes('@') ? identifier : identifier + '@hamidstore.temp'
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: 'ফোন/ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' }
    // Block admin users from customer login
    if (data.user?.app_metadata?.role === 'admin') {
      await supabase.auth.signOut()
      return { error: 'এই অ্যাকাউন্ট দিয়ে গ্রাহক লগইন করা যাবে না।' }
    }
    return { error: null }
  }

  const adminSignIn = async (email: string, password: string) => {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })
    if (error) return { error: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' }
    if (data.user?.app_metadata?.role !== 'admin') {
      await supabaseAdmin.auth.signOut()
      return { error: 'আপনার অ্যাডমিন অনুমতি নেই।' }
    }
    setIsAdmin(true)
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setCustomer(null)
  }

  const adminSignOut = async () => {
    await supabaseAdmin.auth.signOut()
    setIsAdmin(false)
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) return { error: 'পুনঃসেট লিংক পাঠাতে সমস্যা হয়েছে' }
    return { error: null }
  }

  const adminResetPassword = async () => {
    const { data: { user } } = await supabaseAdmin.auth.getUser()
    if (!user) return { error: 'অ্যাডমিন সেশন পাওয়া যায়নি' }
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(user.email!)
    if (error) return { error: 'পুনঃসেট লিংক পাঠাতে সমস্যা হয়েছে' }
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{ user, session, customer, isAdmin, loading, signUp, signIn, adminSignIn, signOut, adminSignOut, refreshCustomer, resetPassword, adminResetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
