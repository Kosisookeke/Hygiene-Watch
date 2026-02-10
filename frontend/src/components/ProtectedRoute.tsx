import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { AppRole } from '../lib/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** Require at least this role (user | inspector | admin). Default: any logged-in user */
  requiredRole?: AppRole
}

const ROLE_LEVEL: Record<AppRole, number> = { user: 1, inspector: 2, admin: 3 }

export default function ProtectedRoute({ children, requiredRole = 'user' }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (ROLE_LEVEL[role] < ROLE_LEVEL[requiredRole]) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
