"use client";
import LoadingButton from "@/components/loading-button";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
export default function LoginPage() { const router = useRouter(); const [loading, setLoading] = useState(false); const [navigating, startNavigation] = useTransition(); const busy = loading || navigating; const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [showPassword,setShowPassword]=useState(false); const [error,setError]=useState(""); const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setLoading(true); setError("");
    try {
      const { error } = await createClient().auth.signInWithPassword({ email, password });
      if (error) { setError("Correo o contraseña incorrectos."); return; }
      startNavigation(() => router.replace("/admin"));
    } catch { setError("No pudimos conectar. Revisa tu conexión e intenta nuevamente."); }
    finally { setLoading(false); }
  }; return <main className="grid min-h-screen place-items-center bg-[#101828] px-5"><form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8"><div className="flex items-center gap-2 sans text-xl font-black tracking-[-.06em]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#6d4aff] text-white">R</span>RIFLY</div><h1 className="mt-10 text-4xl font-bold tracking-[-.06em]">Hola, admin.</h1><p className="mt-2 sans text-sm text-slate-500">Gestiona tus rifas desde cualquier dispositivo.</p><div className="mt-8 space-y-4 sans"><input disabled={busy} required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Correo electrónico" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#6d4aff]"/><div className="relative"><input disabled={busy} required type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none focus:border-[#6d4aff]"/><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-lg text-slate-500 hover:text-[#6d4aff]"><span aria-hidden="true">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</span></button></div>{error&&<p role="alert" className="text-sm text-red-600">{error}</p>}<LoadingButton loading={busy} loadingText="Iniciando sesión..." className="w-full rounded-xl bg-[#6d4aff] px-4 py-3 font-bold text-white">{busy ? "Iniciando sesión..." : "Entrar"}</LoadingButton></div></form></main>; }
