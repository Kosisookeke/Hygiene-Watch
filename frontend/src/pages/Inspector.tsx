import { useAuth } from '../contexts/AuthContext'
import styles from './Dashboard.module.css'

export default function Inspector() {
  const { role } = useAuth()
  const canAccess = role === 'inspector' || role === 'admin'

  if (!canAccess) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Access denied</h1>
        <p className={styles.subtitle}>This area is for inspectors and admins only.</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Inspector area</h1>
      <p className={styles.subtitle}>
        View and manage inspections. (Content for inspectors and admins.)
      </p>
      <div className={styles.card}>
        <p className={styles.meta}>Role: <span className={styles.roleBadge}>{role}</span></p>
        <p>Inspector-specific content and actions can go here.</p>
      </div>
    </div>
  )
}
