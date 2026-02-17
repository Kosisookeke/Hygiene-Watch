import type { User } from 'firebase/auth'

export type AppRole = 'user' | 'inspector' | 'admin'

export interface Profile {
  id: string
  full_name: string | null
  email?: string | null
  role: AppRole
  created_at: string
  updated_at: string
  location?: string | null
  phone?: string | null
  about_me?: string | null
  avatar_url?: string | null
}

export interface AuthState {
  user: User | null
  profile: Profile | null
  role: AppRole
  loading: boolean
  signOut: () => Promise<void>
}

export type TipCategory =
  | 'Personal Hygiene'
  | 'Water Safety'
  | 'Waste Management'
  | 'Sanitation'
  | 'Food Safety'
  | 'Drainage'
  | 'Safety'
  | 'Other'

export interface Tip {
  id: string
  title: string
  description: string
  category: TipCategory
  author: string
  authorId?: string
  approved: boolean
  createdAt: string
  updatedAt: string
}

export type ReportIssueCategory =
  | 'Waste Management'
  | 'Water Safety'
  | 'Sanitation'
  | 'Drainage'
  | 'Personal Hygiene'
  | 'Food Safety'
  | 'Other'

export interface Report {
  id: string
  title: string
  description: string
  category?: ReportIssueCategory
  location?: string
  photoUrl?: string
  lat?: number
  lng?: number
  status: 'pending' | 'in_review' | 'resolved'
  submittedBy: string
  submittedById: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  targetType: 'tip' | 'report'
  targetId: string
  author: string
  authorId: string
  body: string
  createdAt: string
}
