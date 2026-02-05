import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from './Card'

describe('Card', () => {
  it('should render title and value', () => {
    render(<Card title="Total Users" value={1250} />)
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('1250')).toBeInTheDocument()
  })

  it('should render string values', () => {
    render(<Card title="Revenue" value="¥1,000,000" />)
    expect(screen.getByText('¥1,000,000')).toBeInTheDocument()
  })

  it('should render description when provided', () => {
    render(<Card title="Users" value={100} description="+10% from last month" />)
    expect(screen.getByText('+10% from last month')).toBeInTheDocument()
  })

  it('should not render description when not provided', () => {
    render(<Card title="Users" value={100} />)
    expect(screen.queryByText(/from last month/)).not.toBeInTheDocument()
  })
})
