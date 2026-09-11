import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require-admin";
import RaffleCreateForm from "@/components/raffle-create-form";

export const metadata = { title: "Nueva rifa", robots: { index: false, follow: false } };

export default async function NewRafflePage() {
  await requireAdmin();
  return <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 md:px-8 md:py-8"><header className="mx-auto mb-5 flex max-w-6xl items-center justify-between"><div><p className="sans text-[11px] font-bold uppercase tracking-[.16em] text-[#6d4aff]">Rifly admin</p><p className="mt-1 sans text-sm text-slate-500">Nueva rifa</p></div><Link href="/admin" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 sans text-xs font-bold text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-3.5 w-3.5" /> Volver al panel</Link></header><section className="mx-auto max-w-6xl"><RaffleCreateForm /></section></main>;
}
