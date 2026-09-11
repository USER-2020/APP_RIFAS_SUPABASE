import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import ReservationForm from "@/components/reservation-form";

export default async function ReservationPage({ searchParams }: { searchParams: Promise<{ numbers?: string; raffle?: string }> }) {
	const query = await searchParams;
	const numbers = (query.numbers ?? "").split(",").map(Number).filter(Number.isInteger);
	const raffleTitle = query.raffle ?? "Rifa Rifly";
	if (!numbers.length) return <main className="grid min-h-screen place-items-center bg-[#f7f8fc] px-5"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl"><CheckCircle2 className="mx-auto h-12 w-12 text-slate-300" /><h1 className="mt-5 text-3xl font-bold tracking-[-.06em]">No hay números seleccionados</h1><Link href="/rifas" className="mt-7 block rounded-xl bg-[#101828] px-4 py-3 sans text-sm font-bold text-white">Volver a las rifas</Link></div></main>;
	return <main className="grid min-h-screen place-items-center bg-[#f7f8fc] px-5 py-10"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl"><Link href="/rifas" className="sans text-sm font-bold text-slate-500">← Volver</Link><p className="mt-8 sans text-xs font-bold uppercase tracking-[.15em] text-[#6d4aff]">paso 2 de 2</p><h1 className="mt-2 text-4xl font-bold tracking-[-.06em]">Completa tu reserva.</h1><p className="mt-3 sans text-sm leading-6 text-slate-500">{raffleTitle} · Números: {numbers.join(", ")}</p><div className="mt-7"><ReservationForm raffleId="demo-iphone" raffleTitle={raffleTitle} numbers={numbers} /></div></div></main>;
}