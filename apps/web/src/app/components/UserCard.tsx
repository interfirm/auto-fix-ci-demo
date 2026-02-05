'use client'

import { useState } from 'react'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface UserCardProps {
  user: User
  onSelect?: (user: User) => void
}

export function UserCard({ user, onSelect }: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  const handleClick = () => {
    if (onSelect) {
      onSelect(user)
    }
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className="relative flex flex-col gap-2 rounded-lg border border-gray-200 p-4 shadow-sm transition-shadow hover:shadow-md"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick()
        }
      }}
    >
      <div className="flex items-center gap-3">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white">
            <span className="text-sm font-semibold">{initials}</span>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-gray-900">{user.name}</h3>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
      </div>

      {isHovered && (
        <div className="rounded bg-blue-50 p-3">
          <p className="text-xs text-gray-700">Click to select this user</p>
        </div>
      )}
    </div>
  )
}
