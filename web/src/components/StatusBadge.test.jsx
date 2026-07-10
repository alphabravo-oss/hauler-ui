import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from './StatusBadge.jsx'

describe('StatusBadge', () => {
  it('renders the running status text and warning class', () => {
    const { container } = render(<StatusBadge status="running" />)
    expect(screen.getByText('running')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('badge')
    expect(badge).toHaveClass('badge-warning')
  })

  it('renders the succeeded status text and success class', () => {
    const { container } = render(<StatusBadge status="succeeded" />)
    expect(screen.getByText('succeeded')).toBeInTheDocument()
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('badge-success')
  })

  it('appends a custom className', () => {
    const { container } = render(<StatusBadge status="queued" className="extra" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('badge-info')
    expect(badge).toHaveClass('extra')
  })
})
