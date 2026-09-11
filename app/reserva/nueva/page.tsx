import Link from "next/link";
import ReservationForm from "@/components/reservation-form";
import { getPublicRaffleById } from "@/lib/raffles";

export default async function NewReservationPage({ searchParams }: { searchParams: Promise<{ numbers?: string; raffleId?: string }> }) {
  const query = await searchParams;
  const numbers = [...new Set((query.numbers ?? "").split(",").filter((value) => value.trim() !== "").map(Number).filter(Number.isInteger))];
  const raffle = query.raffleId ? await getPublicRaffleById(query.raffleId) : null;
  if (!numbers.length || !raffle) return <main className="grid min-h-screen place-items-center bg-[#f7f8fc] px-5"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-3xl font-bold">Selecciona tus números</h1><Link href="/rifas" className="mt-7 block rounded-xl bg-[#101828] px-4 py-3 sans text-sm font-bold text-white">Volver a las rifas</Link></div></main>;
  return <main className="min-h-screen bg-[#f7f8fc] px-5 py-8 md:px-10">
    <header className="mx-auto flex max-w-2xl items-center justify-between"><Link href={`/rifa/${raffle.slug}`} className="sans text-sm font-bold text-slate-500">← Cambiar números</Link><Link href="/" className="sans text-xl font-black">RIFLY</Link></header>
    <section className="mx-auto max-w-2xl pb-16 pt-10">
      <div className="mb-8 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#6d4aff] sans text-sm font-bold text-white">2</span><div><p className="sans text-xs font-bold uppercase tracking-[.14em] text-[#6d4aff]">Paso 2 de 2</p><p className="sans text-sm font-semibold text-slate-700">Completa tus datos para reservar</p></div></div>
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm md:p-8">
        <p className="sans text-xs font-bold uppercase tracking-[.14em] text-[#6d4aff]">Tu selección</p><h1 className="mt-2 text-4xl font-bold tracking-[-.06em]">{raffle.title}</h1>
        <div className="mt-5 flex flex-wrap justify-center gap-2">{numbers.map((number) => <span key={number} className="rounded-lg bg-[#eeeaff] px-3 py-2 sans text-sm font-bold text-[#5a38e8]">{String(number).padStart(2, "0")}</span>)}</div>
        <div className="mt-6 border-t border-slate-100 pt-5"><p className="sans text-sm text-slate-500">Sólo necesitaremos tu nombre y WhatsApp para crear la reserva.</p><div className="mt-6"><ReservationForm raffleId={raffle.id} raffleTitle={raffle.title} numbers={numbers} /></div></div>
      </div>
    </section>
  </main>;
}
