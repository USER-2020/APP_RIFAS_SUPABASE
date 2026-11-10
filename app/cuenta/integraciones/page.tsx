"use client";

import AccountApiKeyManager from "@/components/account-api-key-manager";
import Link from "@/components/loading-link";
import LoadingButton from "@/components/loading-button";
import OrganizerShell from "@/components/organizer-shell";
import { createClient } from "@/lib/supabase/browser";
import { ArrowRight, Code2, LogOut, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AccountToken = { id: string; token_prefix: string; scopes: string[]; revoked_at: string | null; created_at: string };
type AccountConsumer = { id: string; name: string; email: string; integrations: Array<{ id: string; name: string; integration_tokens: AccountToken[] }> };
type AccountRaffle = { id: string; title: string; slug: string; status: string; draw_at: string };
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function AccountIntegrationsPage() {
  const router = useRouter();
  const [consumer, setConsumer] = useState<AccountConsumer | null>(null);
  const [raffles, setRaffles] = useState<AccountRaffle[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");

  useEffect(() => {
    fetch("/api/account/integration").then(async response => {
      if (response.status === 401) { router.push("/cuenta/login"); return; }
      const data = await response.json(); setConsumer(data.consumer);
      if (data.consumer) { const raffleResponse = await fetch("/api/account/raffles"); if (raffleResponse.ok) setRaffles((await raffleResponse.json()).raffles ?? []); }
      setLoading(false);
    }).catch(() => { setError("No pudimos cargar tu cuenta."); setLoading(false); });
  }, [router]);

  async function createIntegration(event: React.FormEvent) {
    event.preventDefault(); setCreating(true); setError("");
    try {
      const response = await fetch("/api/account/integration", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: projectName, organizationName, organizationSlug }) });
      const data = await response.json();
      if (!response.ok) setError(data.error ?? "No se pudo crear la integración.");
      else { setToken(data.token); setConsumer({ id: "created", name: projectName, email: "", integrations: [{ id: "created", name: projectName, integration_tokens: [] }] }); setRaffles([]); }
    } catch { setError("No pudimos conectar. Intenta nuevamente."); } finally { setCreating(false); }
  }

  async function signOut() { await createClient().auth.signOut(); router.push("/"); }

  return <OrganizerShell><main className="min-h-screen bg-[#f6f7fb] px-5 py-8 md:px-8"><div className="mx-auto max-w-6xl"><header className="flex flex-wrap items-center justify-between gap-4"><Link href="/" className="flex items-center gap-2 text-xl font-black tracking-[-.06em]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#6d4aff] text-white">R</span>RIFLY</Link><button onClick={signOut} className="inline-flex items-center gap-2 sans text-sm font-bold text-slate-500 hover:text-[#6d4aff]"><LogOut className="h-4 w-4" />Cerrar sesión</button></header>
    <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_360px] lg:items-start"><section><p className="sans text-xs font-bold uppercase tracking-[.18em] text-[#6d4aff]">onboarding · cuenta gratuita</p><h1 className="mt-3 max-w-2xl text-5xl font-bold leading-[.95] tracking-[-.07em] md:text-7xl">Configura tu espacio en Rifly.</h1><p className="mt-6 max-w-2xl sans text-lg leading-8 text-slate-500">Crea tu organización, genera una API segura y administra tus rifas desde un solo lugar.</p>
      {loading ? <p className="mt-12 sans text-slate-500">Cargando tu cuenta...</p> : consumer ? <div className="mt-10 space-y-5">{token && <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6"><p className="sans text-xs font-bold uppercase tracking-[.14em] text-amber-700">Guarda tu clave ahora</p><h2 className="mt-2 text-2xl font-bold text-amber-950">Tu API está lista</h2><code className="mt-4 block overflow-x-auto rounded-xl bg-white p-4 text-xs text-slate-800">{token}</code></div>}<AccountApiKeyManager initialTokens={consumer.integrations[0]?.integration_tokens ?? []} /><div className="rounded-3xl border border-slate-200 bg-white p-6"><p className="sans text-xs font-bold uppercase tracking-[.14em] text-[#6d4aff]">Tu espacio está creado</p><h2 className="mt-2 text-2xl font-bold">Administra tus rifas</h2><p className="mt-2 sans leading-6 text-slate-500">Crea rifas desde Rifly o conéctalas a tus propios proyectos usando la API.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/cuenta/rifas" className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 sans text-sm font-bold text-white">Ir a mis rifas <ArrowRight className="h-4 w-4" /></Link><Link href="/#para-plataformas" className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-3 sans text-sm font-bold text-slate-700">Ver guía API</Link></div></div><div className="rounded-3xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between gap-4"><div><p className="sans text-xs font-bold uppercase tracking-[.14em] text-[#6d4aff]">Tu actividad</p><h2 className="mt-2 text-2xl font-bold">Rifas creadas</h2></div><span className="rounded-full bg-[#eeeaff] px-3 py-1 sans text-xs font-bold text-[#5a38e8]">{raffles.length}</span></div>{raffles.length ? <div className="mt-5 space-y-3">{raffles.slice(0, 4).map(raffle => <div key={raffle.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"><div><p className="font-bold">{raffle.title}</p><p className="mt-1 sans text-xs text-slate-500">/rifa/{raffle.slug} · sorteo {new Date(raffle.draw_at).toLocaleDateString("es-CO")}</p></div><span className="rounded-full bg-white px-3 py-1 sans text-xs font-bold text-slate-600">{raffle.status}</span></div>)}</div> : <p className="mt-5 rounded-2xl bg-slate-50 p-5 sans text-sm text-slate-500">Todavía no tienes rifas.</p>}</div></div> : <form onSubmit={createIntegration} className="mt-10 max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><p className="sans text-xs font-bold uppercase tracking-[.14em] text-[#6d4aff]">Paso 1 · crea tu organización</p><h2 className="mt-2 text-3xl font-bold tracking-[-.05em]">¿Cómo se llama tu proyecto?</h2><p className="mt-2 sans text-sm leading-6 text-slate-500">Usaremos estos datos para separar tus rifas de las demás organizaciones.</p><div className="mt-6 space-y-4 sans"><label className="block text-sm font-bold">Nombre del proyecto o empresa<input required minLength={2} value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Ej. REM Experience" className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#6d4aff]" /></label><label className="block text-sm font-bold">Nombre de la organización<input required minLength={2} value={organizationName} onChange={e => { const value = e.target.value; setOrganizationName(value); setOrganizationSlug(slugify(value)); }} placeholder="Ej. REM Experience" className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#6d4aff]" /></label><label className="block text-sm font-bold">Identificador de la organización<input required readOnly value={organizationSlug} placeholder="se-generará-automáticamente" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 outline-none" /></label>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<LoadingButton loading={creating} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 font-bold text-white">Crear mi espacio gratis <ArrowRight className="h-4 w-4" /></LoadingButton></div></form>}</section>
      <aside className="space-y-4 lg:pt-20"><article className="rounded-3xl border border-slate-200 bg-white p-6"><Code2 className="h-6 w-6 text-[#6d4aff]" /><h2 className="mt-5 text-xl font-bold">Una API para tu proyecto</h2><p className="mt-2 sans text-sm leading-6 text-slate-500">Usa el token desde tu backend para crear rifas y emitir participaciones.</p></article><article className="rounded-3xl border border-slate-200 bg-white p-6"><Workflow className="h-6 w-6 text-[#6d4aff]" /><h2 className="mt-5 text-xl font-bold">Tu espacio, tus rifas</h2><p className="mt-2 sans text-sm leading-6 text-slate-500">Tu organización mantiene sus rifas aisladas.</p></article></aside>
    </div></div></main></OrganizerShell>;
}
