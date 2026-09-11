import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import AdminUserForm from "@/components/admin-user-form";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata = { title: "Administradores", robots: { index: false, follow: false } };

export default async function AdminUsersPage() {
  await requireAdmin();
  return <main className="min-h-screen bg-[#f7f8fc] px-5 py-6 md:px-10"><header className="mx-auto flex max-w-3xl items-center justify-between"><Link href="/admin" className="sans flex items-center gap-1 text-sm font-bold text-slate-500"><ArrowLeft className="h-4 w-4" /> Panel</Link><span className="sans text-xl font-black tracking-[-.06em]">RIFLY</span></header><section className="mx-auto max-w-3xl pb-20 pt-12"><ShieldCheck className="h-8 w-8 text-[#6d4aff]" /><h1 className="mt-5 text-5xl font-bold tracking-[-.07em]">Administradores.</h1><p className="mt-3 max-w-xl sans leading-7 text-slate-500">Crea accesos para las personas que gestionarán rifas, reservas y participantes.</p><div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 md:p-8"><AdminUserForm /></div><p className="mt-5 sans text-xs leading-5 text-slate-400">La contraseña se almacena y valida exclusivamente en Supabase Auth. La clave service role sólo vive en el servidor.</p></section></main>;
}