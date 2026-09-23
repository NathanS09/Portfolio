// src/app/(public)/page.tsx
// PLUS DE "use server", c'est un composant serveur par défaut.
// PLUS DE "use client" non plus.

import PortfolioClient from "@/src/components/public/portfolio-client" // On importe le visuel
import { pbFetch } from "@/src/lib/pocketbase"

interface Project {
  id: string;
  collectionId: string;
  title: string;
  description: string;
  image: string;
  github_url: string;
  tags?: string;
}

// La fonction serveur qui va lire PocketBase (routage interne)
async function getProjects(): Promise<Project[]> {
  try {
    const res = await pbFetch(`/api/collections/pf_projects/records?sort=-created`, {
      next: { revalidate: 60 }
    });
    const data = await res.json();
    return data.items;
  } catch (error) {
    console.error("Erreur de connexion à PocketBase :", error);
    return [];
  }
}

// Le composant de la Page (Serveur)
export default async function PortfolioPage() {
  // 1. Le Serveur télécharge les données (ultra rapide car sur le même VPS, via l'URL interne)
  const projects = await getProjects();
  // La prop pbUrl ne sert qu'à construire les URL d'images affichées dans le navigateur :
  // elle doit rester l'URL publique.
  const pbUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';

  // 2. Le Serveur renvoie le code au navigateur du visiteur,
  // en lui passant les données "prêtes à l'emploi" pour l'animation.
  return <PortfolioClient projects={projects} pbUrl={pbUrl} />
}