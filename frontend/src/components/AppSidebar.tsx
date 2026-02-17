import { NavLink } from 'react-router-dom'
import LogoIcon from './LogoIcon'
import { useAuth } from '../contexts/AuthContext'
import {
  IconHome,
  IconMapPin,
  IconLightbulb,
  IconFileText,
  IconUser,
  IconSearch,
  IconSettings,
} from './Icons'
import styles from './AppSidebar.module.css'

const baseNavItems = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconHome },
  { to: '/report', label: 'Report Issue', Icon: IconMapPin },
  { to: '/tips', label: 'Hygiene Tips', Icon: IconLightbulb },
  { to: '/my-logs', label: 'My Logs', Icon: IconFileText },
  { to: '/profile', label: 'Profile', Icon: IconUser },
]

export default function AppSidebar() {
  const { role } = useAuth()
  const navItems = [
    ...baseNavItems,
    ...(role === 'inspector' || role === 'admin'
      ? [{ to: '/inspector', label: 'Inspector', Icon: IconSearch }]
      : []),
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin', Icon: IconSettings }] : []),
  ]

  return (
    <aside className={styles.sidebar}>
      <NavLink to="/dashboard" className={styles.logo}>
        <LogoIcon className={styles.logoIcon} />
        <span>HygieneWatch</span>
      </NavLink>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
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
  )
}
