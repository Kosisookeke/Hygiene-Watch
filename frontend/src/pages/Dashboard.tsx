import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeRecentActivityByUser } from '../lib/firestore'
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

type ActivityItem = (Report | Tip) & { _type: 'report' | 'tip' }

export default function Dashboard() {
  const { user, profile, role } = useAuth()
  const [activity, setActivity] = useState<ActivityItem[]>([])

  useEffect(() => {
    if (!user?.uid) {
      setActivity([])
      return
    }
    const unsub = subscribeRecentActivityByUser(user.uid, (items) => {
      setActivity(
        items.map((item) => ({
          ...item,
          _type: 'submittedById' in item ? ('report' as const) : ('tip' as const),
        })) as ActivityItem[]
      )
    })
    return () => unsub?.()
  }, [user?.uid])

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
          <Link to="/profile" className={styles.cardBtnOutline}>
            View Profile
          </Link>
        </article>

        <article className={styles.featureCard}>
          <div className={styles.cardIconWrap}>
            <IconShield />
          </div>
          <h3 className={styles.cardTitle}>Review Privacy Settings</h3>
          <p className={styles.cardDesc}>
            Control who sees your data and manage your privacy preferences.
          </p>
          <Link to="/profile/privacy-settings" className={styles.cardBtnOutline}>
            Manage Privacy
          </Link>
        </article>

        {/* Recent Activity Card */}
        <article className={`${styles.featureCard} ${styles.activityCard}`}>
          <h3 className={styles.cardTitle}>Recent Activity</h3>
          <div className={styles.activityList}>
            {!user ? (
              <p className={styles.activityEmpty}>
                <Link to="/login">Log in</Link> to see recent activity.
              </p>
            ) : activity.length === 0 ? (
              <p className={styles.activityEmpty}>No recent activity.</p>
            ) : (
              activity.slice(0, 8).map((item) => (
                <div key={`${item._type}-${item.id}`} className={styles.activityRow}>
                  <span className={styles.activityIcon}>
                    {item._type === 'report' ? <IconMapPin /> : <IconLightbulb />}
                  </span>
                  <div className={styles.activityContent}>
                    <span className={styles.activityText}>
                      {item._type === 'report' ? item.title : (item as Tip).title}
                    </span>
                    <span className={styles.activityTime}>{relativeTime(item.createdAt)}</span>
                  </div>
                  <Link
                    to={item._type === 'report' ? `/reports/${item.id}` : `/tips/${item.id}`}
                    className={styles.activityLink}
                  >
                    View
                  </Link>
                </div>
              ))
            )}
          </div>
        </article>
      </div>

      {/* Inspector / Admin links (if applicable) */}
      {(role === 'inspector' || role === 'admin') && (
        <div className={styles.adminLinks}>
          <Link to="/inspector" className={styles.adminLink}>Inspector area →</Link>
          {role === 'admin' && (
            <Link to="/admin" className={styles.adminLink}>Admin area →</Link>
          )}
        </div>
      )}
    </div>
  )
}
