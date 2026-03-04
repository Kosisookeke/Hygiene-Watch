import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Loader from '../components/Loader'
import {
  subscribeAllReports,
  subscribeAllTips,
  subscribeAllComments,
  subscribeAllProfiles,
  updateTipApproval,
  deleteComment,
  updateProfileRole,
  assignRegionsToReports,
} from '../lib/firestore'
import {
  IconFileText,
  IconLightbulb,
  IconCheck,
  IconX,
  IconTrash2,
  IconMail,
  IconMapPin,
  IconEye,
  IconUser,
  IconDownload,
} from '../components/Icons'
import { downloadAdminStatementPdf } from '../lib/adminPdfExport'
import type { Report, Tip, Comment, Profile } from '../lib/types'
import { INSPECTION_REGIONS } from '../lib/types'
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

function inferRegionFromText(text: string): 'kigali_rwanda' | 'lagos_nigeria' {
  const lower = (text || '').toLowerCase()
  if (lower.includes('kigali') || lower.includes('rwanda')) return 'kigali_rwanda'
  if (lower.includes('lagos') || lower.includes('nigeria')) return 'lagos_nigeria'
  return 'lagos_nigeria'
}

function inferNeedsUpdate(r: Report): boolean {
  const text = [r.location, r.title, r.description].filter(Boolean).join(' ')
  const inferred = inferRegionFromText(text)
  return r.region !== inferred
}

export default function Admin() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const [reports, setReports] = useState<Report[]>([])
  const [tips, setTips] = useState<Tip[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'reports' | 'tips' | 'comments' | 'users'>('reports')
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [reportCategoryFilter, setReportCategoryFilter] = useState('')
  const [reportDateFilter, setReportDateFilter] = useState('')
  const [tipCategoryFilter, setTipCategoryFilter] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [updatingProfileId, setUpdatingProfileId] = useState<string | null>(null)
  const [syncingRegions, setSyncingRegions] = useState(false)

  useEffect(() => {
    if (!isAdmin) return
    const unsubReports = subscribeAllReports(setReports)
    const unsubTips = subscribeAllTips(setTips)
    const unsubComments = subscribeAllComments(setComments)
    const unsubProfiles = subscribeAllProfiles(setProfiles)
    setLoading(false)
    return () => {
      unsubReports?.()
      unsubTips?.()
      unsubComments?.()
      unsubProfiles?.()
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin || reports.length === 0) return
    const needsRegion = reports.some((r) => !r.region || inferNeedsUpdate(r))
    if (!needsRegion) return
    assignRegionsToReports(reports).catch(console.error)
  }, [isAdmin, reports])


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

  async function handleAssignRegions() {
    setSyncingRegions(true)
    try {
      const count = await assignRegionsToReports(reports)
      alert(`Assigned region to ${count} report(s) based on address. Kigali/Rwanda → Kigali inspectors. Lagos/Nigeria → Lagos inspectors.`)
    } catch (err) {
      console.error(err)
      alert('Failed to assign regions')
    } finally {
      setSyncingRegions(false)
    }
  }

  async function handleUpdateProfileRole(
    userId: string,
    role: Profile['role'],
    assignedRegion?: Profile['assignedRegion']
  ) {
    setUpdatingProfileId(userId)
    try {
      await updateProfileRole(userId, { role, assignedRegion })
    } finally {
      setUpdatingProfileId(null)
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
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <p className={styles.welcomeTagline}>Admin Dashboard</p>
            <h2 className={styles.welcomeTitle}>Admin Dashboard</h2>
            <p className={styles.welcomeDesc}>
              Review and manage community hygiene reports and tips.
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadAdminStatementPdf(reports, tips, comments, profiles)}
            className={adminStyles.downloadBtn}
            aria-label="Download statement as PDF"
          >
            <IconDownload />
            Download Statement (PDF)
          </button>
        </div>
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
        <button
          type="button"
          className={`${adminStyles.tab} ${activeTab === 'users' ? adminStyles.tabActive : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <IconUser />
          User Management
        </button>
      </div>

      {/* Content */}
      {activeTab === 'reports' ? (
        <article className={`${styles.featureCard} ${adminStyles.tableCard}`}>
          <div className={adminStyles.sectionHeader}>
            <div>
              <h3 className={styles.cardTitle}>Pending Sanitation Reports</h3>
              <p className={adminStyles.sectionDesc}>Review and take action on submitted reports. Assign regions from addresses so inspectors see reports in their area.</p>
            </div>
            <div className={adminStyles.filters}>
              <button
                type="button"
                onClick={handleAssignRegions}
                disabled={syncingRegions || reports.length === 0}
                className={adminStyles.filterSelect}
                style={{ padding: '8px 12px', cursor: syncingRegions ? 'wait' : 'pointer' }}
                title="Assign region to each report from its address (Kigali/Rwanda or Lagos/Nigeria)"
              >
                {syncingRegions ? 'Assigning…' : 'Assign regions from addresses'}
              </button>
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
      ) : activeTab === 'users' ? (
        <article className={`${styles.featureCard} ${adminStyles.tableCard}`}>
          <div className={adminStyles.sectionHeader}>
            <div>
              <h3 className={styles.cardTitle}>User Management</h3>
              <p className={adminStyles.sectionDesc}>Assign inspector role and region to users</p>
            </div>
          </div>
          {loading ? (
            <Loader />
          ) : (
            <div className={adminStyles.tableWrap}>
              <table className={adminStyles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Assigned Region</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr key={p.id}>
                      <td>{p.full_name ?? '—'}</td>
                      <td>{p.email ?? '—'}</td>
                      <td><span className={adminStyles.tag}>{p.role}</span></td>
                      <td>
                        <select
                          value={p.role === 'inspector' ? (p.assignedRegion ?? 'lagos_nigeria') : ''}
                          onChange={(e) => {
                            const region = e.target.value as Profile['assignedRegion']
                            if (region) {
                              handleUpdateProfileRole(p.id, 'inspector', region)
                            }
                          }}
                          disabled={updatingProfileId === p.id || p.role !== 'inspector'}
                          className={adminStyles.filterSelect}
                          style={{ minWidth: 140 }}
                          aria-label={`Assign region for ${p.full_name ?? p.email}`}
                          title={p.role !== 'inspector' ? 'Assign inspector role first' : 'Select region'}
                        >
                          <option value="">{p.role === 'inspector' ? 'Select region…' : '—'}</option>
                          {INSPECTION_REGIONS.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className={adminStyles.actions}>
                          <select
                            value={p.role}
                            onChange={(e) => {
                              const newRole = e.target.value as Profile['role']
                              if (newRole === 'inspector') {
                                handleUpdateProfileRole(p.id, 'inspector', p.assignedRegion ?? 'lagos_nigeria')
                              } else {
                                handleUpdateProfileRole(p.id, newRole)
                              }
                            }}
                            disabled={updatingProfileId === p.id}
                            className={adminStyles.filterSelect}
                            style={{ minWidth: 100 }}
                            aria-label={`Change role for ${p.full_name ?? p.email}`}
                          >
                            <option value="user">User</option>
                            <option value="inspector">Inspector</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && profiles.length === 0 && (
            <p className={adminStyles.empty}>No users found.</p>
          )}
        </article>
      ) : null}
    </div>
  )
}
