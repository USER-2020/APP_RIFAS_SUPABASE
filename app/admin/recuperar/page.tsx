"use client";
import Link from "@/components/loading-link";
import LoadingButton from "@/components/loading-button";
import { createClient } from "@/lib/supabase/browser";
import { useState } from "react";

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (loading) return; setLoading(true); setError(""); setMessage("");
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin/restablecer` });
    if (resetError) setError("No pudimos enviar el correo. Verifica la dirección e inténtalo de nuevo.");
    else setMessage("Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.");
    setLoading(false);
  }
  return <main className="grid min-h-screen place-items-center bg-[#101828] px-5"><form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8"><div className="flex items-center gap-2 sans text-xl font-black tracking-[-.06em]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#6d4aff] text-white">R</span>RIFLY</div><h1 className="mt-10 text-4xl font-bold tracking-[-.06em]">Recuperar acceso.</h1><p className="mt-2 sans text-sm leading-6 text-slate-500">Te enviaremos un enlace seguro desde el correo oficial de Rifly.</p><div className="mt-8 space-y-4 sans"><label className="block text-sm font-bold">Correo electrónico<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@ejemplo.com" className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#6d4aff]" /></label>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}<LoadingButton loading={loading} disabled={loading} className="w-full rounded-xl bg-[#6d4aff] px-4 py-3 font-bold text-white">{loading ? "Enviando..." : "Enviar enlace"}</LoadingButton><Link href="/admin/login" className="block text-center text-sm font-bold text-slate-500">Volver al inicio de sesión</Link></div></form></main>;
}
