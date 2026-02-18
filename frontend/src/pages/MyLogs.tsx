import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeReportsByUser, subscribeTipsByUser } from '../lib/firestore'
import Loader from '../components/Loader'
import type { Report, Tip } from '../lib/types'
import styles from './MyLogs.module.css'

function formatDate(s: string): string {
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

export default function MyLogs() {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const readyRef = useRef({ reports: false, tips: false })

  useEffect(() => {
    if (!user) return
    readyRef.current = { reports: false, tips: false }
    setLoading(true)
    const unsubReports = subscribeReportsByUser(user.uid, (r) => {
      setReports(r)
      readyRef.current.reports = true
      if (readyRef.current.tips) setLoading(false)
    })
    const unsubTips = subscribeTipsByUser(user.uid, (t) => {
      setTips(t)
      readyRef.current.tips = true
      if (readyRef.current.reports) setLoading(false)
    })
    return () => {
      unsubReports?.()
      unsubTips?.()
    }
  }, [user?.uid])

  if (user && loading) return <Loader />

  const reportItems = reports.map((r) => ({
    type: 'report' as const,
    id: r.id,
    title: r.title,
    date: r.createdAt,
    status: r.status,
  }))
  const tipItems = tips.map((t) => ({
    type: 'tip' as const,
    id: t.id,
    title: t.title,
    date: t.createdAt,
  }))
  const all = [...reportItems, ...tipItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Logs</h1>
      <p className={styles.subtitle}>
        Your submitted reports and tips.
      </p>

      {!user ? (
        <p className={styles.empty}>
          <Link to="/login">Log in</Link> to view your logs.
        </p>
      ) : all.length === 0 ? (
        <p className={styles.empty}>
          No activity yet.{' '}
          <Link to="/report">Report an issue</Link> or{' '}
          <Link to="/tips">browse tips</Link>.
        </p>
      ) : (
        <ul className={styles.list}>
          {all.map((item) => (
            <li key={`${item.type}-${item.id}`} className={styles.card}>
              <span className={styles.badge}>
                {item.type === 'report' ? '📋' : '💡'} {item.type}
              </span>
              <h2 className={styles.cardTitle}>{item.title}</h2>
              <div className={styles.cardMeta}>
                <span>{formatDate(item.date)}</span>
                {'status' in item && (
                  <span className={styles.status}>{item.status}</span>
                )}
              </div>
              <Link
                to={item.type === 'report' ? `/reports/${item.id}` : `/tips/${item.id}`}
                className={styles.cardLink}
              >
                View →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
