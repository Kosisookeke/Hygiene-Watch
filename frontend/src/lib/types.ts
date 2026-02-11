import type { User } from 'firebase/auth'

export type AppRole = 'user' | 'inspector' | 'admin'

export interface Profile {
  id: string
  full_name: string | null
  email?: string | null
  role: AppRole
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  profile: Profile | null
  role: AppRole
  loading: boolean
  signOut: () => Promise<void>
}
