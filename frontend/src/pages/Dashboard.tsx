import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeRecentActivityByUser, subscribeUserActivityLog } from '../lib/firestore'
import type { ActivityLogEntry } from '../lib/firestore'
import { IconMapPin, IconLightbulb, IconFileText, IconUser, IconShield } from '../components/Icons'
import type { Report, Tip } from '../lib/types'
import styles from './Dashboard.module.css'

function relativeTime(s: string): string {
  try {
    const d = new Date(s)
    const now = new Date()
    const sec = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (sec < 60) return 'just now'
    if (sec < 3600) return `${Math.floor(sec / 60)} minutes ago`
    if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`
    if (sec < 604800) return `${Math.floor(sec / 86400)} days ago`
    if (sec < 2592000) return `${Math.floor(sec / 604800)} weeks ago`
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return s
  }
}

type ActivityLogItem =
  | { kind: 'report'; id: string; title: string; createdAt: string; link: string }
  | { kind: 'tip'; id: string; title: string; createdAt: string; link: string }
  | { kind: 'log'; id: string; description: string; createdAt: string }

export default function Dashboard() {
  const { user, profile, role } = useAuth()
  const [reportsAndTips, setReportsAndTips] = useState<Array<Report | Tip>>([])
  const [logEntries, setLogEntries] = useState<ActivityLogEntry[]>([])

  useEffect(() => {
    if (!user) return
    const unsub = subscribeRecentActivityByUser(user.uid, setReportsAndTips)
    return () => unsub?.()
  }, [user?.uid])

  useEffect(() => {
    if (!user) return
    const unsub = subscribeUserActivityLog(user.uid, setLogEntries)
    return () => unsub?.()
  }, [user?.uid])

  const activityLog = useMemo(() => {
    const items: ActivityLogItem[] = []
    reportsAndTips.forEach((item) => {
      if ('submittedById' in item) {
        items.push({
          kind: 'report',
          id: item.id,
          title: item.title,
          createdAt: item.createdAt,
          link: `/reports/${item.id}`,
        })
      } else {
        items.push({
          kind: 'tip',
          id: (item as Tip).id,
          title: (item as Tip).title,
          createdAt: (item as Tip).createdAt,
          link: `/tips/${(item as Tip).id}`,
        })
      }
    })
    logEntries.forEach((e) => {
      items.push({
        kind: 'log',
        id: e.id,
        description: e.description,
        createdAt: e.createdAt,
      })
    })
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [reportsAndTips, logEntries])

  const displayName = profile?.full_name || user?.displayName || user?.email || 'User'

  return (
    <div className={styles.page}>
      {/* Welcome Section */}
      <section className={styles.welcomeSection}>
        <p className={styles.welcomeTagline}>Better Hygiene, Better Health.</p>
        <h2 className={styles.welcomeTitle}>Welcome, {displayName.split(/\s+/)[0] || 'User'}!</h2>
        <p className={styles.welcomeDesc}>
          Report sanitation issues, explore hygiene tips, and track your community&apos;s health.
        </p>
      </section>

      {/* Feature Cards Grid */}
      <div className={styles.cardsGrid}>
        <article className={styles.featureCard}>
          <div className={styles.cardIconWrap}>
            <IconMapPin />
          </div>
          <h3 className={styles.cardTitle}>Report an Issue</h3>
          <p className={styles.cardDesc}>
            Report hygiene or sanitation concerns in your area with location and photos.
          </p>
          <Link to="/report" className={styles.cardBtnOutline}>
            Report Issue
          </Link>
        </article>

        <article className={styles.featureCard}>
          <div className={styles.cardIconWrap}>
            <IconLightbulb />
          </div>
          <h3 className={styles.cardTitle}>Hygiene Tips</h3>
          <p className={styles.cardDesc}>
            Browse practical tips for personal hygiene, water safety, sanitation, and more.
          </p>
          <Link to="/tips" className={styles.cardBtnOutline}>
            Browse Tips
          </Link>
        </article>

        <article className={styles.featureCard}>
          <div className={styles.cardIconWrap}>
            <IconFileText />
          </div>
          <h3 className={styles.cardTitle}>My Logs</h3>
          <p className={styles.cardDesc}>
            View and manage your submitted reports and contributed tips.
          </p>
          <Link to="/my-logs" className={styles.cardBtnPrimary}>
            View Logs
          </Link>
        </article>

        <article className={styles.featureCard}>
          <div className={styles.cardIconWrap}>
            <IconUser />
          </div>
          <h3 className={styles.cardTitle}>Manage Profile</h3>
          <p className={styles.cardDesc}>
            Update your profile, view activity history, and manage your account.
          </p>
          <div className={styles.cardBtnGroup}>
            <Link to="/profile" className={styles.cardBtnOutline}>
              View Profile
            </Link>
            <Link to="/profile/privacy-settings" className={styles.cardBtnOutline}>
              <IconShield /> Review Privacy
            </Link>
          </div>
        </article>

        {/* Activity Log - all changes the user has made */}
        <article className={`${styles.featureCard} ${styles.activityCard}`}>
          <h3 className={styles.cardTitle}>Activity Log</h3>
          <p className={styles.activitySubtitle}>What you&apos;ve done on HygieneWatch</p>
          <div className={styles.activityList}>
            {!user ? (
              <p className={styles.activityEmpty}>
                <Link to="/login">Log in</Link> to see your activity.
              </p>
            ) : activityLog.length === 0 ? (
              <p className={styles.activityEmpty}>No activity yet.</p>
            ) : (
              activityLog.slice(0, 25).map((item) => (
                <div key={`${item.kind}-${item.id}`} className={styles.activityRow}>
                  <span className={styles.activityIcon}>
                    {item.kind === 'report' && <IconMapPin />}
                    {item.kind === 'tip' && <IconLightbulb />}
                    {item.kind === 'log' && <IconUser />}
                  </span>
                  <div className={styles.activityContent}>
                    <span className={styles.activityText}>
                      {item.kind === 'report' && `Report "${item.title}" was submitted`}
                      {item.kind === 'tip' && `Hygiene tip "${item.title}" was submitted`}
                      {item.kind === 'log' && item.description}
                    </span>
                    <span className={styles.activityTime}>{relativeTime(item.createdAt)}</span>
                  </div>
                  {(item.kind === 'report' || item.kind === 'tip') && (
                    <Link to={item.link} className={styles.activityLink}>
                      View
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </article>
      </div>

      {/* Inspector / Admin links (if applicable) */}
      {role === 'admin' && (
        <div className={styles.adminLinks}>
          <Link to="/admin" className={styles.adminLink}>Admin Inspector Dashboard →</Link>
        </div>
      )}

    </div>
  )
}
