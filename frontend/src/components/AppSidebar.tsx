import { NavLink } from 'react-router-dom'
import LogoIcon from './LogoIcon'
import { useAuth } from '../contexts/AuthContext'
import {
  IconHome,
  IconMapPin,
  IconLightbulb,
  IconFileText,
  IconUser,
  IconSettings,
  IconX,
} from './Icons'
import styles from './AppSidebar.module.css'

interface AppSidebarProps {
  isOpen?: boolean
  onClose?: () => void
  onNavigate?: () => void
}

const baseNavItems = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconHome },
  { to: '/report', label: 'Report Issue', Icon: IconMapPin },
  { to: '/tips', label: 'Hygiene Tips', Icon: IconLightbulb },
  { to: '/my-logs', label: 'My Logs', Icon: IconFileText },
  { to: '/profile', label: 'Profile', Icon: IconUser },
]

export default function AppSidebar({ isOpen = false, onClose, onNavigate }: AppSidebarProps) {
  const { role } = useAuth()
  const navItems = [
    ...baseNavItems,
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin Inspector', Icon: IconSettings }] : []),
  ]

  return (
    <>
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose?.()}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <NavLink to="/dashboard" className={styles.logo} onClick={onNavigate}>
            <LogoIcon className={styles.logoIcon} />
            <span>HygieneWatch</span>
          </NavLink>
          {onClose && (
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close menu"
            >
              <IconX />
            </button>
          )}
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              <span className={styles.navIcon}><item.Icon /></span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
