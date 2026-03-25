"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PortfolioPage() {
  return (
    <div className="flex flex-col items-center min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Section Héro */}
      <section className="flex flex-col items-center justify-center text-center mt-10 mb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center rounded-full border border-border px-3 py-1 text-sm font-medium text-muted-foreground"
        >
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
          Lorem ipsum dolor sit amet
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
        >
          Consectetur adipiscing elit. <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-slate-500">
            Sed do eiusmod tempor.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed"
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button size="lg" className="font-semibold">
            <Link href="/blog">Aller vers mes Write-ups</Link>
          </Button>
          <Button size="lg" variant="outline" className="font-semibold">
           <Link href="/dashboard">Ouvrir le Dashboard SRSI</Link>
          </Button>
        </motion.div>
      </section>

      {/* Section Projets */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="w-full max-w-5xl mt-10"
      >
        <h2 className="text-2xl font-bold mb-8 border-b border-border/40 pb-2">Mes Projets</h2>
        
        {/* Grille de projets factices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="p-6 rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm hover:border-primary/50 transition-colors">
              <h3 className="font-semibold text-lg mb-2">Projet {item}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
              </p>
              <div className="flex gap-2">
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">Tech 1</span>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">Tech 2</span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
      
    </div>
  )
}