import { Button, Card } from '@interfirm/ui'
import { getDashboardStats } from '@/lib/stats'

export default function Dashboard() {
  const stats = getDashboardStats()

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Card title="Total Users" value={stats.totalUsers} />
        <Card title="Active Sessions" value={stats.activeSessions} />
        <Card title="Revenue" value={`¥${stats.revenue.toLocaleString()}`} />
      </div>
      <div style={{ marginTop: '2rem' }}>
        <Button variant="primary">Export Report</Button>
      </div>
    </main>
  )
}
