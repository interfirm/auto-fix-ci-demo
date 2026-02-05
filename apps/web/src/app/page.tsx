import { Button } from '@interfirm/ui'
import { formatDate } from '@/lib/utils'
import UserCard from './components/UserCard'

const mockUsers = [
  {
    id: 1,
    name: '田中太郎',
    email: 'tanaka@example.com',
    role: 'admin' as const,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 2,
    name: '鈴木花子',
    email: 'suzuki@example.com',
    role: 'editor' as const,
    createdAt: new Date('2024-03-20'),
  },
  {
    id: 3,
    name: '佐藤次郎',
    email: 'sato@example.com',
    role: 'viewer' as const,
    createdAt: new Date('2024-06-01'),
  },
]

export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Interfirm Demo</h1>
      <p style={{ color: '#666' }}>Today: {formatDate(new Date())}</p>

      <h2 style={{ marginTop: '2rem' }}>Users</h2>
      {mockUsers.map((user) => (
        <UserCard key={user.id} user={user} onDelete={(id) => console.log('delete', id)} />
      ))}

      <div style={{ marginTop: '2rem' }}>
        <Button>Get Started</Button>
      </div>
    </main>
  )
}
