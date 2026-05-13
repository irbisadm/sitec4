import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Project architecture',
  description: 'LikeC4 Next.js wrapper',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
