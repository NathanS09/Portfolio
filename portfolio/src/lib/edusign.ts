// src/lib/edusign.ts
import "server-only";

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { pbFetch } from '@/src/lib/pocketbase';

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
  isPresent: boolean;
}

interface EdusignPlanningItem {
  ID: string;
  NAME?: string;
  CLASSROOM?: string;
  START: string;
  END: string;
  STUDENT_PRESENCE?: boolean;
}

const CACHE_FILE = path.join(os.tmpdir(), 'edusign-cache.json');
const EDUSIGN_SETTINGS_FILTER = encodeURIComponent("key='edusign_token'");

// ==========================================
// OUTILS POCKETBASE (Accès Direct Table, en superuser)
// ==========================================

async function updateEdusignTokenManually(newToken: string) {
  try {
    const recordRes = await pbFetch(
      `/api/collections/pf_settings/records?filter=${EDUSIGN_SETTINGS_FILTER}`,
      { cache: 'no-store' },
      { admin: true }
    );
    const recordData = await recordRes.json();

    if (recordData.items && recordData.items.length > 0) {
      await pbFetch(`/api/collections/pf_settings/records/${recordData.items[0].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newToken })
      }, { admin: true });
    } else {
      await pbFetch(`/api/collections/pf_settings/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'edusign_token', value: newToken })
      }, { admin: true });
    }
  } catch (e) { console.error("Erreur sauvegarde token EduSign PB:", e); }
}

async function getEdusignToken(): Promise<string> {
  const recordRes = await pbFetch(
    `/api/collections/pf_settings/records?filter=${EDUSIGN_SETTINGS_FILTER}`,
    { cache: 'no-store' },
    { admin: true }
  );

  const recordData = await recordRes.json();
  if (recordData.items && recordData.items.length > 0) return recordData.items[0].value;
  return "";
}

// ==========================================
// LOGIN AUTOMATIQUE
// ==========================================

let loginInFlight: Promise<string> | null = null;

async function loginToEdusignOnce(): Promise<string> {
  const email = process.env.EDUSIGN_EMAIL;
  const password = process.env.EDUSIGN_PASSWORD;

  if (!email || !password) throw new Error("Identifiants EduSign manquants.");

  const res = await fetch('https://api.edusign.fr/student/account/getByCredentials', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ EMAIL: email, PASSWORD: password, LANGUAGE: "fr" }),
    cache: 'no-store'
  });

  if (!res.ok) throw new Error("Échec login EduSign");

  const data = await res.json();
  const newToken = data.result?.TOKEN;
  if (!newToken) throw new Error("Token absent de la réponse login");

  await updateEdusignTokenManually(newToken);
  return newToken;
}

// Single-flight : même si 30 requêtes voient un 401 simultanément, une seule
// requête de login part réellement vers EduSign.
async function loginToEdusign(): Promise<string> {
  if (!loginInFlight) {
    loginInFlight = loginToEdusignOnce().finally(() => {
      loginInFlight = null;
    });
  }
  return loginInFlight;
}

// ==========================================
// PLANNING (SÉCURISÉ CONTRE LA CONCURRENCE)
// ==========================================

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
    token = token.replace(/^Bearer\s+/i, '').trim();

    const startIso = monday.toISOString();
    const endIso = friday.toISOString();

    const requestPlanning = async (t: string) => {
      return fetch(`https://api.edusign.fr/student/planning?start=${startIso}&end=${endIso}`, {
        headers: {
          'Authorization': `Bearer ${t}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        cache: 'no-store'
      });
    };

    let res = await requestPlanning(token || "invalid");

    // 🛡️ GESTION DE LA CONCURRENCE (Mode Sniper)
    if (!token || res.status === 401 || res.status === 403) {

      // On attend un court instant aléatoire (100-500ms) pour désynchroniser les requêtes
      await new Promise(r => setTimeout(r, Math.random() * 400 + 100));

      // On vérifie si un autre utilisateur n'a pas déjà mis à jour le token
      const freshToken = await getEdusignToken();

      if (freshToken && freshToken !== token) {
        console.log("[EduSign] Token déjà mis à jour par un autre processus.");
        res = await requestPlanning(freshToken);
      } else {
        // Personne ne l'a fait, c'est à nous de login
        const generatedToken = await loginToEdusign();
        res = await requestPlanning(generatedToken);
      }
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const items: EdusignPlanningItem[] = data.result || [];

    const courses: Course[] = items.map((item) => {
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
    console.error("[EduSign] Erreur critique :", error);
    try {
      const cachedData = await fs.readFile(CACHE_FILE, 'utf-8');
      const allCourses = JSON.parse(cachedData) as Course[];
      const startTimestamp = monday.getTime();
      const endTimestamp = friday.getTime();
      const weekCourses = allCourses.filter(c => c.rawDate >= startTimestamp && c.rawDate <= endTimestamp);
      return { courses: weekCourses.sort((a, b) => a.rawDate - b.rawDate), isCached: true };
    } catch (e) { return { courses: [], isCached: false }; }
  }
}
