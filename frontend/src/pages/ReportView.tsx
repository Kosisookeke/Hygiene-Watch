import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getReport } from '../lib/firestore'
import Loader from '../components/Loader'
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

  return (
    <div className={styles.page}>
      <Link to="/my-logs" className={styles.back}>← Back to My Logs</Link>

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
      </article>
    </div>
  )
}
