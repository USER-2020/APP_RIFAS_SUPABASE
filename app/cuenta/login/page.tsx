"use client";
import Link from "@/components/loading-link";
import LoadingButton from "@/components/loading-button";
import PasswordInput from "@/components/password-input";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AccountLoginPage() {
  const router = useRouter(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setLoading(true); setError(""); const { error: authError } = await createClient().auth.signInWithPassword({ email, password }); if (authError) setError("Correo o contraseña incorrectos."); else router.push("/cuenta"); setLoading(false); }
  return <main className="grid min-h-screen place-items-center bg-[#f6f7fb] px-5"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"><Link href="/" className="flex items-center gap-2 text-xl font-black tracking-[-.06em]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#6d4aff] text-white">R</span>RIFLY</Link><h1 className="mt-10 text-4xl font-bold tracking-[-.06em]">Inicia sesión</h1><p className="mt-2 sans text-sm leading-6 text-slate-500">Administra tus integraciones y tokens API.</p><div className="mt-8 space-y-4 sans"><input required type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#6d4aff]" /><PasswordInput required placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#6d4aff]" />{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<LoadingButton loading={loading} className="w-full rounded-xl bg-[#6d4aff] px-4 py-3 font-bold text-white">Entrar</LoadingButton><Link href="/cuenta/recuperar" className="block text-center text-sm font-bold text-[#6d4aff]">¿Olvidaste tu contraseña?</Link><p className="text-center text-sm text-slate-500">¿No tienes cuenta? <Link href="/cuenta/registro" className="font-bold text-[#6d4aff]">Regístrate gratis</Link></p></div></form></main>;
}
