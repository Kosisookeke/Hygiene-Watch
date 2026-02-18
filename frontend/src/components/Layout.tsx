import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import DashboardLayout from './DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import styles from './Layout.module.css'

const DASHBOARD_PATHS = ['/dashboard', '/report', '/reports', '/tips', '/my-logs', '/profile', '/admin']

export default function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  const path = location.pathname
  const isDashboardPath = DASHBOARD_PATHS.some((p) => path === p || path.startsWith(p + '/'))

  if (user && isDashboardPath) {
    return <DashboardLayout>{children}</DashboardLayout>
  }

  return (
    <div className={styles.wrapper}>
      <Header />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  )
}
