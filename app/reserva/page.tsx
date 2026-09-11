import Link from "@/components/loading-link";
import ReservationLookupForm from "@/components/reservation-lookup-form";

export default function ReservationLookupPage() {
  return <main className="grid min-h-screen place-items-center bg-[#f7f8fc] px-5 py-10">
    <section className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
      <Link href="/" className="sans text-xl font-black">RIFLY</Link>
      <h1 className="mt-6 text-4xl font-bold tracking-[-.06em]">Consulta tu reserva.</h1>
      <p className="mt-3 sans text-sm text-slate-500">Ingresa el código que recibiste al reservar para revisar tus números y su estado.</p>
      <ReservationLookupForm />
      <Link href="/rifas" className="mt-6 block sans text-sm font-bold text-slate-500">Ver rifas disponibles</Link>
    </section>
  </main>;
}
