"use client"

import { useActionState } from "react"
import { loginAction } from "@/src/lib/auth-actions"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null)

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form action={formAction} className="w-full max-w-sm space-y-4 bg-card p-6 rounded-xl border border-border/50">
        <h1 className="text-xl font-bold text-primary">SRSI_HUB — Authentification</h1>

        {state?.error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded text-sm font-mono">
            [ERREUR] {state.error}
          </div>
        )}

        <input
          required
          type="password"
          name="password"
          autoFocus
          placeholder="Mot de passe"
          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
        />

        <Button type="submit" className="w-full font-bold" disabled={pending}>
          {pending ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
    </div>
  )
}
