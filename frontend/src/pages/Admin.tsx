import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Loader from '../components/Loader'
import {
  subscribeAllReports,
  subscribeAllTips,
  subscribeAllComments,
  updateReportStatus,
  updateTipApproval,
  deleteComment,
} from '../lib/firestore'
import {
  IconFileText,
  IconLightbulb,
  IconEye,
  IconCheck,
  IconX,
  IconTrash2,
  IconMail,
} from '../components/Icons'
import type { Report, Tip, Comment } from '../lib/types'
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

export default function Admin() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const [reports, setReports] = useState<Report[]>([])
  const [tips, setTips] = useState<Tip[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'reports' | 'tips' | 'comments'>('reports')
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [reportCategoryFilter, setReportCategoryFilter] = useState('')
  const [reportDateFilter, setReportDateFilter] = useState('')
  const [tipCategoryFilter, setTipCategoryFilter] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    const unsubReports = subscribeAllReports(setReports)
    const unsubTips = subscribeAllTips(setTips)
    const unsubComments = subscribeAllComments(setComments)
    setLoading(false)
    return () => {
      unsubReports?.()
      unsubTips?.()
      unsubComments?.()
    }
  }, [isAdmin])

  const pendingReports = reports.filter((r) => r.status === 'pending')
  const pendingTips = tips.filter((t) => !t.approved)
  const today = new Date().toISOString().slice(0, 10)
  const approvedToday = reports.filter(
    (r) => r.status === 'resolved' && r.updatedAt?.slice(0, 10) === today
  ).length + tips.filter(
    (t) => t.approved && t.updatedAt?.slice(0, 10) === today
  ).length
  const commentsCount = comments.length

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

  const filteredTips = useMemo(() => {
    let list = tips
    if (tipCategoryFilter) {
      list = list.filter((t) => (t.category ?? '').toLowerCase() === tipCategoryFilter.toLowerCase())
    }
    return list
  }, [tips, tipCategoryFilter])

  async function handleUpdateReportStatus(id: string, status: Report['status']) {
    setUpdatingId(id)
    try {
      await updateReportStatus(id, status)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleApproveTip(id: string) {
    setUpdatingId(id)
    try {
      await updateTipApproval(id, true)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleRejectTip(id: string) {
    setUpdatingId(id)
    try {
      await updateTipApproval(id, false)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDeleteComment(id: string) {
    setDeletingCommentId(id)
    try {
      await deleteComment(id)
    } finally {
      setDeletingCommentId(null)
    }
  }

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <section className={styles.welcomeSection}>
          <h2 className={styles.welcomeTitle}>Access denied</h2>
          <p className={styles.welcomeDesc}>This area is for administrators only.</p>
        </section>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Welcome Section */}
      <section className={styles.welcomeSection}>
        <p className={styles.welcomeTagline}>Admin Inspector Dashboard</p>
        <h2 className={styles.welcomeTitle}>Inspector Dashboard</h2>
        <p className={styles.welcomeDesc}>
          Review and manage community hygiene reports and tips.
        </p>
      </section>

      {/* Metric Cards */}
      <div className={adminStyles.metricsGrid}>
        <article className={`${styles.featureCard} ${adminStyles.metricCard} ${adminStyles.metricGreen}`}>
          <h3 className={adminStyles.metricTitle}>Pending Reports</h3>
          <p className={adminStyles.metricValue}>{pendingReports.length}</p>
        </article>
        <article className={`${styles.featureCard} ${adminStyles.metricCard} ${adminStyles.metricGreen}`}>
          <h3 className={adminStyles.metricTitle}>Pending Tips</h3>
          <p className={adminStyles.metricValue}>{pendingTips.length}</p>
        </article>
        <article className={`${styles.featureCard} ${adminStyles.metricCard} ${adminStyles.metricGreen}`}>
          <h3 className={adminStyles.metricTitle}>Approved Today</h3>
          <p className={adminStyles.metricValue}>{approvedToday}</p>
        </article>
        <article className={`${styles.featureCard} ${adminStyles.metricCard} ${adminStyles.metricGreen}`}>
          <h3 className={adminStyles.metricTitle}>Comments</h3>
          <p className={adminStyles.metricValue}>{commentsCount}</p>
        </article>
      </div>

      {/* Tabs */}
      <div className={adminStyles.tabs}>
        <button
          type="button"
          className={`${adminStyles.tab} ${activeTab === 'reports' ? adminStyles.tabActive : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <IconFileText />
          Sanitation Reports
        </button>
        <button
          type="button"
          className={`${adminStyles.tab} ${activeTab === 'tips' ? adminStyles.tabActive : ''}`}
          onClick={() => setActiveTab('tips')}
        >
          <IconLightbulb />
          Hygiene Tips
        </button>
        <button
          type="button"
          className={`${adminStyles.tab} ${activeTab === 'comments' ? adminStyles.tabActive : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          <IconMail />
          Comments
        </button>
      </div>

      {/* Content */}
      {activeTab === 'reports' ? (
        <article className={`${styles.featureCard} ${adminStyles.tableCard}`}>
          <div className={adminStyles.sectionHeader}>
            <div>
              <h3 className={styles.cardTitle}>Pending Sanitation Reports</h3>
              <p className={adminStyles.sectionDesc}>Review and take action on submitted reports</p>
            </div>
            <div className={adminStyles.filters}>
              <select
                id="admin-report-category"
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
                id="admin-report-date"
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
                            to={`/reports/${r.id}`}
                            className={adminStyles.actionBtn}
                            aria-label="View"
                            title="View"
                          >
                            <IconEye />
                          </Link>
                          {r.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                className={`${adminStyles.actionBtn} ${adminStyles.actionApprove}`}
                                onClick={() => handleUpdateReportStatus(r.id, 'in_review')}
                                disabled={updatingId === r.id}
                                aria-label="Accept for review"
                                title="Accept for review"
                              >
                                <IconCheck />
                              </button>
                              <button
                                type="button"
                                className={`${adminStyles.actionBtn} ${adminStyles.actionReject}`}
                                onClick={() => handleUpdateReportStatus(r.id, 'rejected')}
                                disabled={updatingId === r.id}
                                aria-label="Reject"
                                title="Reject"
                              >
                                <IconX />
                              </button>
                            </>
                          )}
                          {r.status === 'in_review' && (
                            <>
                              <button
                                type="button"
                                className={adminStyles.statusTextBtn}
                                onClick={() => handleUpdateReportStatus(r.id, 'accepted')}
                                disabled={updatingId === r.id}
                                aria-label="Accept"
                                title="Accept"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                className={adminStyles.statusTextBtn}
                                onClick={() => handleUpdateReportStatus(r.id, 'rejected')}
                                disabled={updatingId === r.id}
                                aria-label="Reject"
                                title="Reject"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {r.status === 'accepted' && (
                            <>
                              <button
                                type="button"
                                className={adminStyles.statusTextBtn}
                                onClick={() => handleUpdateReportStatus(r.id, 'in_progress')}
                                disabled={updatingId === r.id}
                                aria-label="Set in progress"
                                title="In progress"
                              >
                                In Progress
                              </button>
                              <button
                                type="button"
                                className={adminStyles.statusTextBtn}
                                onClick={() => handleUpdateReportStatus(r.id, 'resolved')}
                                disabled={updatingId === r.id}
                                aria-label="Resolve"
                                title="Resolve"
                              >
                                Resolve
                              </button>
                            </>
                          )}
                          {r.status === 'in_progress' && (
                            <button
                              type="button"
                              className={adminStyles.statusTextBtn}
                              onClick={() => handleUpdateReportStatus(r.id, 'resolved')}
                              disabled={updatingId === r.id}
                              aria-label="Resolve"
                              title="Resolve"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filteredReports.length === 0 && (
            <p className={adminStyles.empty}>No reports match your filters.</p>
          )}
        </article>
      ) : activeTab === 'tips' ? (
        <article className={`${styles.featureCard} ${adminStyles.tableCard}`}>
          <div className={adminStyles.sectionHeader}>
            <div>
              <h3 className={styles.cardTitle}>Hygiene Tips</h3>
              <p className={adminStyles.sectionDesc}>Review and approve submitted tips</p>
            </div>
            <select
              id="admin-tip-category"
              name="tipCategory"
              value={tipCategoryFilter}
              onChange={(e) => setTipCategoryFilter(e.target.value)}
              className={adminStyles.filterSelect}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {REPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {loading ? (
            <Loader />
          ) : (
            <div className={adminStyles.tableWrap}>
              <table className={adminStyles.table}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Author</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTips.map((t) => (
                    <tr key={t.id}>
                      <td>{t.title}</td>
                      <td><span className={adminStyles.tag}>{t.category}</span></td>
                      <td>{t.author}</td>
                      <td>
                        <span className={`${adminStyles.statusTag} ${t.approved ? adminStyles.status_resolved : adminStyles.status_pending}`}>
                          {t.approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td>{formatDate(t.createdAt)}</td>
                      <td>
                        <div className={adminStyles.actions}>
                          <Link
                            to={`/tips/${t.id}`}
                            className={adminStyles.actionBtn}
                            aria-label="View"
                            title="View"
                          >
                            <IconEye />
                          </Link>
                          {!t.approved && (
                            <>
                              <button
                                type="button"
                                className={`${adminStyles.actionBtn} ${adminStyles.actionApprove}`}
                                onClick={() => handleApproveTip(t.id)}
                                disabled={updatingId === t.id}
                                aria-label="Approve"
                                title="Approve"
                              >
                                <IconCheck />
                              </button>
                              <button
                                type="button"
                                className={`${adminStyles.actionBtn} ${adminStyles.actionReject}`}
                                onClick={() => handleRejectTip(t.id)}
                                disabled={updatingId === t.id}
                                aria-label="Reject"
                                title="Reject"
                              >
                                <IconX />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filteredTips.length === 0 && (
            <p className={adminStyles.empty}>No tips match your filters.</p>
          )}
        </article>
      ) : activeTab === 'comments' ? (
        <article className={`${styles.featureCard} ${adminStyles.tableCard}`}>
          <div className={adminStyles.sectionHeader}>
            <div>
              <h3 className={styles.cardTitle}>User Comments</h3>
              <p className={adminStyles.sectionDesc}>Review and delete inappropriate comments from tips and reports</p>
            </div>
          </div>
          {loading ? (
            <Loader />
          ) : (
            <div className={adminStyles.tableWrap}>
              <table className={adminStyles.table}>
                <thead>
                  <tr>
                    <th>Comment</th>
                    <th>Author</th>
                    <th>On</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {comments.map((c) => (
                    <tr key={c.id}>
                      <td className={adminStyles.commentBody}>{c.body}</td>
                      <td>{c.author}</td>
                      <td>
                        <Link
                          to={c.targetType === 'tip' ? `/tips/${c.targetId}` : `/reports/${c.targetId}`}
                          className={adminStyles.link}
                        >
                          {c.targetType === 'tip' ? 'Tip' : 'Report'} →
                        </Link>
                      </td>
                      <td>{formatDate(c.createdAt)}</td>
                      <td>
                        <div className={adminStyles.actions}>
                          <button
                            type="button"
                            className={`${adminStyles.actionBtn} ${adminStyles.actionReject}`}
                            onClick={() => handleDeleteComment(c.id)}
                            disabled={deletingCommentId === c.id}
                            aria-label="Delete comment"
                            title="Delete"
                          >
                            <IconTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && comments.length === 0 && (
            <p className={adminStyles.empty}>No comments yet.</p>
          )}
        </article>
      ) : null}
    </div>
  )
}
