import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { normalizeRaffleSlug } from "@/lib/raffles";
import ParticipationPicker from "@/components/participation-picker";
import { findParticipationToken } from "@/lib/api/participation-token";

export const metadata: Metadata = { title: "Participar en la rifa | Rifly", robots: { index: false, follow: false } };

export default async function EmbeddedRafflePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ claim?: string }> }) {
  const { slug } = await params;
  const { claim } = await searchParams;
  if (!claim) return <EmbedMessage title="Enlace incompleto" text="Solicita un nuevo enlace de participación." />;
  const token = await findParticipationToken(claim, normalizeRaffleSlug(slug));
  if (!token) return <EmbedMessage title="Enlace no disponible" text="Este enlace venció, ya fue utilizado o no corresponde a esta rifa." />;
  const supabase = await createClient();
  const { data: numbers } = await supabase.from("raffle_numbers").select("number,status").eq("raffle_id", token.raffle_id).order("number");
  return <main className="min-h-screen bg-[#f7f8fc] px-4 py-5 text-[#101828]"><div className="mx-auto max-w-2xl"><div className="mb-5 flex items-center justify-between"><span className="sans text-sm font-black tracking-[-.05em]">RIFLY</span><span className="rounded-full bg-[#dff8ed] px-3 py-1 sans text-xs font-bold text-emerald-700">Participación habilitada</span></div><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"><p className="sans text-xs font-bold uppercase tracking-[.14em] text-[#6d4aff]">{token.raffle.title}</p><h1 className="mt-2 text-3xl font-bold tracking-[-.06em]">Elige tus números</h1><p className="mt-2 sans text-sm text-slate-500">Puedes seleccionar hasta {token.allowed_numbers} {token.allowed_numbers === 1 ? "número" : "números"}. Después de confirmar, no podrás cambiarlos.</p><ParticipationPicker claimToken={claim} maxNumbers={token.allowed_numbers} numbers={(numbers ?? []) as { number: number; status: string }[]} /></section></div></main>;
}

function EmbedMessage({ title, text }: { title: string; text: string }) { return <main className="grid min-h-screen place-items-center bg-[#f7f8fc] px-5"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-2xl font-bold">{title}</h1><p className="mt-3 sans text-sm text-slate-500">{text}</p></section></main>; }
