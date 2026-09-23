// src/lib/actions.ts
"use server"

import { revalidatePath } from "next/cache";
import { pbFetch } from "@/src/lib/pocketbase";

export async function createWriteupAction(prevState: unknown, formData: FormData) {
  const secret = formData.get("admin_secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return { error: "Mot de passe administrateur incorrect." };
  }

  formData.delete("admin_secret");

  const isSolved = formData.get("solved");
  formData.set("solved", isSolved === "on" ? "true" : "false");

  try {
    await pbFetch(`/api/collections/pf_writeups/records`, {
      method: 'POST',
      body: formData
    }, { admin: true });

    revalidatePath('/blog');

    return { success: true, message: "Write-up publié avec succès !" };

  } catch (error) {
    console.error(error);
    return { error: "Erreur lors de la création dans PocketBase." };
  }
}


export async function createProjectAction(prevState: unknown, formData: FormData) {
  if (formData.get("admin_secret") !== process.env.ADMIN_SECRET) return { error: "Mot de passe incorrect." };
  formData.delete("admin_secret");

  try {
    await pbFetch(`/api/collections/pf_projects/records`, {
      method: 'POST',
      body: formData
    }, { admin: true });
    revalidatePath('/');
    return { success: true, message: "Projet publié !" };
  } catch (error) {
    console.error(error);
    return { error: "Erreur création PB" };
  }
}

export async function addPlayerAction(prevState: unknown, formData: FormData) {
  if (formData.get("admin_secret") !== process.env.ADMIN_SECRET) return { error: "Mot de passe incorrect." };
  formData.delete("admin_secret");

  const data = Object.fromEntries(formData);

  if (!data.numeric_id || data.numeric_id === "") {
    delete data.numeric_id;
  }

  try {
    await pbFetch(`/api/collections/pf_players/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, { admin: true });

    revalidatePath('/dashboard');
    return { success: true, message: "Joueur ajouté au Leaderboard !" };
  } catch (error) {
    console.error(error);
    return { error: "Erreur création PB" };
  }
}
