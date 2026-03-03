import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeReport } from '../lib/firestore'
import Loader from '../components/Loader'
import ReportTrackerBar from '../components/ReportTrackerBar'
import type { Report } from '../lib/types'
import styles from './ReportView.module.css'

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

export default function ReportView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { role, profile } = useAuth()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (role === 'inspector' && report.region !== profile?.assignedRegion) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>You do not have access to reports outside your assigned region.</p>
        <Link to="/inspector">← Back to Inspector Dashboard</Link>
      </div>
    )
  }

  const backLink = role === 'inspector' ? (
    <Link to="/inspector" className={styles.back}>← Back to Inspector Dashboard</Link>
  ) : (
    <Link to="/my-logs" className={styles.back}>← Back to My Logs</Link>
  )

  return (
    <div className={styles.page}>
      {backLink}

      <div className={styles.trackerSection}>
        <ReportTrackerBar report={report} />
        <Link to={`/reports/${report.id}/track`} className={styles.trackBtn}>
          Track Report
        </Link>
      </div>

      <article className={styles.article}>
        <span className={styles.status}>{report.status}</span>
        {report.category && (
          <span className={styles.category}>{report.category}</span>
        )}
        <h1 className={styles.title}>{report.title}</h1>
        <div className={styles.meta}>
          <span>{report.submittedBy}</span>
          <span>{formatDate(report.createdAt)}</span>
        </div>
        <div className={styles.body}>{report.description}</div>
        {report.location && (
          <p className={styles.location}>
            <strong>Location:</strong> {report.location}
          </p>
        )}
        {report.photoUrl && (
          <img src={report.photoUrl} alt="Report" className={styles.photo} />
        )}
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
      </article>
    </div>
  )
}
