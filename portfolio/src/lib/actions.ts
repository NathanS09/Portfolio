// src/lib/actions.ts
"use server"

import { revalidatePath } from "next/cache";

// Fonction utilitaire pour récupérer le token PocketBase (Version v0.23+)
async function getPbAdminToken(): Promise<string> {
  const pbUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';
  const res = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      identity: process.env.PB_ADMIN_EMAIL, 
      password: process.env.PB_ADMIN_PASSWORD 
    }),
    cache: 'no-store'
  });
  if (!res.ok) {
    const errDetails = await res.text();
    throw new Error(`Identifiants PB invalides. Détails: ${errDetails}`);
  }
  const data = await res.json();
  return data.token;
}

export async function createWriteupAction(prevState: any, formData: FormData) {
  const secret = formData.get("admin_secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return { error: "Mot de passe administrateur incorrect." };
  }
  
  formData.delete("admin_secret");

  const isSolved = formData.get("solved");
  formData.set("solved", isSolved === "on" ? "true" : "false");

  try {
    const pbUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';
    const adminToken = await getPbAdminToken();

    const res = await fetch(`${pbUrl}/api/collections/pf_writeups/records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Erreur PB:", errorData);
      return { error: "Erreur lors de la création dans PocketBase." };
    }

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
      body: formData 
    });
    if (!res.ok) return { error: "Erreur création PB" };
    revalidatePath('/');
    return { success: true, message: "Projet publié !" };
  } catch (error) { return { error: "Erreur serveur." }; }
}

export async function addPlayerAction(prevState: any, formData: FormData) {
  if (formData.get("admin_secret") !== process.env.ADMIN_SECRET) return { error: "Mot de passe incorrect." };
  formData.delete("admin_secret");

  const data = Object.fromEntries(formData);
  
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