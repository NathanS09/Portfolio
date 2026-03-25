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

// Emplacement du fichier de cache (dossier temporaire du serveur)
const CACHE_FILE = path.join(os.tmpdir(), 'auriga-cache.json');

// État en mémoire
let currentAccessToken: string | null = null;
let tokenExpirationTime: number = 0;
let currentRefreshToken: string | null = null;

/**
 * SERVER ACTION : Permet de mettre à jour le token à chaud depuis l'interface
 */
export async function updateAurigaTokenManually(newToken: string) {
  currentRefreshToken = newToken;
  currentAccessToken = null; // Force le rafraîchissement immédiat
  tokenExpirationTime = 0;
  return { success: true };
}

async function getValidAccessToken(): Promise<string> {
  if (!currentRefreshToken) {
    currentRefreshToken = process.env.AURIGA_REFRESH_TOKEN || null;
  }
  if (!currentRefreshToken) throw new Error("Token manquant");

  if (currentAccessToken && Date.now() < tokenExpirationTime - 5000) {
    return currentAccessToken;
  }

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

  if (!res.ok) throw new Error("Refresh token expiré.");

  const data = await res.json();
  currentAccessToken = data.access_token;
  tokenExpirationTime = Date.now() + (data.expires_in * 1000);
  
  if (data.refresh_token) {
    currentRefreshToken = data.refresh_token; 
  }

  return currentAccessToken!;
}

export async function getAurigaSchedule(weekOffset: number = 0): Promise<{ courses: Course[], isCached: boolean }> {
  try {
    const validToken = await getValidAccessToken();

    const today = new Date();
    const dayOfWeek = today.getDay() || 7; 
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1 + (weekOffset * 7));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const startDate = monday.toISOString().split('T')[0];
    const endDate = friday.toISOString().split('T')[0];

    const res = await fetch(`https://auriga.epita.fr/api/plannings/me?days=1&days=2&days=3&days=4&days=5&startDate=${startDate}&endDate=${endDate}`, {
      headers: { Authorization: `Bearer ${validToken}`, 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`Auriga API Error: ${res.status}`);

    const data = await res.json();
    const interventions = data.interventions || [];

    const courses: Course[] = interventions.map((item: any) => {
      const startDt = new Date(item.startDateTime);
      const endDt = new Date(item.endDateTime);
      const title = item.interventionPedagogicalUnits?.[0]?.pedagogicalUnit?.caption?.fr || "Cours inconnu";
      const room = item.interventionResources?.[0]?.resource?.caption?.fr || "Salle inconnue";
      const profFirst = item.interventionInstructors?.[0]?.person?.currentFirstName || "";
      const profLast = item.interventionInstructors?.[0]?.person?.currentLastName || "";
      const type = item.activityType?.code || "CM";

      return {
        id: item.id.toString(),
        title, room, type,
        dateStr: startDt.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'Europe/Paris' }),
        startTime: startDt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
        endTime: endDt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
        professor: `${profFirst} ${profLast}`.trim() || "Prof. Inconnu",
        rawDate: startDt.getTime()
      };
    });

    const sortedCourses = courses.sort((a, b) => a.rawDate - b.rawDate);

    // SAUVEGARDE DU CACHE : On écrit les données fraîches dans le fichier
    // On ne met en cache que la semaine en cours (offset === 0)
    if (weekOffset === 0 && sortedCourses.length > 0) {
      await fs.writeFile(CACHE_FILE, JSON.stringify(sortedCourses), 'utf-8').catch(console.error);
    }

    return { courses: sortedCourses, isCached: false };

  } catch (error) {
    console.error("Échec API Auriga, tentative de lecture du cache...", error);
    
    // FALLBACK : Lecture du fichier de secours si l'API a planté
    try {
      const cachedData = await fs.readFile(CACHE_FILE, 'utf-8');
      const courses = JSON.parse(cachedData) as Course[];
      // On prévient le frontend que ces données datent un peu
      return { courses, isCached: true }; 
    } catch (cacheError) {
      console.error("Aucun cache disponible.");
      return { courses: [], isCached: false };
    }
  }
}