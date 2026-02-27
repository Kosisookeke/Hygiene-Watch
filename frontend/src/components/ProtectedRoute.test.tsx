import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import type { User } from 'firebase/auth'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

const mockUser = { uid: '123' } as User

const mockAuthValue = {
  profile: null,
  signOut: vi.fn().mockResolvedValue(undefined),
  refreshProfile: vi.fn().mockResolvedValue(undefined),
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loader when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthValue,
      user: null,
      role: 'user',
      loading: true,
    })
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><div>Protected</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('redirects to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthValue,
      user: null,
      role: 'user',
      loading: false,
    })
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><div>Protected</div></ProtectedRoute>} />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('renders children when user is authenticated and has required role', () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthValue,
      user: mockUser,
      role: 'user',
      loading: false,
    })
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><div>Protected content</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('redirects to dashboard when user lacks required admin role', () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthValue,
      user: mockUser,
      role: 'user',
      loading: false,
    })
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole="admin">
                <div>Admin only</div>
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
