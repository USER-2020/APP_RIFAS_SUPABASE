"use client";
import LoadingButton from "@/components/loading-button";
import Link from "@/components/loading-link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, CircleUserRound, LayoutDashboard, LogOut, Menu, Plus, ShieldCheck, Star, Ticket, X } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

const navigation = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/reservas", label: "Reservas", icon: Ticket },
  { href: "/admin/compradores", label: "Compradores", icon: CircleUserRound },
  { href: "/admin/rifas/nueva", label: "Nueva rifa", icon: Plus },
  { href: "/admin/rifas/destacada", label: "Destacada", icon: Star },
  { href: "/admin/usuarios", label: "Administradores", icon: ShieldCheck },
  { href: "/admin/perfil", label: "Mi perfil", icon: CircleUserRound },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [navigating, startNavigation] = useTransition(); const [signOutError, setSignOutError] = useState(""); const pathname = usePathname(); const router = useRouter(); const [collapsed, setCollapsed] = useState(false); const [mobileOpen, setMobileOpen] = useState(false); const [signingOut, setSigningOut] = useState(false);
  async function signOut() {
    if (signingOut || navigating) return;
    setSigningOut(true); setSignOutError("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) { setSignOutError("No pudimos cerrar sesión. Intenta nuevamente."); return; }
      startNavigation(() => { router.replace("/admin/login"); router.refresh(); });
    } catch { setSignOutError("No pudimos conectar. Intenta nuevamente."); }
    finally { setSigningOut(false); }
  }
  const current = navigation.find((item) => item.href === pathname) ?? navigation[0];
  return <div className="min-h-screen bg-[#f6f7fb] text-[#101828]"><div className={`fixed inset-0 z-40 bg-[#10182866] transition lg:hidden ${mobileOpen ? "visible opacity-100" : "invisible opacity-0"}`} onClick={() => setMobileOpen(false)} /><aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "lg:w-[84px]" : "lg:w-64"} w-72`}><div className="flex h-20 items-center justify-between border-b border-slate-100 px-5"><Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#6d4aff] font-bold text-white">R</span>{!collapsed && <span className="sans text-lg font-black tracking-[-.06em]">RIFLY <span className="ml-1 text-[10px] font-bold tracking-[.12em] text-[#6d4aff]">ADMIN</span></span>}</Link><button onClick={() => setMobileOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden" aria-label="Cerrar menú"><X className="h-5 w-5" /></button></div><nav className="flex-1 space-y-1 p-3">{navigation.map((item) => { const Icon = item.icon; const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href); return <Link href={item.href} key={item.href} onClick={() => setMobileOpen(false)} title={collapsed ? item.label : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 sans text-sm font-bold transition ${active ? "bg-[#eeeaff] text-[#5a38e8]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}><Icon className="h-5 w-5 shrink-0" />{!collapsed && <span>{item.label}</span>}</Link>; })}</nav><div className="border-t border-slate-100 p-3"><Link href="/rifas" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 sans text-sm font-bold text-slate-500 hover:bg-slate-50 ${collapsed ? "justify-center" : ""}`}><Ticket className="h-5 w-5" />{!collapsed && <span>Ver sitio público</span>}</Link><LoadingButton loading={signingOut || navigating} onClick={signOut} disabled={signingOut} title="Cerrar sesión" className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 sans text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 ${collapsed ? "justify-center" : ""}`}><LogOut className="h-5 w-5" />{!collapsed && <span>{signingOut ? "Cerrando..." : "Cerrar sesión"}</span>}</LoadingButton><button onClick={() => setCollapsed((value) => !value)} className="mt-1 hidden w-full items-center justify-center gap-2 rounded-xl px-3 py-3 sans text-xs font-bold text-slate-400 hover:bg-slate-50 lg:flex" title={collapsed ? "Expandir menú" : "Contraer menú"}>{collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> Contraer menú</>}</button></div></aside><div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-[84px]" : "lg:pl-64"}`}><header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-[#f6f7fbeF] px-5 backdrop-blur md:px-8"><div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 lg:hidden" aria-label="Abrir menú"><Menu className="h-5 w-5" /></button><div><p className="sans text-[11px] font-bold uppercase tracking-[.16em] text-[#6d4aff]">Rifly admin</p><h1 className="font-bold tracking-[-.04em]">{current.label}</h1></div></div><div className="flex items-center gap-3"><Link href="/admin/rifas/nueva" className="hidden items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-2.5 sans text-sm font-bold text-white shadow-lg shadow-[#6d4aff33] sm:flex"><Plus className="h-4 w-4" /> Nueva rifa</Link><Link href="/admin/perfil" title="Mi perfil" className="grid h-10 w-10 place-items-center rounded-full bg-[#101828] sans text-sm font-bold text-white transition hover:ring-4 hover:ring-[#6d4aff33]">A</Link></div></header><main>{signOutError && <p role="alert" className="m-5 rounded-xl bg-red-50 p-3 sans text-sm text-red-700">{signOutError}</p>}{children}</main></div></div>;
}
