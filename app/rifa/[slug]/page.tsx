import type { Metadata } from "next";
/* eslint-disable @next/next/no-img-element */
import Link from "@/components/loading-link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { date, getPublicRaffleBySlug, money, publicImageUrl } from "@/lib/raffles";
import NumberPicker from "@/components/number-picker";
import RaffleShareButton from "@/components/raffle-share-button";

export const revalidate = 60;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const raffle = await getPublicRaffleBySlug(slug);
  if (!raffle) notFound();

  const title = `${raffle.title} | Rifly`;
  const description = `Participa en la rifa de ${raffle.prize_name}. Elige tus números desde ${money(raffle.price_per_number)}.`;
  const cover = publicImageUrl(raffle.image_path);
  // Use the actual uploaded cover without declaring dimensions it may not have.
  const images = cover ? [{ url: cover, alt: `Portada de ${raffle.title}` }] : [];

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/rifa/${encodeURIComponent(raffle.slug)}` },
    openGraph: {
      title,
      description,
      url: `/rifa/${encodeURIComponent(raffle.slug)}`,
      siteName: "Rifly",
      locale: "es_CO",
      type: "website",
      images,
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}
export default async function RafflePage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const raffle = await getPublicRaffleBySlug(slug); if (!raffle) notFound(); const supabase = await createClient(); const { data } = await supabase.from("raffle_numbers").select("number,status").eq("raffle_id", raffle.id).order("number"); const numbers = (data ?? []) as { number: number; status: string }[]; const closed = raffle.status !== "active" || new Date(raffle.sales_close_at) <= new Date(); const cover = publicImageUrl(raffle.image_path); return <main className="min-h-screen bg-[#f7f8fc] px-5 py-6 md:px-10"><header className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/rifas" className="flex items-center gap-2 sans text-sm font-bold text-slate-500"><ArrowLeft className="h-4 w-4" /> Todas las rifas</Link><Link href="/" className="sans text-xl font-black tracking-[-.06em]">RIFLY</Link><RaffleShareButton title={raffle.title} slug={raffle.slug} /></header><section className="mx-auto max-w-6xl pb-20 pt-10"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><div className="relative flex min-h-[360px] items-end overflow-hidden rounded-[2rem] bg-[#e8e5ff] p-8 md:min-h-[500px] md:p-12">{cover ? <img src={cover} alt={`Portada de ${raffle.title}`} className="absolute inset-0 h-full w-full object-cover" /> : <span className="relative text-[10rem] font-black leading-none tracking-[-.14em]">{raffle.title.slice(0, 2).toUpperCase()}</span>}</div><div className="flex flex-col justify-center"><span className={`w-fit rounded-full px-3 py-1 sans text-xs font-bold ${closed ? "bg-slate-200 text-slate-600" : "bg-[#dff8ed] text-emerald-700"}`}>{closed ? "Ventas cerradas" : "Rifa activa"}</span><h1 className="mt-5 text-6xl font-bold leading-[.92] tracking-[-.08em] md:text-8xl">{raffle.title}</h1><p className="mt-6 max-w-xl sans text-lg leading-8 text-slate-500">{raffle.description}</p><div className="mt-8 grid max-w-md grid-cols-2 gap-4 sans"><div className="rounded-2xl border border-slate-200 bg-white p-4"><span className="block text-xs text-slate-400">Por número</span><strong className="text-xl">{money(raffle.price_per_number)}</strong></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><span className="block text-xs text-slate-400">Sorteo</span><strong className="text-sm">{date(raffle.draw_at)}</strong></div></div></div></div><div className="mt-16 grid gap-8 lg:grid-cols-[1fr_280px]"><div><h2 className="text-4xl font-bold tracking-[-.06em]">Participa en esta rifa</h2><p className="mt-2 sans text-sm text-slate-500">Selecciona tus números y completa tus datos para reservar.</p>{closed ? <p className="mt-8 rounded-2xl bg-slate-100 p-5 sans text-sm text-slate-600">Las ventas de esta rifa están cerradas.</p> : <NumberPicker raffleId={raffle.id} numbers={numbers} price={raffle.price_per_number} raffleTitle={raffle.title} raffleSlug={raffle.slug} />}</div><aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 sans"><h3 className="font-bold">Información</h3><div className="mt-5 space-y-3 text-sm"><p><span className="block text-slate-400">Premio</span><strong>{raffle.prize_name}</strong></p><p><span className="block text-slate-400">Números</span><strong>{numbers.length}</strong></p><p><span className="block text-slate-400">Método</span><strong>{raffle.draw_method}</strong></p></div></aside></div></section></main>; }
