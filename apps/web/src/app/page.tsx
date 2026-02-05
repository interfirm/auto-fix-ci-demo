import { Button } from '@interfirm/ui'
import { formatDate } from '@/lib/utils'

export default function Home() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Interfirm Demo - Public Site</h1>
      <p>Today: {formatDate(new Date())}</p>
      <Button>Get Started</Button>
    </main>
  )
}
