import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Loader from './Loader'
import type { AppRole } from '../lib/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: AppRole
}

const ROLE_LEVEL: Record<AppRole, number> = { user: 1, admin: 2 }

export default function ProtectedRoute({ children, requiredRole = 'user' }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loader />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (ROLE_LEVEL[role] < ROLE_LEVEL[requiredRole]) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
