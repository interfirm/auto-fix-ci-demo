'use client'

import { useState } from 'react'

interface UserCardProps {
  user: any
  onDelete: any
}

const getRoleBadgeColor = (role: any): any => {
  switch (role) {
    case 'admin':
      return '#e74c3c'
    case 'editor':
      return '#3498db'
    default:
      return '#95a5a6'
  }
}

export default function UserCard({ user, onDelete }: UserCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(user.name)

  const formattedDate = (user as any).createdAt?.toISOString?.() ?? String(user.createdAt)

  const handleSave = async () => {
    const res = await fetch('/api/users/' + user.id, {
      method: 'PATCH',
      body: JSON.stringify({ name: editName }),
    })
    const data = await res.json()
    console.log(data)
    setIsEditing(false)
  }

  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {isEditing ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          ) : (
            <strong>{user.name}</strong>
          )}
          <span
            style={{
              marginLeft: '8px',
              padding: '2px 8px',
              borderRadius: '12px',
              color: '#fff',
              backgroundColor: getRoleBadgeColor(user.role),
              fontSize: '0.75rem',
            }}
          >
            {user.role}
          </span>
        </div>
        <div>
          {isEditing ? (
            <button onClick={handleSave} style={{ marginRight: '4px' }}>
              Save
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} style={{ marginRight: '4px' }}>
              Edit
            </button>
          )}
          <button onClick={() => onDelete(user.id)} style={{ color: '#e74c3c' }}>
            Delete
          </button>
        </div>
      </div>
      <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.5rem' }}>{user.email}</p>
      <p style={{ color: '#999', fontSize: '0.75rem' }}>Joined: {formattedDate}</p>
    </div>
  )
}
