// src/lib/auth-actions.ts
"use server"

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  timingSafeCompare,
  isRateLimited,
  recordFailedAttempt,
  clearFailedAttempts,
  createSession,
  destroySession,
  getClientIp,
} from "@/src/lib/auth";

export async function loginAction(prevState: unknown, formData: FormData) {
  if (!process.env.SESSION_SECRET || !process.env.ADMIN_SECRET) {
    return { error: "Authentification indisponible." };
  }

  const ip = getClientIp(await headers());

  if (isRateLimited(ip)) {
    return { error: "Trop de tentatives. Réessaie dans 15 minutes." };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || !timingSafeCompare(password, process.env.ADMIN_SECRET)) {
    recordFailedAttempt(ip);
    return { error: "Mot de passe incorrect." };
  }

  clearFailedAttempts(ip);
  await createSession();
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
