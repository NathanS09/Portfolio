// src/app/(public)/layout.tsx
import type { Metadata } from 'next'
import { ThemeProvider } from '@/src/components/ui/theme-provider'
import '../globals.css' 

export const metadata: Metadata = {
  title: 'Portfolio & CTF Write-ups',
  description: 'Portfolio d\'un ingénieur cybersécurité spécialisé OT/ICS. Retrouvez mes write-ups CTF, mes projets SRSI, et ma préparation pour le semi-marathon de Vichy et le triathlon M.',
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            {/* L'ajout de mx-auto centre horizontalement. flex et flex-col préparent le centrage vertical */}
            <main className="flex-1 container mx-auto max-w-screen-2xl flex flex-col">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}