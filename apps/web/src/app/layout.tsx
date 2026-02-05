import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Interfirm Demo - Web',
  description: 'Public website for Interfirm Demo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
