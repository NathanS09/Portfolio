// src/app/(public)/blog/page.tsx
import Link from 'next/link'
import { getAllPosts, type Difficulty } from '@/src/lib/mdx'

// ─── Helpers visuels ─────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; className: string }> = {
  easy:   { label: 'Easy',   className: 'text-green-400  bg-green-400/10  border-green-400/30'  },
  medium: { label: 'Medium', className: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  hard:   { label: 'Hard',   className: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
  insane: { label: 'Insane', className: 'text-red-400    bg-red-400/10    border-red-400/30'    },
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const config = DIFFICULTY_CONFIG[difficulty]
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${config.className}`}>
      {config.label}
    </span>
  )
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(dateStr))
}

// ─── Page ────────────────────────────────────────────────────────────────────

export const metadata = {
  title: 'CTF Write-ups',
  description: 'Mes write-ups de CTF — HackTheBox, Root-Me, FCSC, et plus.',
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto py-16 px-4">

      {/* Header */}
      <div className="mb-12">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4 font-mono">
          <Link href="/" className="hover:text-foreground transition-colors">~</Link>
          <span>/</span>
          <span className="text-foreground">ctf-writeups</span>
        </nav>
        
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">Write-ups CTF</h1>
        <p className="text-muted-foreground">
          Notes techniques sur les machines et challenges résolus.{' '}
          <span className="font-mono text-sm">{posts.length} articles</span>
        </p>
      </div>

      {/* Liste des articles */}
      {posts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground font-mono text-sm">
          <p>{"// Aucun write-up pour l'instant."}</p>
          <p className="mt-1 text-xs opacity-60">Les fichiers MDX apparaîtront ici automatiquement.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <article className="p-5 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:bg-card/80 transition-all duration-200">

                  {/* Méta : platform + difficulty + date */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">
                      {post.platform}
                    </span>
                    <span className="text-muted-foreground/30">·</span>
                    <DifficultyBadge difficulty={post.difficulty} />
                    <span className="text-muted-foreground/30">·</span>
                    <time className="text-xs text-muted-foreground">
                      {formatDate(post.date)}
                    </time>
                  </div>

                  {/* Titre */}
                  <h2 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors mb-1">
                    {post.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {post.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                </article>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}