import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Propulsion Main',
  description: 'Next.js application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen bg-background font-sans">{children}</body>
    </html>
  )
}

