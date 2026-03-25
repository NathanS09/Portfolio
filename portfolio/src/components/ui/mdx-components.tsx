// src/components/mdx-components.tsx
import type { MDXComponents } from 'mdx/types'

/**
 * Override des éléments HTML générés par MDX.
 * Passé en prop `components` à <MDXRemote />.
 */
export function getMDXComponents(): MDXComponents {
  return {
    // Titres
    h1: ({ children }) => (
      <h1 className="text-3xl font-extrabold tracking-tight mt-10 mb-4 text-foreground">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-bold mt-8 mb-3 text-foreground border-l-2 border-primary pl-3">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold mt-6 mb-2 text-foreground/90">
        {children}
      </h3>
    ),

    // Paragraphe
    p: ({ children }) => (
      <p className="leading-7 text-muted-foreground mb-4">{children}</p>
    ),

    // Listes
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground pl-2">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-1 text-muted-foreground pl-2">
        {children}
      </ol>
    ),

    // Code inline
    code: ({ children }) => (
      <code className="font-mono text-sm bg-muted text-primary px-1.5 py-0.5 rounded">
        {children}
      </code>
    ),

    // Bloc de code — rehype-pretty-code gère le <pre>, on l'habille juste
    pre: ({ children, ...props }) => (
      <div className="relative my-6">
        <pre
          {...props}
          className="overflow-x-auto rounded-lg border border-border/50 bg-zinc-950 p-4 text-sm font-mono [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit"
        >
          {children}
        </pre>
      </div>
    ),

    // Blockquote (utile pour les notes/tips dans les write-ups)
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary/60 pl-4 my-4 text-muted-foreground italic bg-muted/20 py-2 pr-2 rounded-r">
        {children}
      </blockquote>
    ),

    // Liens
    // Liens
    a: ({ href, children }) => (
      <a 
        href={href ?? ''}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
      >
        {children}
      </a>
    ),

    // Séparateur horizontal
    hr: () => <hr className="my-8 border-border/40" />,

    // Tableau (utile pour des comparatifs dans les write-ups)
    table: ({ children }) => (
      <div className="overflow-x-auto my-6">
        <table className="w-full text-sm border-collapse border border-border/50">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-border/50 bg-muted px-3 py-2 text-left font-semibold text-foreground">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-border/50 px-3 py-2 text-muted-foreground">
        {children}
      </td>
    ),
  }
}