import { useEffect, useState, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { subscribeReportsByUser, subscribeTipsByUser } from '../lib/firestore'
import { aggregateByDateUser } from '../lib/chartData'
import Loader from '../components/Loader'
import ReportTrackerBar from '../components/ReportTrackerBar'
import { IconMapPin, IconLightbulb } from '../components/Icons'
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

  const chartData = useMemo(() => aggregateByDateUser(reports, tips), [reports, tips])

  if (user && loading) return <Loader />

  const reportItems = reports.map((r) => ({
    type: 'report' as const,
    id: r.id,
    title: r.title,
    date: r.createdAt,
    status: r.status,
    report: r,
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
        <>
          {chartData.length > 0 && (
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Activity Over Time</h3>
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="reports"
                      name="Reports"
                      stroke="#0f5132"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tips"
                      name="Tips"
                      stroke="#166534"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          <ul className={styles.list}>
          {all.map((item) => (
            <li key={`${item.type}-${item.id}`} className={styles.card}>
              <span className={styles.badge}>
                <span className={styles.badgeIcon}>
                  {item.type === 'report' ? <IconMapPin /> : <IconLightbulb />}
                </span>
                {item.type}
              </span>
              <h2 className={styles.cardTitle}>{item.title}</h2>
              {item.type === 'report' && 'report' in item && (
                <div className={styles.trackerWrap}>
                  <ReportTrackerBar report={item.report} compact />
                </div>
              )}
              <div className={styles.cardMeta}>
                <span>{formatDate(item.date)}</span>
                {'status' in item && (
                  <span className={styles.status}>{item.status}</span>
                )}
              </div>
              <div className={styles.cardActions}>
                {item.type === 'report' && (
                  <Link
                    to={`/reports/${item.id}/track`}
                    className={styles.trackLink}
                  >
                    Track Report
                  </Link>
                )}
                <Link
                  to={item.type === 'report' ? `/reports/${item.id}` : `/tips/${item.id}`}
                  className={styles.cardLink}
                >
                  View →
                </Link>
              </div>
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  )
}
