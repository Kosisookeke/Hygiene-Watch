import {
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db, hasFirebaseConfig } from './firebase'
import type { Tip, Report, Comment, TipCategory, ReportIssueCategory } from './types'

const TIPS_COLLECTION = 'tips'
const REPORTS_COLLECTION = 'reports'
const COMMENTS_COLLECTION = 'comments'
const TIP_LIKES_COLLECTION = 'tip_likes'
const ACTIVITY_LOG_COLLECTION = 'activity_log'

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

function docToReport(d: { id: string; data: () => Record<string, unknown> }): Report {
  const data = d.data()
  return {
    id: d.id,
    title: (data.title as string) ?? '',
    description: (data.description as string) ?? '',
    category: data.category as ReportIssueCategory | undefined,
    location: data.location as string | undefined,
    photoUrl: data.photoUrl as string | undefined,
    lat: data.lat as number | undefined,
    lng: data.lng as number | undefined,
    status: (data.status as Report['status']) ?? 'pending',
    submittedBy: (data.submittedBy as string) ?? '',
    submittedById: (data.submittedById as string) ?? '',
    createdAt: (data.createdAt as string) ?? '',
    updatedAt: (data.updatedAt as string) ?? '',
  }
}

// —— Tips (getDocs instead of onSnapshot to avoid Firestore INTERNAL ASSERTION FAILED) ————

async function fetchTips(): Promise<Tip[]> {
  if (!hasFirebaseConfig || !db) return []
  const q = query(
    collection(db, TIPS_COLLECTION),
    where('approved', '==', true),
    orderBy('createdAt', 'desc'),
    limit(100)
  )
  const snap = await getDocs(q)
  return snap.docs.map(docToTip)
}

export function subscribeTips(callback: (tips: Tip[]) => void): Unsubscribe | null {
  if (!hasFirebaseConfig || !db) return null
  let cancelled = false
  const run = async () => {
    if (cancelled) return
    try {
      const tips = await fetchTips()
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
  let cancelled = false
  const run = async () => {
    if (cancelled) return
    try {
      const q = query(
        collection(db, REPORTS_COLLECTION),
        where('submittedById', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
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

/** Reports and tips for dashboard charts - community-wide data */
export function subscribeDashboardChartData(
  callback: (data: { reports: Report[]; tips: Tip[] }) => void
): Unsubscribe | null {
  if (!hasFirebaseConfig || !db) return null
  let cancelled = false
  const run = async () => {
    if (cancelled) return
    try {
      const [reportsSnap, tipsSnap] = await Promise.all([
        getDocs(query(
          collection(db, REPORTS_COLLECTION),
          orderBy('createdAt', 'desc'),
          limit(200)
        )),
        getDocs(query(
          collection(db, TIPS_COLLECTION),
          where('approved', '==', true),
          orderBy('createdAt', 'desc'),
          limit(200)
        )),
      ])
      const reports = reportsSnap.docs.map(docToReport)
      const tips = tipsSnap.docs.map(docToTip)
      if (!cancelled) callback({ reports, tips })
    } catch {
      if (!cancelled) callback({ reports: [], tips: [] })
    }
  }
  run()
  const timer = setInterval(run, POLL_MS)
  return () => {
    cancelled = true
    clearInterval(timer)
  }
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

export async function getReport(id: string): Promise<Report | null> {
  if (!hasFirebaseConfig || !db) return null
  try {
    const snap = await getDoc(doc(db, REPORTS_COLLECTION, id))
    if (!snap.exists()) return null
    const data = snap.data()
    return {
      id: snap.id,
      title: (data.title as string) ?? '',
      description: (data.description as string) ?? '',
      category: data.category as Report['category'],
      location: data.location as string | undefined,
      photoUrl: data.photoUrl as string | undefined,
      lat: data.lat as number | undefined,
      lng: data.lng as number | undefined,
      status: (data.status as Report['status']) ?? 'pending',
      submittedBy: (data.submittedBy as string) ?? '',
      submittedById: (data.submittedById as string) ?? '',
      createdAt: (data.createdAt as string) ?? '',
      updatedAt: (data.updatedAt as string) ?? '',
    }
  } catch {
    return null
  }
}

export async function addReport(data: {
  title: string
  description: string
  category?: string
  location?: string
  photoUrl?: string
  lat?: number
  lng?: number
  submittedBy: string
  submittedById: string
}): Promise<string> {
  if (!hasFirebaseConfig || !db) throw new Error('Firestore not configured')
  try {
    const now = new Date().toISOString()
    const payload: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      submittedBy: data.submittedBy,
      submittedById: data.submittedById,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }
    if (data.category != null) payload.category = data.category
    if (data.location != null) payload.location = data.location
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
  let cancelled = false
  const run = async () => {
    if (cancelled) return
    try {
      const q = query(
        collection(db, COMMENTS_COLLECTION),
        where('targetType', '==', targetType),
        where('targetId', '==', targetId),
        orderBy('createdAt', 'asc')
      )
      const snap = await getDocs(q)
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
      if (!cancelled) callback(comments)
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

// —— Likes ———————————————————————————————————————————————————————————————

export async function likeTip(tipId: string, userId: string): Promise<void> {
  if (!hasFirebaseConfig || !db) throw new Error('Firestore not configured')
  const ref = doc(db, TIP_LIKES_COLLECTION, `${tipId}_${userId}`)
  await setDoc(ref, { tipId, userId }, { merge: true })
}

export async function unlikeTip(tipId: string, userId: string): Promise<void> {
  if (!hasFirebaseConfig || !db) return
  try {
    await deleteDoc(doc(db, TIP_LIKES_COLLECTION, `${tipId}_${userId}`))
  } catch {
    // Doc may not exist if already unliked
  }
}

export async function getTipLikeCount(tipId: string): Promise<number> {
  if (!hasFirebaseConfig || !db) return 0
  const snap = await getDocs(
    query(collection(db, TIP_LIKES_COLLECTION), where('tipId', '==', tipId))
  )
  return snap.size
}

export async function getUserLikedTip(tipId: string, userId: string): Promise<boolean> {
  if (!hasFirebaseConfig || !db) return false
  const snap = await getDoc(doc(db, TIP_LIKES_COLLECTION, `${tipId}_${userId}`))
  return snap.exists()
}
