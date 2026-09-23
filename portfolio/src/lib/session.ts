// src/lib/session.ts
// Utilise exclusivement Web Crypto (pas node:crypto) car ce module est
// partagé entre le middleware (runtime Edge) et les Server Actions (Node).

export const SESSION_COOKIE_NAME = "srsi_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET manquant.");

  const payloadBytes = new TextEncoder().encode(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS }));
  const key = await getHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, payloadBytes);

  return `${base64UrlEncode(payloadBytes)}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || !token) return false;

  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return false;

  try {
    const payloadBytes = base64UrlDecode(payloadB64);
    const signature = base64UrlDecode(sigB64);
    const key = await getHmacKey(secret);

    const valid = await crypto.subtle.verify("HMAC", key, signature as BufferSource, payloadBytes as BufferSource);
    if (!valid) return false;

    const { exp } = JSON.parse(new TextDecoder().decode(payloadBytes)) as { exp: number };
    return typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
}
