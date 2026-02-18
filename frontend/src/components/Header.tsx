import { Link } from 'react-router-dom'
import LogoIcon from './LogoIcon'
import { useAuth } from '../contexts/AuthContext'
import styles from './Header.module.css'

export default function Header() {
  const { user, role, loading, signOut } = useAuth()

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <LogoIcon className={styles.logoIcon} />
          <span>HygieneWatch</span>
        </Link>
        <div className={styles.navAndActions}>
          <nav className={styles.nav}>
            <Link to="/" className={styles.navLink}>Home</Link>
            <Link to="/tips" className={styles.navLink}>Hygiene Tips</Link>
            <a href="/#about" className={styles.navLink}>About Us</a>
            <a href="/#contact" className={styles.navLink}>Contact Us</a>
            {user && (
              <>
                <Link to="/dashboard" className={styles.navLink}>Dashboard</Link>
                <Link to="/report" className={styles.navLink}>Report Issue</Link>
                <Link to="/my-logs" className={styles.navLink}>My Logs</Link>
                <Link to="/profile" className={styles.navLink}>Profile</Link>
                {role === 'admin' && (
                  <Link to="/admin" className={styles.navLink}>Admin Inspector</Link>
                )}
              </>
            )}
          </nav>
          <div className={styles.actions}>
            {!loading && (
              user ? (
                <>
                  <span className={styles.userRole}>{role}</span>
                  <button type="button" onClick={() => signOut()} className={styles.btnOutline}>
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/signup" className={styles.btnOutline}>Sign Up</Link>
                  <Link to="/login" className={styles.btnPrimary}>Log In</Link>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
