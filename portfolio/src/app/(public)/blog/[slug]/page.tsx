// src/app/(public)/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypePrettyCode from 'rehype-pretty-code'
import type { Options as PrettyCodeOptions } from 'rehype-pretty-code'
import { getAllSlugs, getPostBySlug, type Difficulty } from '@/src/lib/mdx'
import { getMDXComponents } from '@/src/components/ui/mdx-components'

// ─── Config rehype-pretty-code ────────────────────────────────────────────────

const prettyCodeOptions: PrettyCodeOptions = {
  theme: 'vesper',          // Thème sombre "cyber" — alternatives : 'github-dark', 'one-dark-pro'
  keepBackground: false,    // On gère le bg via notre composant <pre>
  defaultLang: 'plaintext',
}

// ─── Static params (SSG) ─────────────────────────────────────────────────────

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: `${post.title} — CTF Write-up`,
    description: post.description,
  }
}

// ─── Helpers visuels ─────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; className: string }> = {
  easy:   { label: 'Easy',   className: 'text-green-400  bg-green-400/10  border-green-400/30'  },
  medium: { label: 'Medium', className: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  hard:   { label: 'Hard',   className: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
  insane: { label: 'Insane', className: 'text-red-400    bg-red-400/10    border-red-400/30'    },
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(dateStr))
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) notFound()

  const diffConfig = DIFFICULTY_CONFIG[post.difficulty]

  return (
    <article className="w-full max-w-3xl mx-auto py-16 px-4">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-10 font-mono">
        <Link href="/" className="hover:text-foreground transition-colors">~</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-foreground transition-colors">ctf-writeups</Link>
        <span>/</span>
        <span className="text-foreground truncate">{slug}</span>
      </nav>

      {/* Header de l'article */}
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">{post.platform}</span>
          <span className="text-muted-foreground/30">·</span>
          <span className={`text-xs font-mono px-2 py-0.5 rounded border ${diffConfig.className}`}>
            {diffConfig.label}
          </span>
          <span className="text-muted-foreground/30">·</span>
          <time className="text-xs text-muted-foreground">{formatDate(post.date)}</time>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
          {post.title}
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
          {post.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        <hr className="mt-8 border-border/40" />
      </header>

      {/* Contenu MDX compilé server-side */}
      <div className="prose-zinc">
        <MDXRemote
          source={post.rawContent}
          components={getMDXComponents()}
          options={{
            mdxOptions: {
              rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
            },
          }}
        />
      </div>

      {/* Footer article */}
      <footer className="mt-16 pt-6 border-t border-border/40">
        <Link
          href="/blog"
          className="text-sm font-mono text-muted-foreground hover:text-primary transition-colors"
        >
          ← Retour aux write-ups
        </Link>
      </footer>

    </article>
  )
}
