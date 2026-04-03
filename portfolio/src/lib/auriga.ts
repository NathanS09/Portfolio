// src/lib/auriga.ts
"use server"

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface Course {
  id: string;
  title: string;
  room: string;
  dateStr: string;
  startTime: string;
  endTime: string;
  professor: string;
  type: string;
  rawDate: number;
}

const CACHE_FILE = path.join(os.tmpdir(), 'auriga-cache.json');

// État en mémoire (pour éviter de spammer PocketBase à chaque requête)
let currentAccessToken: string | null = null;
let tokenExpirationTime: number = 0;
let currentRefreshToken: string | null = null;

// ==========================================
// OUTILS POCKETBASE
// ==========================================

async function getPbAdminToken(): Promise<string> {
  // ✅ On ajoute PB_INTERNAL_URL en priorité
  const pbUrl = process.env.PB_INTERNAL_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';
  
  const authRes = await fetch(`${pbUrl}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      identity: process.env.PB_ADMIN_EMAIL, 
      password: process.env.PB_ADMIN_PASSWORD 
    }),
    cache: 'no-store'
  });
  
  if (!authRes.ok) throw new Error("Identifiants Admin PocketBase invalides. in Auriga");
  const authData = await authRes.json();
  return authData.token;
}

/**
 * SERVER ACTION : Met à jour le token en mémoire ET dans la base de données PocketBase
 */
export async function updateAurigaTokenManually(newToken: string) {
  currentRefreshToken = newToken;
  currentAccessToken = null; // Force le rafraîchissement immédiat de l'Access Token
  tokenExpirationTime = 0;

  try {
    const pbUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';
    const adminToken = await getPbAdminToken();

    // 1. Chercher si la clé existe déjà dans PocketBase
    const recordRes = await fetch(`${pbUrl}/api/collections/srsi_settings/records?filter=(key='auriga_refresh_token')`, {
      headers: { 'Authorization': adminToken },
      cache: 'no-store'
    });
    const recordData = await recordRes.json();

    if (recordData.items && recordData.items.length > 0) {
      // 2a. Mise à jour (PATCH)
      const recordId = recordData.items[0].id;
      await fetch(`${pbUrl}/api/collections/srsi_settings/records/${recordId}`, {
        method: 'PATCH',
        headers: { 'Authorization': adminToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newToken })
      });
    } else {
      // 2b. Création initiale (POST)
      await fetch(`${pbUrl}/api/collections/srsi_settings/records`, {
        method: 'POST',
        headers: { 'Authorization': adminToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'auriga_refresh_token', value: newToken })
      });
    }
  } catch (e) {
    console.error("Erreur lors de la sauvegarde du token dans PocketBase", e);
  }

  return { success: true };
}

// ==========================================
// GESTION AURIGA
// ==========================================

async function getValidAccessToken(): Promise<string> {
  const pbUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';

  // 1. Si on n'a pas de token en mémoire, on va le chercher dans PocketBase
  if (!currentRefreshToken) {
    try {
      const adminToken = await getPbAdminToken();
      const recordRes = await fetch(`${pbUrl}/api/collections/srsi_settings/records?filter=(key='auriga_refresh_token')`, {
        headers: { 'Authorization': adminToken },
        cache: 'no-store'
      });
      const recordData = await recordRes.json();
      
      if (recordData.items && recordData.items.length > 0) {
        currentRefreshToken = recordData.items[0].value;
      }
    } catch (e) {
      console.error("Impossible de lire PocketBase:", e);
    }
  }

  if (!currentRefreshToken) throw new Error("Aucun Refresh Token trouvé dans PocketBase.");

  // 2. Si l'Access Token actuel est encore valide, on l'utilise
  if (currentAccessToken && Date.now() < tokenExpirationTime - 5000) {
    return currentAccessToken;
  }

  // 3. Sinon, on demande un nouvel Access Token à EPITA
  const TOKEN_URL = 'https://ionisepita-auth.np-auriga.nfrance.net/auth/realms/npionisepita/protocol/openid-connect/token';
  const body = new URLSearchParams({
    client_id: 'np-front',
    grant_type: 'refresh_token',
    refresh_token: currentRefreshToken
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    cache: 'no-store'
  });

  if (!res.ok) {
    currentRefreshToken = null; // On vide la mémoire pour forcer une re-lecture DB la prochaine fois
    throw new Error("Refresh token expiré ou rejeté par Auriga.");
  }

  const data = await res.json();
  currentAccessToken = data.access_token;
  tokenExpirationTime = Date.now() + (data.expires_in * 1000);
  
  // 4. AUTO-UPDATE : Si EPITA nous donne un NOUVEAU refresh_token, on l'enregistre dans PocketBase !
  if (data.refresh_token && data.refresh_token !== currentRefreshToken) {
    await updateAurigaTokenManually(data.refresh_token);
  }

  return currentAccessToken!;
}

// SCRIPT DE CACHE EN ARRIÈRE-PLAN (6 MOIS)
async function fetch6MonthsAndCache(validToken: string) {
  try {
    const today = new Date();
    const future = new Date();
    future.setMonth(today.getMonth() + 6); // + 6 mois

    const start = today.toISOString().split('T')[0];
    const end = future.toISOString().split('T')[0];

    const res = await fetch(`https://auriga.epita.fr/api/plannings/me?days=1&days=2&days=3&days=4&days=5&startDate=${start}&endDate=${end}`, {
      headers: { Authorization: `Bearer ${validToken}`, 'Accept': 'application/json' }
    });
    
    if (!res.ok) return;
    
    const data = await res.json();
    const interventions = data.interventions || [];
    
    const courses: Course[] = interventions.map((item: any) => {
      const startDt = new Date(item.startDateTime);
      const endDt = new Date(item.endDateTime);
      return {
        id: item.id.toString(),
        title: item.interventionPedagogicalUnits?.[0]?.pedagogicalUnit?.caption?.fr || "Cours inconnu",
        room: item.interventionResources?.[0]?.resource?.caption?.fr || "Salle inconnue",
        type: item.activityType?.code || "CM",
        dateStr: startDt.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'Europe/Paris' }),
        startTime: startDt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
        endTime: endDt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
        professor: `${item.interventionInstructors?.[0]?.person?.currentFirstName || ""} ${item.interventionInstructors?.[0]?.person?.currentLastName || ""}`.trim() || "Prof. Inconnu",
        rawDate: startDt.getTime()
      };
    });

    await fs.writeFile(CACHE_FILE, JSON.stringify(courses), 'utf-8');
  } catch (e) {
    console.error("Erreur du Super-Cache en arrière plan", e);
  }
}

// LA FONCTION PRINCIPALE MODIFIÉE
export async function getAurigaSchedule(weekOffset: number = 0): Promise<{ courses: Course[], isCached: boolean }> {
  const today = new Date();
  const dayOfWeek = today.getDay() || 7; 
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1 + (weekOffset * 7));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const startDateStr = monday.toISOString().split('T')[0];
  const endDateStr = friday.toISOString().split('T')[0];

  try {
    const validToken = await getValidAccessToken();

    // On lance la mise en cache de 6 mois en tâche de fond (sans 'await' pour ne pas ralentir le chargement !)
    if (weekOffset === 0) {
      fetch6MonthsAndCache(validToken).catch(() => {});
    }

    const res = await fetch(`https://auriga.epita.fr/api/plannings/me?days=1&days=2&days=3&days=4&days=5&startDate=${startDateStr}&endDate=${endDateStr}`, {
      headers: { Authorization: `Bearer ${validToken}`, 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`Auriga API Error`);

    const data = await res.json();
    const interventions = data.interventions || [];

    // ... (Garde ton `.map` exact actuel pour transformer les interventions en `Course[]`)
    const courses: Course[] = interventions.map((item: any) => {
      const startDt = new Date(item.startDateTime);
      const endDt = new Date(item.endDateTime);
      return {
        id: item.id.toString(),
        title: item.interventionPedagogicalUnits?.[0]?.pedagogicalUnit?.caption?.fr || "Cours inconnu",
        room: item.interventionResources?.[0]?.resource?.caption?.fr || "Salle inconnue",
        type: item.activityType?.code || "CM",
        dateStr: startDt.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'Europe/Paris' }),
        startTime: startDt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
        endTime: endDt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
        professor: `${item.interventionInstructors?.[0]?.person?.currentFirstName || ""} ${item.interventionInstructors?.[0]?.person?.currentLastName || ""}`.trim() || "Prof. Inconnu",
        rawDate: startDt.getTime()
      };
    });

    return { courses: courses.sort((a, b) => a.rawDate - b.rawDate), isCached: false };

  } catch (error) {
    // MODE HORS-LIGNE : On va lire le Super-Cache de 6 mois, et on le filtre pour la semaine demandée !
    try {
      const cachedData = await fs.readFile(CACHE_FILE, 'utf-8');
      const allCourses = JSON.parse(cachedData) as Course[];
      
      const startTimestamp = monday.getTime();
      const endTimestamp = friday.getTime() + (24 * 60 * 60 * 1000); // Vendredi soir

      const weekCourses = allCourses.filter(c => c.rawDate >= startTimestamp && c.rawDate <= endTimestamp);
      return { courses: weekCourses.sort((a, b) => a.rawDate - b.rawDate), isCached: true }; 
    } catch (cacheError) {
      return { courses: [], isCached: false };
    }
  }
}