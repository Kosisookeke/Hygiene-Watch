import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { AppRole, Profile } from '../lib/types'
import styles from './Dashboard.module.css'
import adminStyles from './Admin.module.css'

export default function Admin() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingRole, setPendingRole] = useState<Record<string, AppRole>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    let mounted = true
    setLoading(true)
    setError(null)
    supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at, updated_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (!mounted) return
        setLoading(false)
        if (err) {
          setError(err.message)
          return
        }
        setProfiles((data as Profile[]) ?? [])
      })
    return () => { mounted = false }
  }, [isAdmin])

  async function saveRole(profileId: string, newRole: AppRole) {
    setSavingId(profileId)
    setError(null)
    const { error: err } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', profileId)
    setSavingId(null)
    if (err) {
      setError(err.message)
      return
    }
    setPendingRole((prev) => {
      const next = { ...prev }
      delete next[profileId]
      return next
    })
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p))
    )
  }

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Access denied</h1>
        <p className={styles.subtitle}>This area is for administrators only.</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Admin area</h1>
      <p className={styles.subtitle}>
        Manage users, roles, and system settings.
      </p>

      <section className={adminStyles.section}>
        <h2 className={adminStyles.sectionTitle}>Manage user roles</h2>
        <p className={adminStyles.sectionDesc}>
          Change a user&apos;s role to <strong>user</strong>, <strong>inspector</strong>, or <strong>admin</strong>.
          Only the first admin needs to be set via Supabase; after that you can use this table.
        </p>
        {error && <div className={adminStyles.error}>{error}</div>}
        {loading ? (
          <p className={adminStyles.meta}>Loading profiles…</p>
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
                          <option value="inspector">inspector</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td>
                        {hasChange ? (
                          <button
                            type="button"
                            className={adminStyles.saveBtn}
                            disabled={savingId === p.id}
                            onClick={() => saveRole(p.id, selectedRole)}
                          >
                            {savingId === p.id ? 'Saving…' : 'Save'}
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
      </section>
    </div>
  )
}
