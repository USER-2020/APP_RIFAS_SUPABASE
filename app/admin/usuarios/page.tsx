import Link from "@/components/loading-link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import AdminUserForm from "@/components/admin-user-form";
import AdminUserList from "@/components/admin-user-list";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Administradores", robots: { index: false, follow: false } };

export default async function AdminUsersPage() {
  const { user, supabase } = await requireAdmin();
  const [{ data: profiles }, { data: authUsers }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,role,created_at").eq("role", "admin").order("created_at", { ascending: false }),
    createAdminClient().auth.admin.listUsers({ page: 1, perPage: 100 }),
  ]);
  const emails = new Map((authUsers?.users ?? []).map((authUser) => [authUser.id, authUser.email ?? "Sin correo"]));
  const admins = (profiles ?? []).map((profile) => ({ id: profile.id, fullName: profile.full_name ?? "Administrador", email: emails.get(profile.id) ?? "Sin correo", createdAt: profile.created_at, isCurrent: profile.id === user.id }));
  return <main className="min-h-screen bg-[#f7f8fc] px-5 py-6 md:px-10"><header className="mx-auto flex max-w-3xl items-center justify-between"><Link href="/admin" className="sans flex items-center gap-1 text-sm font-bold text-slate-500"><ArrowLeft className="h-4 w-4" /> Panel</Link><span className="sans text-xl font-black tracking-[-.06em]">RIFLY</span></header><section className="mx-auto max-w-3xl pb-20 pt-12"><ShieldCheck className="h-8 w-8 text-[#6d4aff]" /><h1 className="mt-5 text-5xl font-bold tracking-[-.07em]">Administradores.</h1><p className="mt-3 max-w-xl sans leading-7 text-slate-500">Crea accesos para las personas que gestionarán rifas, reservas y participantes.</p><div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 md:p-8"><AdminUserForm /></div><div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 md:p-8"><div className="flex items-end justify-between gap-4"><div><h2 className="text-2xl font-bold tracking-[-.05em]">Usuarios administradores</h2><p className="mt-1 sans text-sm text-slate-500">Edita accesos o elimina cuentas que ya no necesiten entrar.</p></div><span className="rounded-full bg-[#eeeaff] px-3 py-1 sans text-xs font-bold text-[#5a38e8]">{admins.length}</span></div><div className="mt-6"><AdminUserList initialUsers={admins} /></div></div><p className="mt-5 sans text-xs leading-5 text-slate-400">No puedes eliminar tu propia cuenta desde este panel. La contraseña se procesa exclusivamente en Supabase Auth.</p></section></main>;
}
