// src/lib/mdx.ts
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

// ─── Constantes ──────────────────────────────────────────────────────────────

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'ctfs')

// ─── Types ───────────────────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard' | 'insane'

export interface CTFPost {
  slug: string
  title: string
  date: string          // ISO string : "2025-03-20"
  description: string
  tags: string[]
  difficulty: Difficulty
  platform: string      // ex: "HackTheBox", "Root-Me", "FCSC"
  solved: boolean
}

// CTFPost + le contenu MDX brut (utilisé uniquement pour la page détail)
export interface CTFPostWithContent extends CTFPost {
  rawContent: string
}

// ─── Helpers privés ──────────────────────────────────────────────────────────

function parsePostFromFile(filename: string): CTFPost {
  const slug = filename.replace(/\.mdx?$/, '')
  const filePath = path.join(CONTENT_DIR, filename)
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const { data } = matter(fileContent)

  return {
    slug,
    title:       data.title       ?? 'Untitled',
    date:        data.date        ?? new Date().toISOString().split('T')[0],
    description: data.description ?? '',
    tags:        Array.isArray(data.tags) ? data.tags : [],
    difficulty:  data.difficulty  ?? 'medium',
    platform:    data.platform    ?? 'Unknown',
    solved:      data.solved      ?? true,
  }
}

// ─── API publique ─────────────────────────────────────────────────────────────

/**
 * Retourne tous les posts triés du plus récent au plus ancien.
 * Utilisé par la page /blog (liste).
 */
export function getAllPosts(): CTFPost[] {
  if (!fs.existsSync(CONTENT_DIR)) return []

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))

  return files
    .map(parsePostFromFile)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Retourne un post avec son contenu MDX brut.
 * Retourne null si le slug n'existe pas → déclenchera un notFound() dans la page.
 * Utilisé par la page /blog/[slug].
 */
export function getPostBySlug(slug: string): CTFPostWithContent | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(fileContent)

  return {
    ...parsePostFromFile(`${slug}.mdx`),
    rawContent: content,
  }
}

/**
 * Génère tous les slugs valides — utilisé pour generateStaticParams().
 */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''))
}