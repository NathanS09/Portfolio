// src/lib/pocketbase.ts
import "server-only";

// Toujours l'URL interne (réseau Docker) côté serveur : jamais NEXT_PUBLIC_PB_URL,
// qui ferait transiter les identifiants superuser par l'URL publique.
export const PB_URL = process.env.PB_INTERNAL_URL || "http://127.0.0.1:8090";

const TOKEN_EXP_MARGIN_MS = 5 * 60 * 1000;

let cachedToken: { token: string; expiresAt: number } | null = null;
let authInFlight: Promise<string> | null = null;

function decodeJwtExpiry(token: string): number {
  const payload = token.split(".")[1];
  const json = Buffer.from(payload, "base64url").toString("utf-8");
  const { exp } = JSON.parse(json) as { exp: number };
  return exp * 1000;
}

async function authenticateAdmin(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: process.env.PB_ADMIN_EMAIL,
      password: process.env.PB_ADMIN_PASSWORD,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Authentification PocketBase échouée.");
  }

  const data = await res.json();
  const token: string = data.token;
  cachedToken = { token, expiresAt: decodeJwtExpiry(token) };
  return token;
}

// Cache mémoire + single-flight : les appels concurrents partagent la même
// authentification tant qu'un token valide n'est pas disponible.
export async function getPbAdminToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - TOKEN_EXP_MARGIN_MS) {
    return cachedToken.token;
  }

  if (!authInFlight) {
    authInFlight = authenticateAdmin().finally(() => {
      authInFlight = null;
    });
  }

  return authInFlight;
}

export async function pbFetch(
  path: string,
  init: RequestInit = {},
  { admin = false }: { admin?: boolean } = {}
): Promise<Response> {
  const headers = new Headers(init.headers);

  if (admin) {
    const token = await getPbAdminToken();
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${PB_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    // On ne renvoie jamais le corps de la réponse PocketBase à l'appelant :
    // il peut contenir des détails sur le schéma ou les données internes.
    throw new Error(`Erreur PocketBase (${res.status})`);
  }

  return res;
}
