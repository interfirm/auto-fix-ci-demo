'use client'

import { useState } from 'react'

// 型定義
interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  createdAt: Date
}

interface UserCardProps {
  user: User
  onDelete: (id: number) => void
}

// 意図的な型エラーを含むコンポーネント
export default function UserCard({ user, onDelete }: UserCardProps) {
  // ❌ 型エラー1: boolean に string を代入
  const [isEditing, setIsEditing] = useState<boolean>('false')

  // ❌ 型エラー2: number に string を代入
  const [editName, setEditName] = useState<number>(user.name)

  // ❌ 型エラー3: 引数の型が違う (string を number に渡す)
  const handleDelete = () => {
    onDelete(user.id.toString())
  }

  // ❌ 型エラー4: 戻り値の型が違う
  const getRoleBadgeColor = (role: User['role']): number => {
    switch (role) {
      case 'admin':
        return 'bg-red-500'
      case 'editor':
        return 'bg-blue-500'
      case 'viewer':
        return 'bg-gray-500'
    }
  }

  // ❌ 型エラー5: Date を string として使用
  const formattedDate: string = user.createdAt

  return (
    <div
      style={{
        border: '1px solid #ccc',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>{user.name}</h3>
        <span
          style={{
            backgroundColor: getRoleBadgeColor(user.role),
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
          }}
        >
          {user.role}
        </span>
      </div>
      <p style={{ color: '#666', margin: '4px 0' }}>{user.email}</p>
      <p style={{ color: '#999', fontSize: '12px' }}>Joined: {formattedDate}</p>
      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setIsEditing(!isEditing)}
          style={{ padding: '4px 12px', cursor: 'pointer' }}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
        <button
          onClick={handleDelete}
          style={{ padding: '4px 12px', cursor: 'pointer', color: 'red' }}
        >
          Delete
        </button>
      </div>
      {isEditing && (
        <div style={{ marginTop: '8px' }}>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
      )}
    </div>
  )
}
