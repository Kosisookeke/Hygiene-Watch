import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, hasFirebaseConfig } from '../lib/firebase'
import type { Profile, AppRole } from '../lib/types'

const PROFILES_COLLECTION = 'profiles'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  role: AppRole
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const DEFAULT_ROLE: AppRole = 'user'

function profileFromDoc(id: string, data: Record<string, unknown> | undefined): Profile | null {
  if (!data) return null
  return {
    id,
    full_name: (data.full_name as string) ?? null,
    email: (data.email as string) ?? null,
    role: (data.role as AppRole) ?? DEFAULT_ROLE,
    created_at: (data.created_at as string) ?? '',
    updated_at: (data.updated_at as string) ?? '',
    location: (data.location as string) ?? null,
    phone: (data.phone as string) ?? null,
    about_me: (data.about_me as string) ?? null,
    avatar_url: (data.avatar_url as string) ?? null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setLoading(false)
      return
    }
    let profileUnsub: (() => void) | null = null
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (profileUnsub) {
        profileUnsub()
        profileUnsub = null
      }
      setUser(firebaseUser ?? null)
      if (!firebaseUser) {
        setProfile(null)
        setLoading(false)
        return
      }
      // Show page immediately with user; profile loads via getDoc (avoids onSnapshot crash)
      setLoading(false)
      const profileRef = doc(db, PROFILES_COLLECTION, firebaseUser.uid)
      let cancelled = false
      const fetchProfile = async () => {
        if (cancelled) return
        try {
          const snap = await getDoc(profileRef)
          if (cancelled) return
          if (snap.exists()) {
            setProfile(profileFromDoc(firebaseUser.uid, snap.data()))
          } else {
            const now = new Date().toISOString()
            const newProfile = {
              full_name: firebaseUser.displayName ?? null,
              email: firebaseUser.email ?? null,
              role: DEFAULT_ROLE,
              created_at: now,
              updated_at: now,
              location: null,
              phone: null,
              about_me: null,
              avatar_url: null,
            }
            try {
              await setDoc(profileRef, newProfile)
            } catch {
              // may already exist
            }
            if (!cancelled) setProfile({ id: firebaseUser.uid, ...newProfile })
          }
        } catch {
          if (!cancelled) setProfile(null)
        }
      }
      fetchProfile()
      const timer = setInterval(fetchProfile, 30_000)
      profileUnsub = () => {
        cancelled = true
        clearInterval(timer)
      }
    })
    return () => {
      if (profileUnsub) profileUnsub()
      unsubAuth()
    }
  }, [])

  const signOut = useCallback(async () => {
    if (hasFirebaseConfig) await firebaseSignOut(auth)
    setUser(null)
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!hasFirebaseConfig || !db || !user) return
    try {
      const profileRef = doc(db, PROFILES_COLLECTION, user.uid)
      const snap = await getDoc(profileRef)
      if (snap.exists()) {
        setProfile(profileFromDoc(user.uid, snap.data()))
      }
    } catch {
      // Keep existing profile on error
    }
  }, [user])

  const role: AppRole = profile?.role ?? DEFAULT_ROLE

  const value: AuthContextValue = {
    user,
    profile,
    role,
    loading,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
