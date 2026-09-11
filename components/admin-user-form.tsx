"use client";
import { useState } from "react";

export default function AdminUserForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setError(""); setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password"), fullName: form.get("fullName") }) });
    const result = await response.json(); setLoading(false);
    if (!response.ok) { setError(result.error ?? "No se pudo crear el usuario."); return; }
    event.currentTarget.reset(); setMessage(`Usuario admin creado: ${result.email}`);
  }
  return <form onSubmit={submit} className="space-y-4"><div><label className="sans mb-1.5 block text-sm font-bold" htmlFor="fullName">Nombre completo</label><input id="fullName" name="fullName" required minLength={3} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#6d4aff]" /></div><div><label className="sans mb-1.5 block text-sm font-bold" htmlFor="email">Correo electrónico</label><input id="email" name="email" type="email" required className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#6d4aff]" /></div><div><label className="sans mb-1.5 block text-sm font-bold" htmlFor="password">Contraseña temporal</label><input id="password" name="password" type="password" required minLength={8} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#6d4aff]" /><p className="mt-1 sans text-xs text-slate-400">Mínimo 8 caracteres. Entrégala por un canal seguro.</p></div>{error && <p className="rounded-xl bg-red-50 p-3 sans text-sm text-red-700">{error}</p>}{message && <p className="rounded-xl bg-emerald-50 p-3 sans text-sm text-emerald-700">{message}</p>}<button disabled={loading} className="w-full rounded-xl bg-[#6d4aff] px-4 py-3 sans text-sm font-bold text-white disabled:opacity-50">{loading ? "Creando..." : "Crear administrador"}</button></form>;
}