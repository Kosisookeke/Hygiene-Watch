import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Home from '../pages/Home'

/**
 * For logged-in users, redirect to dashboard (home is in the dashboard).
 * For guests, show the marketing Home page.
 */
export default function HomeOrDashboard() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return <Home />
}
