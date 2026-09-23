// src/components/portfolio-client.tsx
"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button" // Ajuste le chemin selon ton projet si besoin
import Link from "next/link"

// On définit le format des données qu'on va recevoir du parent
interface Project {
  id: string;
  collectionId: string;
  title: string;
  description: string;
  image: string;
  github_url: string;
  tags?: string;
}

export default function PortfolioClient({ 
  projects, 
  pbUrl 
}: { 
  projects: Project[], 
  pbUrl: string 
}) {
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
          Ingénieur Cybersécurité OT/ICS
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
        >
          Bienvenue sur mon <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-slate-500">
            Portfolio.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed"
        >
          Retrouvez mes write-ups CTF, mes projets SRSI, et ma préparation pour le semi-marathon de Vichy et le triathlon M.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button size="lg" className="font-semibold" asChild>
            <Link href="/blog">Aller vers mes Write-ups</Link>
          </Button>
          <Button size="lg" variant="outline" className="font-semibold" asChild>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((item) => (
            <div key={item.id} className="p-6 rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm hover:border-primary/50 transition-colors">
              
              {item.image && (
                <div className="w-full h-48 mb-4 rounded-md overflow-hidden bg-muted relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`${pbUrl}/api/files/${item.collectionId}/${item.id}/${item.image}`} 
                    alt={item.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {item.description}
              </p>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/40">
                <a 
                  href={item.github_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-mono bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded transition-colors"
                >
                  [ GitHub ]
                </a>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <p className="text-muted-foreground font-mono text-sm col-span-2 text-center py-10">
              {"// Aucun projet trouvé dans la base de données."}
            </p>
          )}
        </div>
      </motion.section>
      
    </div>
  )
}