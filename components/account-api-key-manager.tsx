"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type Token = { id: string; token_prefix: string; scopes: string[]; revoked_at: string | null; created_at: string };

export default function AccountApiKeyManager({ initialTokens }: { initialTokens: Token[] }) {
  const [tokens, setTokens] = useState(initialTokens);
  const [newToken, setNewToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function createToken() {
    if (loading) return;
    setLoading(true); setError(""); setNewToken("");
    try {
      const response = await fetch("/api/account/integration/tokens", { method: "POST" });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "No se pudo crear la clave API."); return; }
      setNewToken(data.token); setTokens(current => [data.tokenRecord, ...current]);
    } catch { setError("No pudimos conectar. Intenta nuevamente."); } finally { setLoading(false); }
  }

  async function revokeToken(id: string) {
    if (revoking || !window.confirm("¿Revocar esta clave API? Las aplicaciones que la usen dejarán de funcionar.")) return;
    setRevoking(id); setError("");
    try {
      const response = await fetch(`/api/account/integration/tokens/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "No se pudo revocar la clave API."); return; }
      setTokens(current => current.map(token => token.id === id ? { ...token, revoked_at: data.revokedAt } : token));
    } catch { setError("No pudimos conectar. Intenta nuevamente."); } finally { setRevoking(null); }
  }

  async function copyToken() {
    await navigator.clipboard.writeText(newToken); setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  }

  return <div className="rounded-3xl border border-slate-200 bg-white p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="sans text-xs font-bold uppercase tracking-[.14em] text-[#6d4aff]">Seguridad</p><h2 className="mt-2 text-2xl font-bold">Claves API</h2></div><button type="button" onClick={createToken} disabled={loading} className="rounded-xl bg-[#6d4aff] px-4 py-3 sans text-sm font-bold text-white disabled:opacity-50">{loading ? "Creando..." : "Crear nueva clave"}</button></div>
    <p className="mt-2 sans text-sm leading-6 text-slate-500">Crea una clave por aplicación y revócala cuando deje de ser necesaria.</p>
    {newToken && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="sans text-sm font-bold text-amber-900">Guarda esta clave ahora; no volverá a mostrarse.</p><div className="mt-3 flex gap-2"><code className="min-w-0 flex-1 overflow-x-auto rounded-xl bg-white p-3 text-xs text-slate-800">{newToken}</code><button type="button" onClick={copyToken} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-amber-800" aria-label="Copiar clave">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button></div></div>}
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 sans text-sm text-red-700">{error}</p>}
    <div className="mt-5 divide-y divide-slate-100">{tokens.map(token => <div key={token.id} className="flex flex-wrap items-center justify-between gap-3 py-3 sans text-sm"><div><code className="font-bold">{token.token_prefix}…</code><p className="mt-1 text-xs text-slate-500">Creada el {new Date(token.created_at).toLocaleDateString("es-CO")} · {token.scopes.join(", ")}</p></div>{token.revoked_at ? <span className="font-bold text-red-600">Revocada</span> : <button type="button" onClick={() => revokeToken(token.id)} disabled={revoking === token.id} className="rounded-lg border border-red-200 px-3 py-1 text-xs font-bold text-red-600 disabled:opacity-50">{revoking === token.id ? "Revocando..." : "Revocar"}</button>}</div>)}{!tokens.length && <p className="py-4 sans text-sm text-slate-500">No hay claves registradas.</p>}</div>
  </div>;
}
