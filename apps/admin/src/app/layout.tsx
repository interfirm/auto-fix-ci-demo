import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Interfirm Demo - Admin',
  description: 'Admin dashboard for Interfirm Demo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
