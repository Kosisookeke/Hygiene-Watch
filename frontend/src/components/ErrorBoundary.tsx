import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
  /** Optional fallback UI. If not provided, uses default error UI with back links. */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          maxWidth: '600px',
          margin: '2rem auto',
        }}>
          <h1 style={{ color: '#c00' }}>Something went wrong</h1>
          <p>This page encountered an error. You can try again or go back.</p>
          <pre style={{
            background: '#f5f5f5',
            padding: '1rem',
            overflow: 'auto',
            fontSize: '0.875rem',
          }}>
            {this.state.error.message}
          </pre>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ padding: '0.5rem 1rem' }}
            >
              Try again
            </button>
            <Link to="/dashboard" style={{ padding: '0.5rem 1rem' }}>Dashboard</Link>
            <Link to="/" style={{ padding: '0.5rem 1rem' }}>Home</Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
