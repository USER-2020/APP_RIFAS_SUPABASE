"use client";
import { useState } from "react";
import LoadingButton from "@/components/loading-button";

type Token = { id: string; token_prefix: string; scopes: string[]; expires_at: string | null; revoked_at: string | null; last_used_at: string | null; created_at: string };
type Integration = { id: string; name: string; provider_key: string; active: boolean; created_at: string; api_consumers: { name: string; email: string } | null; organizations: { name: string } | null; integration_tokens: Token[] };

export default function IntegrationManager({ initialIntegrations }: { initialIntegrations: Integration[] }) {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [createdToken, setCreatedToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (loading) return; setLoading(true); setError(""); setCreatedToken("");
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      const response = await fetch("/api/admin/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json();
      if (!response.ok) { setError(result.error ?? "No se pudo crear la integración."); return; }
      setCreatedToken(result.token);
      setIntegrations((current) => [{ id: result.integrationId, name: String(values.name), provider_key: result.providerKey, active: true, created_at: new Date().toISOString(), api_consumers: { name: String(values.consumerName), email: String(values.consumerEmail) }, organizations: { name: String(values.organizationName) }, integration_tokens: [{ id: "new", token_prefix: result.token.slice(0, 18), scopes: ["raffles:read", "raffles:write"], expires_at: null, revoked_at: null, last_used_at: null, created_at: new Date().toISOString() }] }, ...current]);
      event.currentTarget.reset();
    } catch { setError("No pudimos conectar. Intenta nuevamente."); } finally { setLoading(false); }
  }
  async function revoke(id: string) {
    if (loading || !window.confirm("¿Revocar todos los tokens de esta integración?")) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/integrations/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) { setError(result.error ?? "No se pudo revocar la integración."); return; }
      setIntegrations((current) => current.map((item) => item.id === id ? { ...item, active: false, integration_tokens: item.integration_tokens.map((token) => ({ ...token, revoked_at: new Date().toISOString() })) } : item));
    } catch { setError("No pudimos conectar. Intenta nuevamente."); } finally { setLoading(false); }
  }
  return <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
    <form onSubmit={create} className="h-fit rounded-3xl border border-slate-200 bg-white p-6 md:p-7"><h3 className="text-2xl font-bold tracking-[-.05em]">Nuevo usuario API</h3><p className="mt-2 sans text-sm leading-6 text-slate-500">Registra al usuario o plataforma que consumirá la API y genera su token.</p><div className="mt-6 space-y-4 sans text-sm"><Field name="consumerName" label="Nombre del usuario o empresa" placeholder="REM Experience" /><Field name="consumerEmail" label="Correo técnico" placeholder="dev@remexperience.com" type="email" /><Field name="name" label="Nombre de la integración" placeholder="REM Rifas" /><Field name="providerKey" label="Identificador" placeholder="rem-experience" /><Field name="organizationName" label="Organización de sus rifas" placeholder="REM Experience" /><Field name="organizationSlug" label="Slug de la organización" placeholder="rem-experience" /></div>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<LoadingButton loading={loading} disabled={loading} className="mt-6 w-full rounded-xl bg-[#6d4aff] px-4 py-3 text-sm font-bold text-white">Crear usuario y token</LoadingButton></form>
    <div className="space-y-4">{createdToken && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sans"><p className="text-sm font-bold text-amber-900">Copia este token ahora</p><p className="mt-1 text-xs text-amber-800">Por seguridad no volveremos a mostrarlo completo.</p><code className="mt-3 block overflow-x-auto rounded-xl bg-white p-3 text-xs text-slate-800">{createdToken}</code></div>}{integrations.length ? integrations.map((integration) => <article key={integration.id} className="rounded-3xl border border-slate-200 bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-bold">{integration.api_consumers?.name ?? integration.name}</h3><p className="mt-1 sans text-sm text-slate-500">{integration.api_consumers?.email ?? "Sin correo"} · {integration.organizations?.name} · <code>{integration.provider_key}</code></p></div><div className="flex items-center gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 sans text-xs font-bold text-emerald-700">{integration.active ? "Activa" : "Inactiva"}</span>{integration.active && <button type="button" onClick={() => revoke(integration.id)} className="rounded-lg border border-red-200 px-3 py-1 sans text-xs font-bold text-red-600">Revocar</button>}</div></div><div className="mt-5 divide-y divide-slate-100">{integration.integration_tokens.map((token) => <div key={token.id} className="flex flex-wrap items-center justify-between gap-3 py-3 sans text-sm"><div><code className="font-bold">{token.token_prefix}…</code><p className="mt-1 text-xs text-slate-500">Permisos: {token.scopes.join(", ")}</p></div><span className={token.revoked_at ? "text-red-600" : "text-slate-500"}>{token.revoked_at ? "Revocado" : "Disponible"}</span></div>)}</div></article>) : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center sans text-sm text-slate-500">Todavía no hay integraciones.</div>}</div>
  </div>;
}

function Field({ name, label, placeholder, type = "text" }: { name: string; label: string; placeholder: string; type?: string }) { return <label className="block font-bold">{label}<input name={name} type={type} required placeholder={placeholder} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-[#6d4aff]" /></label>; }
