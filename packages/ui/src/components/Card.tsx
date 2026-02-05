import React from 'react'

export interface CardProps {
  title: string
  value: string | number
  description?: string
}

export function Card({ title, value, description }: CardProps) {
  const cardStyle: React.CSSProperties = {
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    minWidth: '200px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.5rem',
  }

  const valueStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#111827',
  }

  const descriptionStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginTop: '0.25rem',
  }

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>{title}</div>
      <div style={valueStyle}>{value}</div>
      {description && <div style={descriptionStyle}>{description}</div>}
    </div>
  )
}
