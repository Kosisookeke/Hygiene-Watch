import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Loader from './Loader'

describe('Loader', () => {
  it('renders default loading message', () => {
    render(<Loader />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders custom message when provided', () => {
    render(<Loader message="Fetching data…" />)
    expect(screen.getByText('Fetching data…')).toBeInTheDocument()
  })

  it('renders three loading dots', () => {
    const { container } = render(<Loader />)
    const dots = container.querySelectorAll('[class*="dot"]')
    expect(dots.length).toBeGreaterThanOrEqual(3)
  })
})
