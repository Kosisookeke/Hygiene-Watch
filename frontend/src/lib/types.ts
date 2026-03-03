import type { User } from 'firebase/auth'

export type AppRole = 'user' | 'admin' | 'inspector'

/** Supported inspection regions (extensible) */
export const INSPECTION_REGIONS = [
  { value: 'lagos_nigeria', label: 'Lagos, Nigeria' },
  { value: 'kigali_rwanda', label: 'Kigali, Rwanda' },
] as const

export type InspectionRegion = (typeof INSPECTION_REGIONS)[number]['value']

export interface Profile {
  id: string
  full_name: string | null
  email?: string | null
  role: AppRole
  created_at: string
  updated_at: string
  location?: string | null
  /** Inspector-only: assigned region for location-based report visibility */
  assignedRegion?: InspectionRegion | null
  phone?: string | null
  about_me?: string | null
  avatar_url?: string | null
  anonymous_tips?: boolean
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

export type ReportStatus = 'pending' | 'in_review' | 'accepted' | 'in_progress' | 'resolved' | 'rejected'

export interface ReportStatusEntry {
  status: ReportStatus
  timestamp: string
  description?: string
}

export interface Report {
  id: string
  title: string
  description: string
  category?: ReportIssueCategory
  location?: string
  /** Region for inspector assignment (e.g. lagos_nigeria, kigali_rwanda) */
  region?: InspectionRegion
  photoUrl?: string
  lat?: number
  lng?: number
  status: ReportStatus
  submittedBy: string
  submittedById: string
  createdAt: string
  updatedAt: string
  statusHistory?: ReportStatusEntry[]
  resolutionFeedback?: string
  resolutionPhotoUrl?: string
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
