// src/app/(public)/page.tsx
// PLUS DE "use server", c'est un composant serveur par défaut.
// PLUS DE "use client" non plus.

import PortfolioClient from "@/src/components/public/portfolio-client" // On importe le visuel

interface Project {
  id: string;
  collectionId: string;
  title: string;
  description: string;
  image: string;
  github_url: string;
  tags?: string;
}

// La fonction serveur qui va lire PocketBase
async function getProjects(): Promise<Project[]> {
  const pbUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';
  try {
    const res = await fetch(`${pbUrl}/api/collections/pf_projects/records?sort=-created`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items;
  } catch (error) {
    console.error("Erreur de connexion à PocketBase :", error);
    return [];
  }
}

// Le composant de la Page (Serveur)
export default async function PortfolioPage() {
  // 1. Le Serveur télécharge les données (ultra rapide car sur le même VPS)
  const projects = await getProjects();
  const pbUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';

  // 2. Le Serveur renvoie le code au navigateur du visiteur, 
  // en lui passant les données "prêtes à l'emploi" pour l'animation.
  return <PortfolioClient projects={projects} pbUrl={pbUrl} />
}