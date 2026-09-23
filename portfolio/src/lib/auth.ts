// src/lib/auth.ts
import "server-only";

import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from "@/src/lib/session";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

// Rate limit en mémoire (process unique) : suffisant vu l'échelle du service.
const failedAttempts = new Map<string, { count: number; windowStart: number }>();

interface HeaderReader {
  get(name: string): string | null;
}

export function getClientIp(headersList: HeaderReader): string {
  const forwarded = headersList.get("x-forwarded-for");
  if (!forwarded) return "unknown";
  const hops = forwarded.split(",").map((h) => h.trim()).filter(Boolean);
  // Nginx est le seul reverse proxy devant l'app et ajoute l'IP du client
  // à la FIN de X-Forwarded-For. On prend donc la dernière valeur : la
  // première est fournie par le client lui-même et donc falsifiable.
  return hops[hops.length - 1] || "unknown";
}

export function isRateLimited(ip: string): boolean {
  const entry = failedAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    failedAttempts.delete(ip);
    return false;
  }
  return entry.count >= RATE_LIMIT_MAX_ATTEMPTS;
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    failedAttempts.set(ip, { count: 1, windowStart: now });
  } else {
    entry.count += 1;
  }
}

export function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

// Comparaison en temps constant : on hash les deux valeurs en SHA-256 pour
// obtenir des buffers de longueur fixe avant timingSafeEqual (qui lève une
// exception si les tailles diffèrent, ce qui annulerait la protection).
export function timingSafeCompare(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export async function createSession(): Promise<void> {
  const token = await createSessionToken();
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export async function hasValidSession(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value);
}

// À appeler en tout début de chaque Server Action sensible : le middleware
// protège la navigation mais pas les Server Actions, qui restent des
// endpoints HTTP directement appelables.
export async function requireSession(): Promise<void> {
  if (!process.env.SESSION_SECRET || !process.env.ADMIN_SECRET) {
    redirect("/login");
  }
  if (!(await hasValidSession())) {
    redirect("/login");
  }
}
