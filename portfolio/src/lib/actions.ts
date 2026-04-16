// src/lib/actions.ts
"use server"


import { updateAurigaTokenManually } from "@/src/lib/auriga";
import { revalidatePath } from "next/cache";
import { updateEdusignTokenManually } from "@/src/lib/edusign";

// Fonction utilitaire pour récupérer le token PocketBase (comme dans auriga.ts)
async function getPbAdminToken(): Promise<string> {
  const pbUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';
  const res = await fetch(`${pbUrl}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      identity: process.env.PB_ADMIN_EMAIL, 
      password: process.env.PB_ADMIN_PASSWORD 
    }),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error("Identifiants PB invalides.");
  const data = await res.json();
  return data.token;
}

export async function updateTokenAction(prevState: any, formData: FormData) {
  if (formData.get("admin_secret") !== process.env.ADMIN_SECRET) return { error: "Mot de passe incorrect." };
  try {
    const token = formData.get("token") as string;
    await updateEdusignTokenManually(token);
    revalidatePath('/dashboard');
    return { success: true, message: "Token EduSign mis à jour !" };
  } catch (error) { return { error: "Erreur de mise à jour." }; }
}

export async function createWriteupAction(prevState: any, formData: FormData) {
  // 1. Vérification de la sécurité
  const secret = formData.get("admin_secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return { error: "Mot de passe administrateur incorrect." };
  }
  
  // On retire le secret du formData pour ne pas l'envoyer à PocketBase
  formData.delete("admin_secret");

  // 2. Formatage des données spécifiques (ex: la checkbox 'solved' renvoie "on", PB veut un booléen)
  const isSolved = formData.get("solved");
  formData.set("solved", isSolved === "on" ? "true" : "false");

  try {
    const pbUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';
    const adminToken = await getPbAdminToken();

    // 3. L'envoi magique : fetch comprend nativement les objets FormData (multipart/form-data) !
    const res = await fetch(`${pbUrl}/api/collections/pf_writeups/records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        // ⚠️ Ne SURTOUT PAS mettre de Content-Type ici, fetch va générer le "boundary" tout seul
      },
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Erreur PB:", errorData);
      return { error: "Erreur lors de la création dans PocketBase." };
    }

    // 4. On dit à Next.js de vider le cache de la page /blog pour afficher le nouveau write-up !
    revalidatePath('/blog');
    
    return { success: true, message: "Write-up publié avec succès !" };

  } catch (error) {
    console.error(error);
    return { error: "Erreur serveur critique." };
  }
}


export async function createProjectAction(prevState: any, formData: FormData) {
  if (formData.get("admin_secret") !== process.env.ADMIN_SECRET) return { error: "Mot de passe incorrect." };
  formData.delete("admin_secret");

  try {
    const adminToken = await getPbAdminToken();
    const pbUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';
    const res = await fetch(`${pbUrl}/api/collections/pf_projects/records`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: formData // Contient title, description, github_url et l'image file
    });
    if (!res.ok) return { error: "Erreur création PB" };
    revalidatePath('/');
    return { success: true, message: "Projet publié !" };
  } catch (error) { return { error: "Erreur serveur." }; }
}

export async function addPlayerAction(prevState: any, formData: FormData) {
  if (formData.get("admin_secret") !== process.env.ADMIN_SECRET) return { error: "Mot de passe incorrect." };
  formData.delete("admin_secret");

  // On convertit le formulaire en objet classique
  const data = Object.fromEntries(formData);
  
  // NETTOYAGE : Si numeric_id est vide, on le supprime pour ne pas froisser PocketBase
  if (!data.numeric_id || data.numeric_id === "") {
    delete data.numeric_id;
  }

  try {
    const adminToken = await getPbAdminToken();
    const pbUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';
    const res = await fetch(`${pbUrl}/api/collections/pf_players/records`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data) 
    });
    
    if (!res.ok) {
      const err = await res.json();
      console.error(err);
      return { error: "Erreur création PB" };
    }
    
    revalidatePath('/dashboard');
    return { success: true, message: "Joueur ajouté au Leaderboard !" };
  } catch (error) { return { error: "Erreur serveur." }; }
}