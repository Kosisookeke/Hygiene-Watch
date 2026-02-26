import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getReport } from '../lib/firestore'
import Loader from '../components/Loader'
import ReportTrackerBar from '../components/ReportTrackerBar'
import type { Report, ReportStatusEntry } from '../lib/types'
import styles from './ReportTracking.module.css'

function formatDateTime(s: string): string {
  try {
    const d = new Date(s)
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return s
  }
}

function formatTime(s: string): string {
  try {
    const d = new Date(s)
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return s
  }
}

function buildTimeline(report: Report): ReportStatusEntry[] {
  if (report.statusHistory && report.statusHistory.length > 0) {
    return [...report.statusHistory].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }
  const entries: ReportStatusEntry[] = [
    {
      status: 'pending',
      timestamp: report.createdAt,
      description: 'Report submitted',
    },
  ]
  if (report.status !== 'pending') {
    entries.push({
      status: report.status,
      timestamp: report.updatedAt,
      description:
        report.status === 'in_review'
          ? 'Report under review by inspector'
          : report.status === 'accepted'
            ? 'Report accepted'
            : report.status === 'in_progress'
              ? 'Report in progress'
              : report.status === 'resolved'
              ? 'Report resolved'
              : 'Report rejected',
    })
  }
  return entries
}

export default function ReportTracking() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let mounted = true
    setLoading(true)
    setError(null)
    getReport(id)
      .then((r) => {
        if (mounted) setReport(r ?? null)
      })
      .catch(() => {
        if (mounted) setError('Failed to load report')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [id])

  if (!id) {
    navigate('/my-logs')
    return null
  }

  if (loading && !report) {
    return <Loader />
  }

  if (error || !report) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error || 'Report not found'}</p>
        <Link to="/my-logs">← Back to My Logs</Link>
      </div>
    )
  }

  const timeline = buildTimeline(report)

  return (
    <div className={styles.page}>
      <Link to={`/reports/${id}`} className={styles.back}>
        ← Back to Report
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>Report Tracking</h1>
        <p className={styles.subtitle}>{report.title}</p>
        <div className={styles.trackerWrap}>
          <ReportTrackerBar report={report} />
        </div>
      </header>

      <div className={styles.timeline}>
        {timeline.map((entry, i) => (
          <div key={`${entry.status}-${entry.timestamp}-${i}`} className={styles.timelineItem}>
            <div className={styles.timelineLeft}>
              <span className={styles.date}>{formatDateTime(entry.timestamp)}</span>
              <span className={styles.time}>{formatTime(entry.timestamp)}</span>
            </div>
            <div className={styles.timelineLine}>
              <div className={styles.timelineDot} />
            </div>
            <div className={styles.timelineContent}>
              <h3 className={styles.timelineTitle}>{entry.status.replace('_', ' ')}</h3>
              <p className={styles.timelineDesc}>
                {entry.description ?? 'Status updated'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Link to={`/reports/${id}`} className={styles.trackBtn}>
        View Report Details
      </Link>
    </div>
  )
}
