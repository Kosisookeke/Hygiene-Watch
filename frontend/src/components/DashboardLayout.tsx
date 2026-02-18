import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import AppSidebar from './AppSidebar'
import { useAuth } from '../contexts/AuthContext'
import { IconArrowRight } from './Icons'
import styles from './DashboardLayout.module.css'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/report': 'Report Issue',
  '/tips': 'Hygiene Tips',
  '/my-logs': 'My Logs',
  '/profile': 'Profile',
  '/profile/account-settings': 'Settings',
  '/profile/privacy-settings': 'Privacy Settings',
  '/inspector': 'Inspector',
  '/admin': 'Admin',
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const path = location.pathname
  const pageTitle =
    PAGE_TITLES[path] ||
    (path.startsWith('/tips/') ? 'Hygiene Tips' : path.startsWith('/reports/') ? 'My Logs' : 'Dashboard')

  const displayName = profile?.full_name || user?.displayName || user?.email || 'User'
  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className={styles.wrapper}>
      <AppSidebar />
      <div className={styles.main}>
        <header className={styles.topBar}>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
          <div className={styles.userBlock}>
            <div className={styles.userInfo}>
              {profile?.avatar_url ? (
                <span
                  className={`${styles.userAvatar} ${styles.userAvatarImg}`}
                  style={{ backgroundImage: `url(${profile.avatar_url})` }}
                  aria-hidden
                />
              ) : (
                <span className={styles.userAvatar}>{initials}</span>
              )}
              <span className={styles.userName}>{displayName}</span>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className={styles.signOutBtn}
              aria-label="Sign out"
            >
              <IconArrowRight />
            </button>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
