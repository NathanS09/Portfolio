// src/app/dashboard/layout.tsx
import type { Metadata } from 'next'
import Link from "next/link"
import { ThemeProvider } from '@/src/components/ui/theme-provider'
import '../globals.css'

export const metadata: Metadata = {
  title: 'SRSI_HUB | Supervision',
  description: 'Écran de supervision SRSI en temps réel',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased p-4 md:p-6">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* C'est ici que la magie opère : w-full prend 100% de l'espace disponible */}
          <div className="w-full flex flex-col space-y-6">
            
            <header className="flex justify-between items-center border-b border-border/40 pb-4">
              <h1 className="text-2xl font-bold text-primary tracking-tight">
                SRSI_HUB <span className="animate-pulse">_</span>
              </h1>
              <Link href="/" className="text-sm font-mono text-muted-foreground hover:text-primary transition-colors">
                [ ← Retour Portfolio ]
              </Link>
            </header>

            <main className="w-full">
              {children}
            </main>
            
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}