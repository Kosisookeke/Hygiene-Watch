import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import HomeOrDashboard from './components/HomeOrDashboard'
import Dashboard from './pages/Dashboard'
import HygieneTips from './pages/HygieneTips'
import TipView from './pages/TipView'
import ReportIssue from './pages/ReportIssue'
import ReportView from './pages/ReportView'
import MyLogs from './pages/MyLogs'
import Profile from './pages/Profile'
import AccountSettings from './pages/AccountSettings'
import PrivacySettings from './pages/PrivacySettings'
import Inspector from './pages/Inspector'
import Admin from './pages/Admin'
import SignUp from './pages/SignUp'
import LogIn from './pages/LogIn'
import ForgotPassword from './pages/ForgotPassword'

function App() {
  return (
    <Routes>
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<LogIn />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/*" element={
        <Layout>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomeOrDashboard />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/tips" element={<HygieneTips />} />
              <Route path="/tips/:id" element={<TipView />} />
              <Route path="/report" element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />
              <Route path="/reports/:id" element={<ReportView />} />
              <Route path="/my-logs" element={<ProtectedRoute><MyLogs /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/profile/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
              <Route path="/profile/privacy-settings" element={<ProtectedRoute><PrivacySettings /></ProtectedRoute>} />
              <Route path="/inspector" element={<ProtectedRoute requiredRole="inspector"><Inspector /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
            </Routes>
          </ErrorBoundary>
        </Layout>
      } />
    </Routes>
  )
}

export default App
