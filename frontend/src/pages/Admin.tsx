import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Loader from '../components/Loader'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  subscribeAllReports,
  subscribeAllTips,
  updateReportStatus,
  updateTipApproval,
} from '../lib/firestore'
import {
  IconFileText,
  IconLightbulb,
  IconEye,
  IconCheck,
  IconX,
} from '../components/Icons'
import type { AppRole, Profile } from '../lib/types'
import type { Report, Tip } from '../lib/types'
import styles from './Dashboard.module.css'
import adminStyles from './Admin.module.css'

const PROFILES_COLLECTION = 'profiles'
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
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'reports' | 'tips'>('reports')
  const [reportCategoryFilter, setReportCategoryFilter] = useState('')
  const [reportDateFilter, setReportDateFilter] = useState('')
  const [tipCategoryFilter, setTipCategoryFilter] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [pendingRole, setPendingRole] = useState<Record<string, AppRole>>({})
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    const unsubReports = subscribeAllReports(setReports)
    const unsubTips = subscribeAllTips(setTips)
    return () => {
      unsubReports?.()
      unsubTips?.()
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return
    let mounted = true
    setLoading(true)
    getDocs(collection(db, PROFILES_COLLECTION))
      .then((snap) => {
        if (!mounted) return
        const list: Profile[] = snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            full_name: (data.full_name as string) ?? null,
            email: (data.email as string) ?? null,
            role: (data.role as AppRole) ?? 'user',
            created_at: (data.created_at as string) ?? '',
            updated_at: (data.updated_at as string) ?? '',
          }
        })
        list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        setProfiles(list)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [isAdmin])

  const pendingReports = reports.filter((r) => r.status === 'pending')
  const pendingTips = tips.filter((t) => !t.approved)
  const today = new Date().toISOString().slice(0, 10)
  const approvedToday = reports.filter(
    (r) => r.status === 'resolved' && r.updatedAt?.slice(0, 10) === today
  ).length + tips.filter(
    (t) => t.approved && t.updatedAt?.slice(0, 10) === today
  ).length
  const highPriority = pendingReports.length

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

  async function handleApproveReport(id: string) {
    setUpdatingId(id)
    try {
      await updateReportStatus(id, 'resolved')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleRejectReport(id: string) {
    setUpdatingId(id)
    try {
      await updateReportStatus(id, 'rejected')
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

  async function saveRole(profileId: string, newRole: AppRole) {
    setSavingRoleId(profileId)
    try {
      await updateDoc(doc(db, PROFILES_COLLECTION, profileId), {
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      setPendingRole((prev) => {
        const next = { ...prev }
        delete next[profileId]
        return next
      })
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p))
      )
    } finally {
      setSavingRoleId(null)
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
        <article className={`${styles.featureCard} ${adminStyles.metricCard} ${adminStyles.metricOrange}`}>
          <h3 className={adminStyles.metricTitle}>Pending Reports</h3>
          <p className={adminStyles.metricValue}>{pendingReports.length}</p>
        </article>
        <article className={`${styles.featureCard} ${adminStyles.metricCard} ${adminStyles.metricBlue}`}>
          <h3 className={adminStyles.metricTitle}>Pending Tips</h3>
          <p className={adminStyles.metricValue}>{pendingTips.length}</p>
        </article>
        <article className={`${styles.featureCard} ${adminStyles.metricCard} ${adminStyles.metricGreen}`}>
          <h3 className={adminStyles.metricTitle}>Approved Today</h3>
          <p className={adminStyles.metricValue}>{approvedToday}</p>
        </article>
        <article className={`${styles.featureCard} ${adminStyles.metricCard} ${adminStyles.metricRed}`}>
          <h3 className={adminStyles.metricTitle}>High Priority</h3>
          <p className={adminStyles.metricValue}>{highPriority}</p>
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
                                onClick={() => handleApproveReport(r.id)}
                                disabled={updatingId === r.id}
                                aria-label="Approve"
                                title="Approve"
                              >
                                <IconCheck />
                              </button>
                              <button
                                type="button"
                                className={`${adminStyles.actionBtn} ${adminStyles.actionReject}`}
                                onClick={() => handleRejectReport(r.id)}
                                disabled={updatingId === r.id}
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
          {!loading && filteredReports.length === 0 && (
            <p className={adminStyles.empty}>No reports match your filters.</p>
          )}
        </article>
      ) : (
        <article className={`${styles.featureCard} ${adminStyles.tableCard}`}>
          <div className={adminStyles.sectionHeader}>
            <div>
              <h3 className={styles.cardTitle}>Hygiene Tips</h3>
              <p className={adminStyles.sectionDesc}>Review and approve submitted tips</p>
            </div>
            <select
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
      )}

      {/* User Management */}
      <article className={`${styles.featureCard} ${adminStyles.manageCard}`}>
        <h3 className={styles.cardTitle}>Manage User Roles</h3>
        <p className={adminStyles.sectionDesc}>
          Change a user&apos;s role to user or admin.
        </p>
        {loading ? (
          <Loader />
        ) : (
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => {
                  const selectedRole = pendingRole[p.id] ?? p.role
                  const hasChange = selectedRole !== p.role
                  return (
                    <tr key={p.id}>
                      <td>{p.email ?? '—'}</td>
                      <td>{p.full_name ?? '—'}</td>
                      <td>
                        <select
                          className={adminStyles.select}
                          value={selectedRole}
                          onChange={(e) =>
                            setPendingRole((prev) => ({
                              ...prev,
                              [p.id]: e.target.value as AppRole,
                            }))
                          }
                          aria-label={`Role for ${p.email ?? p.id}`}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td>
                        {hasChange ? (
                          <button
                            type="button"
                            className={adminStyles.saveBtn}
                            disabled={savingRoleId === p.id}
                            onClick={() => saveRole(p.id, selectedRole)}
                          >
                            {savingRoleId === p.id ? 'Saving…' : 'Save'}
                          </button>
                        ) : (
                          <span className={adminStyles.saved}>Saved</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  )
}
