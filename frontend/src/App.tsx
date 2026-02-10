import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
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
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/inspector" element={<ProtectedRoute requiredRole="inspector"><Inspector /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
          </Routes>
        </Layout>
      } />
    </Routes>
  )
}

export default App
