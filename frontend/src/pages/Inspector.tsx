import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Loader from '../components/Loader'
import { subscribeReportsByRegion } from '../lib/firestore'
import { IconFileText, IconMapPin } from '../components/Icons'
import { INSPECTION_REGIONS } from '../lib/types'
import type { Report } from '../lib/types'
import styles from './Dashboard.module.css'
import adminStyles from './Admin.module.css'

const REPORT_CATEGORIES: string[] = [
  'Waste Management',
  'Water Safety',
  'Sanitation',
  'Drainage',
  'Personal Hygiene',
  'Food Safety',
  'Other',
]

function formatDate(s: string): string {
  try {
    const d = new Date(s)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return s
  }
}

function formatReportId(id: string): string {
  return `RPT-${id.slice(-6).toUpperCase()}`
}

export default function Inspector() {
  const { role, profile } = useAuth()
  const assignedRegion = profile?.assignedRegion

  if (role !== 'inspector') {
    return (
      <div className={styles.page}>
        <section className={styles.welcomeSection}>
          <h2 className={styles.welcomeTitle}>Access denied</h2>
          <p className={styles.welcomeDesc}>This area is for inspectors only.</p>
        </section>
      </div>
    )
  }
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [reportCategoryFilter, setReportCategoryFilter] = useState('')
  const [reportDateFilter, setReportDateFilter] = useState('')

  useEffect(() => {
    if (!assignedRegion) return
    const unsub = subscribeReportsByRegion(assignedRegion, setReports)
    setLoading(false)
    return () => unsub?.()
  }, [assignedRegion])

  const pendingReports = reports.filter((r) => r.status === 'pending')
  const today = new Date().toISOString().slice(0, 10)
  const resolvedToday = reports.filter(
    (r) => r.status === 'resolved' && r.updatedAt?.slice(0, 10) === today
  ).length

  const filteredReports = useMemo(() => {
    let list = reports
    if (reportCategoryFilter) {
      list = list.filter((r) => (r.category ?? '').toLowerCase() === reportCategoryFilter.toLowerCase())
    }
    if (reportDateFilter) {
      list = list.filter((r) => r.createdAt?.slice(0, 10) === reportDateFilter)
    }
    return list
  }, [reports, reportCategoryFilter, reportDateFilter])

  const regionLabel = INSPECTION_REGIONS.find((r) => r.value === assignedRegion)?.label ?? assignedRegion ?? '—'

  if (!assignedRegion) {
    return (
      <div className={styles.page}>
        <section className={styles.welcomeSection}>
          <h2 className={styles.welcomeTitle}>No region assigned</h2>
          <p className={styles.welcomeDesc}>
            Your inspector account does not have an assigned region. Please contact an administrator.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <section className={styles.welcomeSection}>
        <p className={styles.welcomeTagline}>Inspector Dashboard</p>
        <h2 className={styles.welcomeTitle}>Reports in {regionLabel}</h2>
        <p className={styles.welcomeDesc}>
          Review and manage hygiene reports in your assigned region only.
        </p>
      </section>

      <div className={adminStyles.metricsGrid}>
        <article className={`${styles.featureCard} ${adminStyles.metricCard} ${adminStyles.metricGreen}`}>
          <h3 className={adminStyles.metricTitle}>Pending Reports</h3>
          <p className={adminStyles.metricValue}>{pendingReports.length}</p>
        </article>
        <article className={`${styles.featureCard} ${adminStyles.metricCard} ${adminStyles.metricGreen}`}>
          <h3 className={adminStyles.metricTitle}>Resolved Today</h3>
          <p className={adminStyles.metricValue}>{resolvedToday}</p>
        </article>
        <article className={`${styles.featureCard} ${adminStyles.metricCard} ${adminStyles.metricGreen}`}>
          <h3 className={adminStyles.metricTitle}>Total in Region</h3>
          <p className={adminStyles.metricValue}>{reports.length}</p>
        </article>
      </div>

      <article className={`${styles.featureCard} ${adminStyles.tableCard}`}>
        <div className={adminStyles.sectionHeader}>
          <div>
            <h3 className={styles.cardTitle}>Sanitation Reports</h3>
            <p className={adminStyles.sectionDesc}>Reports in {regionLabel} — review and take action</p>
          </div>
          <div className={adminStyles.filters}>
            <select
              id="inspector-report-category"
              name="reportCategory"
              value={reportCategoryFilter}
              onChange={(e) => setReportCategoryFilter(e.target.value)}
              className={adminStyles.filterSelect}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {REPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              id="inspector-report-date"
              name="reportDate"
              type="date"
              value={reportDateFilter}
              onChange={(e) => setReportDateFilter(e.target.value)}
              className={adminStyles.filterDate}
              aria-label="Filter by date"
            />
          </div>
        </div>
        {loading ? (
          <Loader />
        ) : (
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Location</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Submitted By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r) => (
                  <tr key={r.id}>
                    <td className={adminStyles.mono}>{formatReportId(r.id)}</td>
                    <td>{r.location ?? r.title ?? '—'}</td>
                    <td><span className={adminStyles.tag}>{r.category ?? 'Other'}</span></td>
                    <td>
                      <span className={`${adminStyles.statusTag} ${adminStyles[`status_${r.status}`]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>{r.submittedBy ?? '—'}</td>
                    <td>{formatDate(r.createdAt)}</td>
                    <td>
                      <div className={adminStyles.actions}>
                        <Link
                          to={`/reports/${r.id}/track`}
                          className={`${adminStyles.actionBtn} ${adminStyles.actionTrack}`}
                          aria-label="Track report"
                          title="Track report"
                        >
                          <IconMapPin />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredReports.length === 0 && (
          <p className={adminStyles.empty}>No reports in your region match your filters.</p>
        )}
      </article>
    </div>
  )
}
