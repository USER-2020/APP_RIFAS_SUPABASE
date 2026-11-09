"use client";

import Link from "@/components/loading-link";
import OrganizerShell from "@/components/organizer-shell";
import LoadingButton from "@/components/loading-button";
import { createClient } from "@/lib/supabase/browser";
import { ArrowRight, Check, Code2, Copy, LogOut, ShieldCheck, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AccountConsumer = { id: string; name: string; email: string; integrations: Array<{ id: string; name: string }> };
type AccountRaffle = { id: string; title: string; slug: string; status: string; draw_at: string; price_per_number: number };

const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function AccountIntegrationsPage() {
  const router = useRouter();
  const [consumer, setConsumer] = useState<AccountConsumer | null>(null);
  const [raffles, setRaffles] = useState<AccountRaffle[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");

  useEffect(() => {
    fetch("/api/account/integration").then(async (response) => {
      if (response.status === 401) { router.push("/cuenta/login"); return; }
      const data = await response.json(); setConsumer(data.consumer);
      if (data.consumer) { const rafflesResponse = await fetch("/api/account/raffles"); if (rafflesResponse.ok) setRaffles((await rafflesResponse.json()).raffles ?? []); }
      setLoading(false);
    }).catch(() => { setError("No pudimos cargar tu cuenta."); setLoading(false); });
  }, [router]);

  async function createIntegration(event: React.FormEvent) {
    event.preventDefault(); setCreating(true); setError("");
    const response = await fetch("/api/account/integration", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: projectName, organizationName, organizationSlug }) });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "No se pudo crear la integración.");
    else { setToken(data.token); setConsumer({ id: "created", name: projectName, email: "", integrations: [] }); setRaffles([]); }
    setCreating(false);
  }

  async function copyToken() { await navigator.clipboard.writeText(token); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  async function signOut() { await createClient().auth.signOut(); router.push("/"); }

  return <OrganizerShell><main className="min-h-screen bg-[#f6f7fb] px-5 py-8 md:px-8"><div className="mx-auto max-w-6xl"><header className="flex flex-wrap items-center justify-between gap-4"><Link href="/" className="flex items-center gap-2 text-xl font-black tracking-[-.06em]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#6d4aff] text-white">R</span>RIFLY</Link><button onClick={signOut} className="inline-flex items-center gap-2 sans text-sm font-bold text-slate-500 hover:text-[#6d4aff]"><LogOut className="h-4 w-4" />Cerrar sesión</button></header>
    <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_360px] lg:items-start"><section><p className="sans text-xs font-bold uppercase tracking-[.18em] text-[#6d4aff]">onboarding · cuenta gratuita</p><h1 className="mt-3 max-w-2xl text-5xl font-bold leading-[.95] tracking-[-.07em] md:text-7xl">Configura tu espacio en Rifly.</h1><p className="mt-6 max-w-2xl sans text-lg leading-8 text-slate-500">Crea tu organización, genera una API segura y administra tus rifas desde un solo lugar.</p><div className="mt-8 flex items-center gap-3 sans text-sm font-bold"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#6d4aff] text-white">1</span><span className="text-[#5a38e8]">Tu organización</span><span className="h-px w-10 bg-slate-300" /><span className={`grid h-8 w-8 place-items-center rounded-full ${consumer ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>{consumer ? <Check className="h-4 w-4" /> : "2"}</span><span className={consumer ? "text-emerald-600" : "text-slate-500"}>API lista</span></div>
      {loading ? <p className="mt-12 sans text-slate-500">Cargando tu cuenta...</p> : consumer ? <div className="mt-10 space-y-5">{token && <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6"><div className="flex items-start justify-between gap-4"><div><p className="sans text-xs font-bold uppercase tracking-[.14em] text-amber-700">Paso 2 · guarda tu token</p><h2 className="mt-2 text-2xl font-bold text-amber-950">Tu API está lista</h2></div><ShieldCheck className="h-7 w-7 text-amber-600" /></div><p className="mt-3 sans text-sm leading-6 text-amber-900">Este token sólo se muestra ahora. Guárdalo en las variables secretas de tu servidor.</p><div className="mt-4 flex gap-2"><code className="min-w-0 flex-1 overflow-x-auto rounded-xl bg-white p-4 text-xs text-slate-800">{token}</code><button type="button" onClick={copyToken} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-amber-800 hover:bg-amber-100" aria-label="Copiar token" title="Copiar token">{copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}</button></div></div>}<div className="rounded-3xl border border-slate-200 bg-white p-6"><p className="sans text-xs font-bold uppercase tracking-[.14em] text-[#6d4aff]">Tu espacio está creado</p><h2 className="mt-2 text-2xl font-bold">Administra tus rifas</h2><p className="mt-2 sans leading-6 text-slate-500">Crea rifas desde Rifly o conéctalas a tus propios proyectos usando la API.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/cuenta/rifas" className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 sans text-sm font-bold text-white">Ir a mis rifas <ArrowRight className="h-4 w-4" /></Link><Link href="/#para-plataformas" className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-3 sans text-sm font-bold text-slate-700">Ver guía API</Link></div></div><div className="rounded-3xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between gap-4"><div><p className="sans text-xs font-bold uppercase tracking-[.14em] text-[#6d4aff]">Tu actividad</p><h2 className="mt-2 text-2xl font-bold">Rifas creadas</h2></div><span className="rounded-full bg-[#eeeaff] px-3 py-1 sans text-xs font-bold text-[#5a38e8]">{raffles.length}</span></div>{raffles.length ? <div className="mt-5 space-y-3">{raffles.slice(0, 4).map(raffle => <div key={raffle.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"><div><p className="font-bold">{raffle.title}</p><p className="mt-1 sans text-xs text-slate-500">/rifa/{raffle.slug} · sorteo {new Date(raffle.draw_at).toLocaleDateString("es-CO")}</p></div><span className="rounded-full bg-white px-3 py-1 sans text-xs font-bold text-slate-600">{raffle.status}</span></div>)}{raffles.length > 4 && <p className="sans text-xs text-slate-500">Mostrando las últimas 4 rifas.</p>}<Link href="/cuenta/rifas" className="inline-flex items-center gap-2 pt-2 sans text-sm font-bold text-[#6d4aff]">Ver todas <ArrowRight className="h-4 w-4" /></Link></div> : <p className="mt-5 rounded-2xl bg-slate-50 p-5 sans text-sm text-slate-500">Todavía no tienes rifas. Crea la primera desde “Ir a mis rifas”.</p>}</div></div> : <form onSubmit={createIntegration} className="mt-10 max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><p className="sans text-xs font-bold uppercase tracking-[.14em] text-[#6d4aff]">Paso 1 · crea tu organización</p><h2 className="mt-2 text-3xl font-bold tracking-[-.05em]">¿Cómo se llama tu proyecto?</h2><p className="mt-2 sans text-sm leading-6 text-slate-500">Usaremos estos datos para separar tus rifas de las demás organizaciones.</p><div className="mt-6 space-y-4 sans"><label className="block text-sm font-bold">Nombre del proyecto o empresa<input required minLength={2} value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Ej. REM Experience" className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#6d4aff]" /></label><label className="block text-sm font-bold">Nombre de la organización<input required minLength={2} value={organizationName} onChange={e => { const value = e.target.value; setOrganizationName(value); setOrganizationSlug(slugify(value)); }} placeholder="Ej. REM Experience" className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#6d4aff]" /></label><label className="block text-sm font-bold">Identificador de la organización<div className="relative mt-1.5"><input required readOnly value={organizationSlug} placeholder="se-generará-automáticamente" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-24 text-slate-600 outline-none" /><span className="absolute right-3 top-3.5 sans text-xs font-bold text-slate-400">automático</span></div></label>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<LoadingButton loading={creating} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 font-bold text-white">Crear mi espacio gratis <ArrowRight className="h-4 w-4" /></LoadingButton></div></form>}</section>
      <aside className="space-y-4 lg:pt-20"><article className="rounded-3xl border border-slate-200 bg-white p-6"><Code2 className="h-6 w-6 text-[#6d4aff]" /><h2 className="mt-5 text-xl font-bold">Una API para tu proyecto</h2><p className="mt-2 sans text-sm leading-6 text-slate-500">Usa el token desde tu backend para crear rifas y emitir participaciones.</p></article><article className="rounded-3xl border border-slate-200 bg-white p-6"><Workflow className="h-6 w-6 text-[#6d4aff]" /><h2 className="mt-5 text-xl font-bold">Tu espacio, tus rifas</h2><p className="mt-2 sans text-sm leading-6 text-slate-500">Tu organización mantiene sus rifas aisladas y puede administrarlas desde Rifly.</p></article></aside>
    </div></div></main></OrganizerShell>;
}
