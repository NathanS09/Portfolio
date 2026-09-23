import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Connexion | SRSI_HUB',
  description: 'Authentification requise.',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
