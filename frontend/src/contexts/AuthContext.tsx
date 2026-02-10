import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile, AppRole } from '../lib/types'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  role: AppRole
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const DEFAULT_ROLE: AppRole = 'user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at, updated_at')
      .eq('id', userId)
      .single()
    if (error) {
      console.warn('Profile fetch failed:', error.message)
      setProfile(null)
      return DEFAULT_ROLE
    }
    setProfile(data as Profile)
    return (data?.role as AppRole) ?? DEFAULT_ROLE
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    const session = supabase.auth.getSession()
    session.then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id).then(() => setLoading(false))
      } else {
        setLoading(false)
      }
    }).catch(() => setLoading(false))

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  const role: AppRole = profile?.role ?? DEFAULT_ROLE

  const value: AuthContextValue = {
    user,
    profile,
    role,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
