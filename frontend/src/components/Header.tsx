import { useState } from 'react'
import { Link } from 'react-router-dom'
import LogoIcon from './LogoIcon'
import { useAuth } from '../contexts/AuthContext'
import { IconMenu, IconX } from './Icons'
import styles from './Header.module.css'

export default function Header() {
  const { user, role, loading, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <LogoIcon className={styles.logoIcon} />
          <span>HygieneWatch</span>
        </Link>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <IconX /> : <IconMenu />}
        </button>
        <div className={`${styles.navAndActions} ${mobileMenuOpen ? styles.navOpen : ''}`}>
          <nav className={styles.nav}>
            <Link to="/" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/tips" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Hygiene Tips</Link>
            <a href="/#about" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>About Us</a>
            <a href="/#contact" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Contact Us</a>
            {user && (
              <>
                <Link to="/dashboard" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                <Link to="/report" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Report Issue</Link>
                <Link to="/my-logs" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>My Logs</Link>
                <Link to="/profile" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                {role === 'admin' && (
                  <Link to="/admin" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Admin Inspector</Link>
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
