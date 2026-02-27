import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeReport, updateReportStatus } from '../lib/firestore'
import Loader from '../components/Loader'
import ReportTrackerBar from '../components/ReportTrackerBar'
import ResolveReportModal from '../components/ResolveReportModal'
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
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)

  async function handleUpdateStatus(status: Report['status']) {
    if (!id) return
    setUpdating(true)
    try {
      await updateReportStatus(id, status)
      const updated = await getReport(id)
      if (updated) setReport(updated)
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    const unsub = subscribeReport(id, (r) => {
      setReport(r ?? null)
      setLoading(false)
      if (!r) setError('Report not found')
    })
    return () => unsub?.()
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

      {isAdmin && report.status !== 'resolved' && report.status !== 'rejected' && (
        <div className={styles.adminActions}>
          <h3 className={styles.adminActionsTitle}>Update status</h3>
          <div className={styles.adminActionsRow}>
            {report.status === 'pending' && (
              <>
                <button
                  type="button"
                  className={styles.adminBtn}
                  onClick={() => handleUpdateStatus('in_review')}
                  disabled={updating}
                >
                  Under Review
                </button>
                <button
                  type="button"
                  className={`${styles.adminBtn} ${styles.adminBtnReject}`}
                  onClick={() => handleUpdateStatus('rejected')}
                  disabled={updating}
                >
                  Reject
                </button>
              </>
            )}
            {report.status === 'in_review' && (
              <>
                <button
                  type="button"
                  className={styles.adminBtn}
                  onClick={() => handleUpdateStatus('accepted')}
                  disabled={updating}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className={`${styles.adminBtn} ${styles.adminBtnReject}`}
                  onClick={() => handleUpdateStatus('rejected')}
                  disabled={updating}
                >
                  Reject
                </button>
              </>
            )}
            {report.status === 'accepted' && (
              <>
                <button
                  type="button"
                  className={styles.adminBtn}
                  onClick={() => handleUpdateStatus('in_progress')}
                  disabled={updating}
                >
                  In Progress
                </button>
                <button
                  type="button"
                  className={styles.adminBtn}
                  onClick={() => setShowResolveModal(true)}
                  disabled={updating}
                >
                  Resolve
                </button>
              </>
            )}
            {report.status === 'in_progress' && (
              <button
                type="button"
                className={styles.adminBtn}
                onClick={() => setShowResolveModal(true)}
                disabled={updating}
              >
                Resolve
              </button>
            )}
          </div>
        </div>
      )}

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

      {report.status === 'resolved' && (report.resolutionFeedback || report.resolutionPhotoUrl) && (
        <section className={styles.resolutionSection}>
          <h3 className={styles.resolutionTitle}>Resolution</h3>
          <p className={styles.resolutionSubtitle}>The issue has been addressed</p>
          {report.resolutionFeedback && (
            <p className={styles.resolutionFeedback}>{report.resolutionFeedback}</p>
          )}
          {report.resolutionPhotoUrl && (
            <div className={styles.resolutionPhotoWrap}>
              <img src={report.resolutionPhotoUrl} alt="Resolution proof" className={styles.resolutionPhoto} />
            </div>
          )}
        </section>
      )}

      <Link to={`/reports/${id}`} className={styles.trackBtn}>
        View Report Details
      </Link>

      {showResolveModal && report && (
        <ResolveReportModal
          reportId={report.id}
          reportTitle={report.title}
          onClose={() => setShowResolveModal(false)}
          onResolved={() => {}}
        />
      )}
    </div>
  )
}
