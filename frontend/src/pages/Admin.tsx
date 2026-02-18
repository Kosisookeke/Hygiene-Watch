import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Loader from '../components/Loader'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { AppRole, Profile } from '../lib/types'
import styles from './Dashboard.module.css'
import adminStyles from './Admin.module.css'

const PROFILES_COLLECTION = 'profiles'

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
    getDocs(collection(db, PROFILES_COLLECTION))
      .then((snap) => {
        if (!mounted) return
        const list: Profile[] = []
        snap.docs.forEach((d) => {
          const data = d.data()
          list.push({
            id: d.id,
            full_name: (data.full_name as string) ?? null,
            email: (data.email as string) ?? null,
            role: (data.role as AppRole) ?? 'user',
            created_at: (data.created_at as string) ?? '',
            updated_at: (data.updated_at as string) ?? '',
          })
        })
        list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        setProfiles(list)
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load profiles')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [isAdmin])

  async function saveRole(profileId: string, newRole: AppRole) {
    setSavingId(profileId)
    setError(null)
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role')
    } finally {
      setSavingId(null)
    }
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
          Set the first admin in Firebase Console (Firestore: profiles → your uid → role: &quot;admin&quot;); after that you can use this table.
        </p>
        {error && <div className={adminStyles.error}>{error}</div>}
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
