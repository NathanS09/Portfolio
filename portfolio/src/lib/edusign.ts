// src/lib/edusign.ts
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
  isPresent: boolean; // NOUVEAU : Statut de signature
}

const CACHE_FILE = path.join(os.tmpdir(), 'edusign-cache.json');

// ==========================================
// OUTILS POCKETBASE
// ==========================================

async function getPbAdminToken(): Promise<string> {
  const pbUrl = process.env.PB_INTERNAL_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';
  console.log("creds:   ", process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
  const authRes = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      identity: process.env.PB_ADMIN_EMAIL, 
      password: process.env.PB_ADMIN_PASSWORD 
    }),
    cache: 'no-store'
  });
  if (!authRes.ok) throw new Error("Identifiants Admin PB invalides.");
  const authData = await authRes.json();
  return authData.token;
}

export async function updateEdusignTokenManually(newToken: string) {
  try {
    const pbUrl = process.env.PB_INTERNAL_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';
    const adminToken = await getPbAdminToken();

    const recordRes = await fetch(`${pbUrl}/api/collections/srsi_settings/records?filter=(key='edusign_token')`, {
      headers: { 'Authorization': adminToken },
      cache: 'no-store'
    });
    const recordData = await recordRes.json();

    if (recordData.items && recordData.items.length > 0) {
      await fetch(`${pbUrl}/api/collections/srsi_settings/records/${recordData.items[0].id}`, {
        method: 'PATCH',
        headers: { 'Authorization': adminToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newToken })
      });
    } else {
      await fetch(`${pbUrl}/api/collections/srsi_settings/records`, {
        method: 'POST',
        headers: { 'Authorization': adminToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'edusign_token', value: newToken })
      });
    }
  } catch (e) { console.error("Erreur sauvegarde token EduSign:", e); }
  return { success: true };
}

// ==========================================
// GESTION EDUSIGN
// ==========================================

async function getEdusignToken(): Promise<string> {
  const pbUrl = process.env.PB_INTERNAL_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';
  const adminToken = await getPbAdminToken();
  const recordRes = await fetch(`${pbUrl}/api/collections/pf_settings/records?filter=(key='edusign_token')`, {
    headers: { 'Authorization': adminToken },
    cache: 'no-store'
  });
  const recordData = await recordRes.json();
  if (recordData.items && recordData.items.length > 0) return recordData.items[0].value;
  throw new Error("Token EduSign introuvable.");
}

export async function getEdusignSchedule(weekOffset: number = 0): Promise<{ courses: Course[], isCached: boolean }> {
  const today = new Date();
  const dayOfWeek = today.getDay() || 7; 
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1 + (weekOffset * 7));
  monday.setHours(0, 0, 0, 0);
  
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  try {
    let token = await getEdusignToken();
    
    // 🛠️ CORRECTIF 1 : On nettoie le token au cas où tu as collé "Bearer " avec !
    token = token.replace(/^Bearer\s+/i, '').trim();

    const startIso = monday.toISOString();
    const endIso = friday.toISOString();
    
    console.log(`[EduSign] Requête pour la semaine du ${startIso} au ${endIso}`);

    const res = await fetch(`https://api.edusign.fr/student/planning?start=${startIso}&end=${endIso}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      // 🛠️ CORRECTIF 2 : On capture la vraie raison du refus d'EduSign
      const errorText = await res.text();
      throw new Error(`Erreur API EduSign (HTTP ${res.status}): ${errorText}`);
    }
    
    const data = await res.json();
    const items = data.result || [];
    
    console.log(`[EduSign] Succès ! ${items.length} cours trouvés.`);

    const courses: Course[] = items.map((item: any) => {
      const startDt = new Date(item.START);
      const endDt = new Date(item.END);

      let type = "COURS";
      let title = item.NAME || "Cours inconnu";
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        const rawType = parts[0].toLowerCase();
        if (rawType.includes('pratiques')) type = 'TP';
        else if (rawType.includes('dirigés')) type = 'TD';
        else if (rawType.includes('magistraux')) type = 'CM';
        else if (rawType.includes('examen')) type = 'EXAM';
        else if (rawType.includes('forum') || rawType.includes('conférence')) type = 'CONF';
        title = parts.slice(1).join(' - ');
      }

      return {
        id: item.ID,
        title,
        room: item.CLASSROOM || "À définir",
        type,
        dateStr: startDt.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'Europe/Paris' }),
        startTime: startDt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
        endTime: endDt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
        professor: "Intervenant",
        rawDate: startDt.getTime(),
        isPresent: item.STUDENT_PRESENCE === true
      };
    });

    const sortedCourses = courses.sort((a, b) => a.rawDate - b.rawDate);
    if (weekOffset === 0 && sortedCourses.length > 0) {
      await fs.writeFile(CACHE_FILE, JSON.stringify(sortedCourses), 'utf-8').catch(console.error);
    }
    return { courses: sortedCourses, isCached: false };

  } catch (error) {
    // 🛠️ CORRECTIF 3 : On affiche l'erreur dans les logs Docker de ton VPS !
    console.error("[EduSign] ERREUR CRITIQUE :", error);
    
    try {
      const cachedData = await fs.readFile(CACHE_FILE, 'utf-8');
      const allCourses = JSON.parse(cachedData) as Course[];
      const startTimestamp = monday.getTime();
      const endTimestamp = friday.getTime();
      const weekCourses = allCourses.filter(c => c.rawDate >= startTimestamp && c.rawDate <= endTimestamp);
      return { courses: weekCourses.sort((a, b) => a.rawDate - b.rawDate), isCached: true }; 
    } catch (cacheError) {
      return { courses: [], isCached: false };
    }
  }
}