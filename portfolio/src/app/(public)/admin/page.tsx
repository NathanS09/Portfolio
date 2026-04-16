"use client"

import { useState, useActionState } from "react"
import { createWriteupAction, createProjectAction, addPlayerAction, updateTokenAction } from "@/src/lib/actions"
import { Button } from "@/components/ui/button"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'writeup' | 'project' | 'player' | 'token'>('writeup')

  const [wState, wAction, wPending] = useActionState(createWriteupAction, null)
  const [pState, pAction, pPending] = useActionState(createProjectAction, null)
  const [lState, lAction, lPending] = useActionState(addPlayerAction, null)
  const [tState, tAction, tPending] = useActionState(updateTokenAction, null)

  const SecretInput = () => (
    <div className="space-y-2 bg-destructive/5 p-4 rounded-lg border border-destructive/20 mt-6">
      <label className="text-sm font-bold text-destructive">Clé d'autorisation (Secret)</label>
      <input required type="password" name="admin_secret" className="w-full bg-background border border-destructive/30 rounded-md px-3 py-2 text-sm" placeholder="Mot de passe requis" />
    </div>
  )

  const StatusMessage = ({ state }: { state: any }) => (
    <>
      {state?.error && <div className="p-3 mb-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded text-sm font-mono">[ERREUR] {state.error}</div>}
      {state?.success && <div className="p-3 mb-4 bg-green-500/10 border border-green-500/50 text-green-500 rounded text-sm font-mono">[SUCCÈS] {state.message}</div>}
    </>
  )

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-8 border-b border-border/40 pb-4">
        <h1 className="text-3xl font-bold text-primary">Back-Office SRSI</h1>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {['writeup', 'project', 'player', 'token'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === 'writeup' && (
        <form action={wAction} className="space-y-4 bg-card p-6 rounded-xl border border-border/50">
          <StatusMessage state={wState} />
          {/* ... (Remets ici exactement les inputs de ton formulaire Write-up précédent) ... */}
          <div className="grid grid-cols-2 gap-4">
            <input required type="text" name="title" placeholder="Titre" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <input required type="text" name="slug" placeholder="Slug" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <input required type="text" name="platform" placeholder="Plateforme" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <select name="difficulty" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option><option value="insane">Insane</option></select>
            <input required type="date" name="date" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <textarea required name="description" placeholder="Description" rows={2} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          <input required type="text" name="tags" placeholder="Tags (séparés par des virgules)" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          <input required type="file" name="content_file" accept=".md,.mdx,.txt" className="w-full text-sm" />
          <SecretInput />
          <Button type="submit" className="w-full font-bold" disabled={wPending}>{wPending ? "Envoi..." : "Publier"}</Button>
        </form>
      )}

      {activeTab === 'project' && (
        <form action={pAction} className="space-y-4 bg-card p-6 rounded-xl border border-border/50">
          <StatusMessage state={pState} />
          <input required type="text" name="title" placeholder="Titre du projet" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          <textarea required name="description" placeholder="Description du projet" rows={3} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          <input required type="url" name="github_url" placeholder="URL GitHub" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          <div className="space-y-2">
            <label className="text-sm font-bold block">Image du projet</label>
            <input required type="file" name="image" accept="image/*" className="w-full text-sm" />
          </div>
          <SecretInput />
          <Button type="submit" className="w-full font-bold" disabled={pPending}>{pPending ? "Envoi..." : "Ajouter Projet"}</Button>
        </form>
      )}

      {activeTab === 'player' && (
        <form action={lAction} className="space-y-4 bg-card p-6 rounded-xl border border-border/50">
          <StatusMessage state={lState} />
          <div className="grid grid-cols-2 gap-4">
            <input required type="text" name="pseudo" placeholder="Pseudo du Joueur" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <select name="platform" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
              <option value="rootme">Root-Me</option>
              <option value="fcsc">FCSC</option>
            </select>
          </div>
          <input required type="text" name="account_id" placeholder="Login Root-Me (ex: nathan.sanchez) OU ID FCSC (ex: 234)" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          <SecretInput />
          <Button type="submit" className="w-full font-bold" disabled={lPending}>{lPending ? "Envoi..." : "Ajouter au Leaderboard"}</Button>
        </form>
      )}

      {activeTab === 'token' && (
        <form action={tAction} className="space-y-4 bg-card p-6 rounded-xl border border-border/50">
          <StatusMessage state={tState} />
          <div className="space-y-2">
            <label className="text-sm font-bold block">Nouveau Token EduSign (Bearer)</label>
            <textarea required name="token" rows={4} placeholder="Colle le token EduSign ici..." className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono" />
          </div>
          <SecretInput />
          <Button type="submit" className="w-full font-bold" disabled={tPending}>{tPending ? "Envoi..." : "Mettre à jour le Token"}</Button>
        </form>
      )}
    </div>
  )
}