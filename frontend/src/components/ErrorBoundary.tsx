import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
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
      return (
        <div style={{
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          maxWidth: '600px',
          margin: '2rem auto',
        }}>
          <h1 style={{ color: '#c00' }}>Something went wrong</h1>
          <p>The app crashed. Check the browser console (F12) for details.</p>
          <pre style={{
            background: '#f5f5f5',
            padding: '1rem',
            overflow: 'auto',
            fontSize: '0.875rem',
          }}>
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
