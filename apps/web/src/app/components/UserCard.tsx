"use client"

import { useState } from "react"

// any だらけの型定義
interface UserCardProps {
  user: any
  onDelete: any
}

export default function UserCard({ user, onDelete }: UserCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(user.name)

  const handleDelete = () => {
    onDelete(user.id)
  }

  // any を返す関数
  const getRoleBadgeColor = (role: any): any => {
    switch (role) {
      case "admin":
        return "bg-red-500"
      case "editor":
        return "bg-blue-500"
      case "viewer":
        return "bg-gray-500"
      default:
        return "bg-gray-300"
    }
  }

  // any でキャスト
  const formattedDate = (user as any).createdAt?.toISOString?.() ?? String(user.createdAt)

  // エラーハンドリングなし
  const handleSave = async () => {
    const res = await fetch("/api/users/" + user.id, {
      method: "PATCH",
      body: JSON.stringify({ name: editName }),
    })
    const data = await res.json()
    console.log(data)
    setIsEditing(false)
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: "16px", borderRadius: "8px", marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>{user.name}</h3>
        <span
          style={{
            backgroundColor: getRoleBadgeColor(user.role),
            color: "white",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          {user.role}
        </span>
      </div>
      <p style={{ color: "#666", margin: "4px 0" }}>{user.email}</p>
      <p style={{ color: "#999", fontSize: "12px" }}>Joined: {formattedDate}</p>
      <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
        <button onClick={() => setIsEditing(!isEditing)} style={{ padding: "4px 12px", cursor: "pointer" }}>
          {isEditing ? "Cancel" : "Edit"}
        </button>
        <button onClick={handleDelete} style={{ padding: "4px 12px", cursor: "pointer", color: "red" }}>
          Delete
        </button>
      </div>
      {isEditing && (
        <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
          <button onClick={handleSave} style={{ padding: "4px 12px", cursor: "pointer", color: "green" }}>
            Save
          </button>
        </div>
      )}
    </div>
  )
}
