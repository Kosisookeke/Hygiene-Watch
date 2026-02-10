import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user, profile, role } = useAuth()

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.subtitle}>
        Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}.
      </p>
      <div className={styles.card}>
        <p className={styles.meta}>
          <strong>Email:</strong> {user?.email}
        </p>
        <p className={styles.meta}>
          <strong>Role:</strong> <span className={styles.roleBadge}>{role}</span>
        </p>
        <div className={styles.links}>
          {(role === 'inspector' || role === 'admin') && (
            <Link to="/inspector" className={styles.link}>Inspector area →</Link>
          )}
          {role === 'admin' && (
            <Link to="/admin" className={styles.link}>Admin area →</Link>
          )}
        </div>
      </div>
    </div>
  )
}
