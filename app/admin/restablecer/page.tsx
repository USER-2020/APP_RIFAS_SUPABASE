"use client";
import Link from "@/components/loading-link";
import LoadingButton from "@/components/loading-button";
import PasswordInput from "@/components/password-input";
import { createClient } from "@/lib/supabase/browser";
import { useState } from "react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (loading) return; setError(""); setMessage("");
    if (password.length < 8 || password !== confirmation) { setError(password.length < 8 ? "La contraseña debe tener al menos 8 caracteres." : "Las contraseñas no coinciden."); return; }
    setLoading(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    if (updateError) setError("El enlace no es válido o ya venció. Solicita uno nuevo.");
    else { setPassword(""); setConfirmation(""); setMessage("Contraseña actualizada. Ya puedes iniciar sesión."); }
    setLoading(false);
  }
  return <main className="grid min-h-screen place-items-center bg-[#101828] px-5"><form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8"><div className="flex items-center gap-2 sans text-xl font-black tracking-[-.06em]"><span className="grid h-9 w-9 rounded-xl bg-[#6d4aff] place-items-center text-white">R</span>RIFLY</div><h1 className="mt-10 text-4xl font-bold tracking-[-.06em]">Nueva contraseña.</h1><p className="mt-2 sans text-sm leading-6 text-slate-500">Elige una contraseña segura para tu cuenta administrativa.</p><div className="mt-8 space-y-4 sans"><label className="block text-sm font-bold">Nueva contraseña<PasswordInput type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#6d4aff]" /></label><label className="block text-sm font-bold">Repetir contraseña<PasswordInput type="password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#6d4aff]" /></label>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}<LoadingButton loading={loading} disabled={loading} className="w-full rounded-xl bg-[#6d4aff] px-4 py-3 font-bold text-white">{loading ? "Guardando..." : "Actualizar contraseña"}</LoadingButton><Link href="/admin/login" className="block text-center text-sm font-bold text-slate-500">Ir al inicio de sesión</Link></div></form></main>;
}
