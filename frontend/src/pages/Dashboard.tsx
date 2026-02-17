import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeRecentActivity, subscribeReportsByUser, subscribeTipsByUser } from '../lib/firestore'
import { IconLightbulb, IconFileText } from '../components/Icons'
import type { Report, Tip } from '../lib/types'
import styles from './Dashboard.module.css'

function formatDateDDMMYYYY(s: string): string {
  try {
    const d = new Date(s)
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return s
  }
}

function relativeTime(s: string): string {
  try {
    const d = new Date(s)
    const now = new Date()
    const sec = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (sec < 60) return 'just now'
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
    if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`
    return formatDateDDMMYYYY(s)
  } catch {
    return s
  }
}

type ActivityItem = (Report | Tip) & { _type: 'report' | 'tip' }

export default function Dashboard() {
  const { user, profile, role } = useAuth()
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [myReports, setMyReports] = useState<Report[]>([])
  const [myTips, setMyTips] = useState<Tip[]>([])

  useEffect(() => {
    const unsub = subscribeRecentActivity((items) => {
      setActivity(
        items.map((item) => ({
          ...item,
          _type: 'submittedById' in item ? ('report' as const) : ('tip' as const),
        })) as ActivityItem[]
      )
    })
    return () => unsub?.()
  }, [])

  useEffect(() => {
    if (!user) return
    const unsubR = subscribeReportsByUser(user.uid, setMyReports)
    const unsubT = subscribeTipsByUser(user.uid, setMyTips)
    return () => {
      unsubR?.()
      unsubT?.()
    }
  }, [user?.uid])

  const myLogs = [
    ...myReports.map((r) => ({ ...r, _type: 'report' as const })),
    ...myTips.map((t) => ({ ...t, _type: 'tip' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Hygiene Tips</h1>
      <p className={styles.subtitle}>
        Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}. Explore tips and track your activity.
      </p>

      <div className={styles.dashboard}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.icon}><IconLightbulb /></span> Activity Logs
          </h2>
          <div className={styles.scrollArea}>
            {activity.length === 0 ? (
              <p className={styles.empty}>No recent activity.</p>
            ) : (
              activity.map((item) => (
                <div key={`${item._type}-${item.id}`} className={styles.activityItem}>
                  <p className={styles.activityDesc}>
                    {item._type === 'report' ? item.title : (item as Tip).title}
                  </p>
                  <span className={styles.activityTime}>{relativeTime(item.createdAt)}</span>
                  <Link
                    to={item._type === 'report' ? `/reports/${item.id}` : `/tips/${item.id}`}
                    className={styles.viewLink}
                  >
                    View →
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.icon}><IconFileText /></span> My Logs
          </h2>
          <div className={styles.scrollArea}>
            {!user ? (
              <p className={styles.empty}>
                <Link to="/login">Log in</Link> to see your logs.
              </p>
            ) : myLogs.length === 0 ? (
              <p className={styles.empty}>No logs yet.</p>
            ) : (
              myLogs.map((item) => (
                <div key={`${item._type}-${item.id}`} className={styles.logCard}>
                  <span className={styles.logIcon}>{item._type === 'report' ? <IconFileText /> : <IconLightbulb />}</span>
                  <div className={styles.logContent}>
                    <h3 className={styles.logTitle}>
                      {item._type === 'report' ? item.title : (item as Tip).title}
                    </h3>
                    <span className={styles.logDate}>{formatDateDDMMYYYY(item.createdAt)}</span>
                  </div>
                  <Link
                    to={item._type === 'report' ? `/reports/${item.id}` : `/tips/${item.id}`}
                    className={styles.viewLink}
                  >
                    View →
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className={styles.links}>
        <Link to="/tips" className={styles.link}>Hygiene Tips →</Link>
        <Link to="/report" className={styles.link}>Report Issue →</Link>
        <Link to="/my-logs" className={styles.link}>My Logs →</Link>
        <Link to="/profile" className={styles.link}>Profile →</Link>
        {(role === 'inspector' || role === 'admin') && (
          <Link to="/inspector" className={styles.link}>Inspector area →</Link>
        )}
        {role === 'admin' && (
          <Link to="/admin" className={styles.link}>Admin area →</Link>
        )}
      </div>
    </div>
  )
}
