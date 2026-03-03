import {
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  type Unsubscribe,
} from 'firebase/firestore'
import { db, hasFirebaseConfig } from './firebase'
import type { Tip, Report, Comment, TipCategory, ReportIssueCategory, ReportStatusEntry, Profile, InspectionRegion } from './types'

const TIPS_COLLECTION = 'tips'
const REPORTS_COLLECTION = 'reports'
const COMMENTS_COLLECTION = 'comments'
const ACTIVITY_LOG_COLLECTION = 'activity_log'
const PROFILES_COLLECTION = 'profiles'

export type ActivityAction =
  | 'tip_submitted'
  | 'report_submitted'
  | 'profile_updated'
  | 'password_changed'
  | 'privacy_updated'
  | 'photo_updated'

const POLL_MS = 30_000

function docToTip(d: { id: string; data: () => Record<string, unknown> }): Tip {
  const data = d.data()
  return {
    id: d.id,
    title: (data.title as string) ?? '',
    description: (data.description as string) ?? '',
    category: (data.category as TipCategory) ?? 'Other',
    author: (data.author as string) ?? '',
    authorId: data.authorId as string | undefined,
    approved: Boolean(data.approved),
    createdAt: (data.createdAt as string) ?? '',
    updatedAt: (data.updatedAt as string) ?? '',
  }
}

function parseStatusHistory(raw: unknown): ReportStatusEntry[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((e): e is Record<string, unknown> => e != null && typeof e === 'object')
    .map((e) => ({
      status: (e.status as Report['status']) ?? 'pending',
      timestamp: (e.timestamp as string) ?? '',
      description: e.description as string | undefined,
    }))
}

function docToReport(d: { id: string; data: () => Record<string, unknown> }): Report {
  const data = d.data()
  return {
    id: d.id,
    title: (data.title as string) ?? '',
    description: (data.description as string) ?? '',
    category: data.category as ReportIssueCategory | undefined,
    location: data.location as string | undefined,
    region: data.region as Report['region'],
    photoUrl: data.photoUrl as string | undefined,
    lat: data.lat as number | undefined,
    lng: data.lng as number | undefined,
    status: (data.status as Report['status']) ?? 'pending',
    submittedBy: (data.submittedBy as string) ?? '',
    submittedById: (data.submittedById as string) ?? '',
    createdAt: (data.createdAt as string) ?? '',
    updatedAt: (data.updatedAt as string) ?? '',
    statusHistory: parseStatusHistory(data.statusHistory),
    resolutionFeedback: data.resolutionFeedback as string | undefined,
    resolutionPhotoUrl: data.resolutionPhotoUrl as string | undefined,
  }
}

// —— Tips (getDocs instead of onSnapshot to avoid Firestore INTERNAL ASSERTION FAILED) ————

async function fetchTips(): Promise<Tip[]> {
  if (!hasFirebaseConfig || !db) return []
  try {
    const q = query(
      collection(db, TIPS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(100)
    )
    const snap = await getDocs(q)
    return snap.docs.map(docToTip)
  } catch (err) {
    console.error('[fetchTips]', err)
    return []
  }
}

export function subscribeTips(callback: (tips: Tip[]) => void): Unsubscribe | null {
  if (!hasFirebaseConfig || !db) {
    callback([])
    return null
  }
  let cancelled = false
  const run = async () => {
    if (cancelled) return
    const tips = await fetchTips()
    if (!cancelled) callback(tips)
  }
  run()
  const timer = setInterval(run, POLL_MS)
  return () => {
    cancelled = true
    clearInterval(timer)
  }
}

export function subscribeTipsByUser(
  userId: string,
  callback: (tips: Tip[]) => void
): Unsubscribe | null {
  if (!hasFirebaseConfig || !db) return null
  let cancelled = false
  const run = async () => {
    if (cancelled) return
    try {
      const q = query(
        collection(db, TIPS_COLLECTION),
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const snap = await getDocs(q)
      const tips = snap.docs.map(docToTip)
      if (!cancelled) callback(tips)
    } catch {
      if (!cancelled) callback([])
    }
  }
  run()
  const timer = setInterval(run, POLL_MS)
  return () => {
    cancelled = true
    clearInterval(timer)
  }
}

export async function addTip(data: {
  title: string
  description: string
  category: TipCategory
  author: string
  authorId: string
}): Promise<string> {
  if (!hasFirebaseConfig || !db) throw new Error('Firestore not configured')
  const now = new Date().toISOString()
  const ref = await addDoc(collection(db, TIPS_COLLECTION), {
    title: data.title,
    description: data.description,
    category: data.category,
    author: data.author,
    authorId: data.authorId,
    approved: true,
    createdAt: now,
    updatedAt: now,
  })
  logActivity({
    userId: data.authorId,
    action: 'tip_submitted',
    description: `Hygiene tip "${data.title}" was submitted`,
    targetType: 'tip',
    targetId: ref.id,
  }).catch(() => {})
  return ref.id
}

export async function getTip(id: string): Promise<Tip | null> {
  if (!hasFirebaseConfig || !db) return null
  try {
    const snap = await getDoc(doc(db, TIPS_COLLECTION, id))
    if (!snap.exists()) return null
    const data = snap.data()
    return {
      id: snap.id,
      title: (data.title as string) ?? '',
      description: (data.description as string) ?? '',
      category: (data.category as TipCategory) ?? 'Other',
      author: (data.author as string) ?? '',
      authorId: data.authorId as string | undefined,
      approved: Boolean(data.approved),
      createdAt: (data.createdAt as string) ?? '',
      updatedAt: (data.updatedAt as string) ?? '',
    }
  } catch {
    return null
  }
}

// —— Reports —————————————————————————————————————————————————————————————

export function subscribeReportsByUser(
  userId: string,
  callback: (reports: Report[]) => void
): Unsubscribe | null {
  if (!hasFirebaseConfig || !db) return null
  const q = query(
    collection(db, REPORTS_COLLECTION),
    where('submittedById', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  )
  const unsub = onSnapshot(
    q,
    (snap) => {
      const reports = snap.docs.map(docToReport)
      callback(reports)
    },
    (err) => {
      console.error('subscribeReportsByUser error:', err)
      callback([])
    }
  )
  return () => unsub()
}

/** Recent activity (community-wide): all reports + approved tips, sorted by createdAt desc */
export function subscribeRecentActivity(callback: (items: Array<Report | Tip>) => void): Unsubscribe | null {
  if (!hasFirebaseConfig || !db) return null
  let cancelled = false
  const run = async () => {
    if (cancelled) return
    try {
      const [reportsSnap, tipsSnap] = await Promise.all([
        getDocs(query(
          collection(db, REPORTS_COLLECTION),
          orderBy('createdAt', 'desc'),
          limit(20)
        )),
        getDocs(query(
          collection(db, TIPS_COLLECTION),
          where('approved', '==', true),
          orderBy('createdAt', 'desc'),
          limit(20)
        )),
      ])
      const reports = reportsSnap.docs.map(docToReport)
      const tips = tipsSnap.docs.map(docToTip)
      const merged = [...reports, ...tips].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      if (!cancelled) callback(merged.slice(0, 20))
    } catch {
      if (!cancelled) callback([])
    }
  }
  run()
  const timer = setInterval(run, POLL_MS)
  return () => {
    cancelled = true
    clearInterval(timer)
  }
}

/** Log a user activity for the activity log */
export async function logActivity(data: {
  userId: string
  action: ActivityAction
  description: string
  targetType?: 'tip' | 'report'
  targetId?: string
}): Promise<void> {
  if (!hasFirebaseConfig || !db) return
  try {
    await addDoc(collection(db, ACTIVITY_LOG_COLLECTION), {
      userId: data.userId,
      action: data.action,
      description: data.description,
      targetType: data.targetType ?? null,
      targetId: data.targetId ?? null,
      createdAt: new Date().toISOString(),
    })
  } catch {
    /* ignore */
  }
}

export interface ActivityLogEntry {
  id: string
  userId: string
  action: ActivityAction
  description: string
  targetType?: 'tip' | 'report'
  targetId?: string
  createdAt: string
}

/** Subscribe to a user's activity log entries */
export function subscribeUserActivityLog(
  userId: string,
  callback: (entries: ActivityLogEntry[]) => void
): Unsubscribe | null {
  if (!hasFirebaseConfig || !db) return null
  let cancelled = false
  const run = async () => {
    if (cancelled) return
    try {
      const q = query(
        collection(db, ACTIVITY_LOG_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const snap = await getDocs(q)
      const entries: ActivityLogEntry[] = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          userId: (data.userId as string) ?? '',
          action: (data.action as ActivityAction) ?? 'profile_updated',
          description: (data.description as string) ?? '',
          targetType: data.targetType as 'tip' | 'report' | undefined,
          targetId: data.targetId as string | undefined,
          createdAt: (data.createdAt as string) ?? '',
        }
      })
      if (!cancelled) callback(entries)
    } catch {
      if (!cancelled) callback([])
    }
  }
  run()
  const timer = setInterval(run, POLL_MS)
  return () => {
    cancelled = true
    clearInterval(timer)
  }
}

/** Recent activity for a specific user: their reports + tips, sorted by createdAt */
export function subscribeRecentActivityByUser(
  userId: string,
  callback: (items: Array<Report | Tip>) => void
): Unsubscribe | null {
  if (!hasFirebaseConfig || !db) return null
  let cancelled = false
  const run = async () => {
    if (cancelled) return
    try {
      const [reportsSnap, tipsSnap] = await Promise.all([
        getDocs(query(
          collection(db, REPORTS_COLLECTION),
          where('submittedById', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(25)
        )),
        getDocs(query(
          collection(db, TIPS_COLLECTION),
          where('authorId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(25)
        )),
      ])
      const reports = reportsSnap.docs.map(docToReport)
      const tips = tipsSnap.docs.map(docToTip)
      const merged = [...reports, ...tips].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      if (!cancelled) callback(merged.slice(0, 15))
    } catch {
      if (!cancelled) callback([])
    }
  }
  run()
  const timer = setInterval(run, POLL_MS)
  return () => {
    cancelled = true
    clearInterval(timer)
  }
}

/** Admin: subscribe to all reports */
export function subscribeAllReports(callback: (reports: Report[]) => void): Unsubscribe | null {
  if (!hasFirebaseConfig || !db) return null
  let cancelled = false
  const run = async () => {
    if (cancelled) return
    try {
      const q = query(
        collection(db, REPORTS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(200)
      )
      const snap = await getDocs(q)
      const reports = snap.docs.map(docToReport)
      if (!cancelled) callback(reports)
    } catch {
      if (!cancelled) callback([])
    }
  }
  run()
  const timer = setInterval(run, POLL_MS)
  return () => {
    cancelled = true
    clearInterval(timer)
  }
}

/** Inspector: subscribe to reports in a specific region only (backend-filtered) */
export function subscribeReportsByRegion(
  region: InspectionRegion,
  callback: (reports: Report[]) => void
): Unsubscribe | null {
  if (!hasFirebaseConfig || !db) return null
  let cancelled = false
  const run = async () => {
    if (cancelled) return
    try {
      const q = query(
        collection(db, REPORTS_COLLECTION),
        where('region', '==', region),
        orderBy('createdAt', 'desc'),
        limit(200)
      )
      const snap = await getDocs(q)
      const reports = snap.docs.map(docToReport)
      if (!cancelled) callback(reports)
    } catch {
      if (!cancelled) callback([])
    }
  }
  run()
  const timer = setInterval(run, POLL_MS)
  return () => {
    cancelled = true
    clearInterval(timer)
  }
}

/** Admin: subscribe to all tips (including unapproved) */
export function subscribeAllTips(callback: (tips: Tip[]) => void): Unsubscribe | null {
  if (!hasFirebaseConfig || !db) return null
  let cancelled = false
  const run = async () => {
    if (cancelled) return
    try {
      const q = query(
        collection(db, TIPS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(200)
      )
      const snap = await getDocs(q)
      const tips = snap.docs.map(docToTip)
      if (!cancelled) callback(tips)
    } catch {
      if (!cancelled) callback([])
    }
  }
  run()
  const timer = setInterval(run, POLL_MS)
  return () => {
    cancelled = true
    clearInterval(timer)
  }
}

const STATUS_DESCRIPTIONS: Record<Report['status'], string> = {
  pending: 'Report submitted',
  in_review: 'Report under review by inspector',
  accepted: 'Report accepted',
  in_progress: 'Report in progress',
  resolved: 'Report resolved',
  rejected: 'Report rejected',
}

export async function updateReportStatus(
  reportId: string,
  status: Report['status']
): Promise<void> {
  if (!hasFirebaseConfig || !db) throw new Error('Firestore not configured')
  const now = new Date().toISOString()
  const entry: ReportStatusEntry = {
    status,
    timestamp: now,
    description: STATUS_DESCRIPTIONS[status],
  }
  await updateDoc(doc(db, REPORTS_COLLECTION, reportId), {
    status,
    updatedAt: now,
    statusHistory: arrayUnion(entry),
  })
}

export async function resolveReport(
  reportId: string,
  options: { feedback: string; photoUrl?: string }
): Promise<void> {
  if (!hasFirebaseConfig || !db) throw new Error('Firestore not configured')
  const now = new Date().toISOString()
  const entry: ReportStatusEntry = {
    status: 'resolved',
    timestamp: now,
    description: 'Report resolved',
  }
  await updateDoc(doc(db, REPORTS_COLLECTION, reportId), {
    status: 'resolved',
    updatedAt: now,
    statusHistory: arrayUnion(entry),
    resolutionFeedback: options.feedback.trim(),
    ...(options.photoUrl && { resolutionPhotoUrl: options.photoUrl }),
  })
}

export async function updateTipApproval(tipId: string, approved: boolean): Promise<void> {
  if (!hasFirebaseConfig || !db) throw new Error('Firestore not configured')
  await updateDoc(doc(db, TIPS_COLLECTION, tipId), {
    approved,
    updatedAt: new Date().toISOString(),
  })
}

function docDataToReport(id: string, data: Record<string, unknown>): Report {
  return {
    id,
    title: (data.title as string) ?? '',
    description: (data.description as string) ?? '',
    category: data.category as Report['category'],
    location: data.location as string | undefined,
    region: data.region as Report['region'],
    photoUrl: data.photoUrl as string | undefined,
    lat: data.lat as number | undefined,
    lng: data.lng as number | undefined,
    status: (data.status as Report['status']) ?? 'pending',
    submittedBy: (data.submittedBy as string) ?? '',
    submittedById: (data.submittedById as string) ?? '',
    createdAt: (data.createdAt as string) ?? '',
    updatedAt: (data.updatedAt as string) ?? '',
    statusHistory: parseStatusHistory(data.statusHistory),
    resolutionFeedback: data.resolutionFeedback as string | undefined,
    resolutionPhotoUrl: data.resolutionPhotoUrl as string | undefined,
  }
}

/** Subscribe to real-time report updates. Returns unsubscribe function. */
export function subscribeReport(
  reportId: string,
  callback: (report: Report | null) => void
): Unsubscribe | null {
  if (!hasFirebaseConfig || !db) return null
  const unsub = onSnapshot(
    doc(db, REPORTS_COLLECTION, reportId),
    (snap) => {
      if (!snap.exists()) {
        callback(null)
        return
      }
      callback(docDataToReport(snap.id, snap.data()))
    },
    (err) => {
      console.error('subscribeReport error:', err)
      callback(null)
    }
  )
  return () => unsub()
}

export async function getReport(id: string): Promise<Report | null> {
  if (!hasFirebaseConfig || !db) return null
  try {
    const snap = await getDoc(doc(db, REPORTS_COLLECTION, id))
    if (!snap.exists()) return null
    return docDataToReport(snap.id, snap.data())
  } catch {
    return null
  }
}

export async function addReport(data: {
  title: string
  description: string
  category?: string
  location?: string
  region?: InspectionRegion
  photoUrl?: string
  lat?: number
  lng?: number
  submittedBy: string
  submittedById: string
}): Promise<string> {
  if (!hasFirebaseConfig || !db) throw new Error('Firestore not configured')
  try {
    const now = new Date().toISOString()
    const initialEntry: ReportStatusEntry = {
      status: 'pending',
      timestamp: now,
      description: 'Report submitted',
    }
    const payload: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      submittedBy: data.submittedBy,
      submittedById: data.submittedById,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      statusHistory: [initialEntry],
    }
    if (data.category != null) payload.category = data.category
    if (data.location != null) payload.location = data.location
    if (data.region != null) payload.region = data.region
    if (data.photoUrl != null) payload.photoUrl = data.photoUrl
    if (data.lat != null) payload.lat = data.lat
    if (data.lng != null) payload.lng = data.lng
    const ref = await addDoc(collection(db, REPORTS_COLLECTION), payload)
    logActivity({
      userId: data.submittedById,
      action: 'report_submitted',
      description: `Report "${data.title}" was submitted`,
      targetType: 'report',
      targetId: ref.id,
    }).catch(() => {})
    return ref.id
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to submit report')
  }
}

// —— Comments —————————————————————————————————————————————————————————————

export function subscribeComments(
  targetType: 'tip' | 'report',
  targetId: string,
  callback: (comments: Comment[]) => void
): Unsubscribe | null {
  if (!hasFirebaseConfig || !db) return null
  const q = query(
    collection(db, COMMENTS_COLLECTION),
    where('targetType', '==', targetType),
    where('targetId', '==', targetId),
    orderBy('createdAt', 'asc')
  )
  const unsub = onSnapshot(
    q,
    (snap) => {
      const comments: Comment[] = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          targetType: (data.targetType as 'tip' | 'report') ?? targetType,
          targetId: (data.targetId as string) ?? targetId,
          author: (data.author as string) ?? '',
          authorId: (data.authorId as string) ?? '',
          body: (data.body as string) ?? '',
          createdAt: (data.createdAt as string) ?? '',
        }
      })
      callback(comments)
    },
    () => callback([])
  )
  return () => unsub()
}

export async function addComment(data: {
  targetType: 'tip' | 'report'
  targetId: string
  author: string
  authorId: string
  body: string
}): Promise<string> {
  if (!hasFirebaseConfig || !db) throw new Error('Firestore not configured')
  const now = new Date().toISOString()
  const ref = await addDoc(collection(db, COMMENTS_COLLECTION), {
    ...data,
    createdAt: now,
  })
  return ref.id
}

/** Admin: subscribe to all comments (tips and reports) */
export function subscribeAllComments(callback: (comments: Comment[]) => void): Unsubscribe | null {
  if (!hasFirebaseConfig || !db) return null
  const q = query(
    collection(db, COMMENTS_COLLECTION),
    orderBy('createdAt', 'desc')
  )
  const unsub = onSnapshot(
    q,
    (snap) => {
      const comments: Comment[] = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          targetType: (data.targetType as 'tip' | 'report') ?? 'tip',
          targetId: (data.targetId as string) ?? '',
          author: (data.author as string) ?? '',
          authorId: (data.authorId as string) ?? '',
          body: (data.body as string) ?? '',
          createdAt: (data.createdAt as string) ?? '',
        }
      })
      callback(comments)
    },
    () => callback([])
  )
  return () => unsub()
}

/** Admin: delete a comment */
export async function deleteComment(commentId: string): Promise<void> {
  if (!hasFirebaseConfig || !db) throw new Error('Firestore not configured')
  await deleteDoc(doc(db, COMMENTS_COLLECTION, commentId))
}

// —— Profiles (Admin: user management) ————————————————————————————————————

/** Admin: subscribe to all profiles for user management (all users in Firestore profiles collection) */
export function subscribeAllProfiles(callback: (profiles: Profile[]) => void): Unsubscribe | null {
  if (!hasFirebaseConfig || !db) return null
  const q = query(collection(db, PROFILES_COLLECTION), limit(500))
  const unsub = onSnapshot(
    q,
    (snap) => {
      const profiles = snap.docs
        .map((d) => {
          const data = d.data()
          return {
            id: d.id,
            full_name: (data.full_name as string) ?? null,
            email: (data.email as string) ?? null,
            role: (data.role as Profile['role']) ?? 'user',
            created_at: (data.created_at as string) ?? '',
            updated_at: (data.updated_at as string) ?? '',
            location: (data.location as string) ?? null,
            assignedRegion: (data.assignedRegion as Profile['assignedRegion']) ?? null,
            phone: (data.phone as string) ?? null,
            about_me: (data.about_me as string) ?? null,
            avatar_url: (data.avatar_url as string) ?? null,
            anonymous_tips: Boolean(data.anonymous_tips),
          }
        })
        .sort((a, b) => {
          const aTime = a.updated_at || a.created_at || ''
          const bTime = b.updated_at || b.created_at || ''
          return bTime.localeCompare(aTime)
        })
      callback(profiles)
    },
    (err) => {
      console.error('[subscribeAllProfiles]', err)
      callback([])
    }
  )
  return () => unsub()
}

/** Admin: update a user's role and assigned region (for inspectors) */
export async function updateProfileRole(
  userId: string,
  updates: { role: Profile['role']; assignedRegion?: InspectionRegion | null }
): Promise<void> {
  if (!hasFirebaseConfig || !db) throw new Error('Firestore not configured')
  const now = new Date().toISOString()
  const payload: Record<string, unknown> = {
    role: updates.role,
    updated_at: now,
  }
  if (updates.role === 'inspector') {
    payload.assignedRegion = updates.assignedRegion ?? null
  } else {
    payload.assignedRegion = null
  }
  await updateDoc(doc(db, PROFILES_COLLECTION, userId), payload)
}
