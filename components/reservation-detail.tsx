import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";

type Reservation = {
  code: string; status: "pending" | "confirmed" | "rejected" | "expired" | "cancelled";
  reserved_until: string; total: number; quantity: number; numbers: number[]; overdue: boolean;
  raffle_title: string; raffle_slug: string; whatsapp_number: string | null;
};
const statuses = {
  pending: { label: "Pendiente de confirmación", description: "Contacta al organizador por WhatsApp para confirmar tu reserva.", color: "bg-amber-50 text-amber-800" },
  confirmed: { label: "Reserva confirmada", description: "El organizador confirmó tu reserva.", color: "bg-emerald-50 text-emerald-800" },
  rejected: { label: "Reserva rechazada", description: "El organizador rechazó esta reserva.", color: "bg-red-50 text-red-800" },
  expired: { label: "Reserva vencida", description: "El plazo para confirmar esta reserva terminó.", color: "bg-slate-100 text-slate-700" },
  cancelled: { label: "Reserva cancelada", description: "Esta reserva fue cancelada.", color: "bg-slate-100 text-slate-700" },
};

export default async function ReservationDetail({ code: rawCode }: { code: string }) {
  const code = rawCode.trim().toUpperCase();
  let reservation: Reservation | null = null;
  let failed = false;
  if (/^RF-[0-9A-F]{6}$/.test(code)) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_reservation_by_code", { p_code: code });
    failed = Boolean(error);
    reservation = data as Reservation | null;
  }
  const overdue = reservation?.overdue;
  const state = reservation ? statuses[overdue ? "expired" : reservation.status] : null;
  const phone = reservation?.whatsapp_number?.replace(/\D/g, "");
  const message = reservation ? encodeURIComponent(`¡Hola! Quiero consultar mi reserva de *${reservation.raffle_title}*.\n\n*Datos de mi reserva*\n    • *Código:* ${reservation.code}\n    • *Números:* ${reservation.numbers.join(", ")}\n    • *Total:* ${money(reservation.total)}`) : "";
  return <main className="min-h-screen bg-[#f7f8fc] px-5 py-10">
    <header className="mx-auto flex max-w-2xl items-center justify-between sans"><Link href="/" className="text-xl font-black">RIFLY</Link><Link href="/reserva" className="text-sm font-bold text-slate-500">Consultar otro código</Link></header>
    <section className="mx-auto mt-10 max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm md:p-8">
      {reservation && state ? <>
        <p className="sans text-xs font-bold uppercase tracking-[.14em] text-[#6d4aff]">Tu reserva · {reservation.code}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.06em]">{reservation.raffle_title}</h1>
        <div className="mt-6 flex flex-wrap justify-center gap-2">{reservation.numbers.map((number) => <span key={number} className="rounded-lg bg-[#eeeaff] px-3 py-2 sans text-sm font-bold text-[#5a38e8]">{String(number).padStart(2, "0")}</span>)}</div>
        <div className={`mt-6 rounded-2xl p-5 sans ${state.color}`}><h2 className="font-bold">{state.label}</h2><p className="mt-2 text-sm">{state.description}</p></div>
        <dl className="mt-6 grid grid-cols-2 gap-4 sans text-sm"><div><dt className="text-slate-500">Números</dt><dd className="mt-1 font-bold">{reservation.quantity}</dd></div><div><dt className="text-slate-500">Total</dt><dd className="mt-1 font-bold">{money(reservation.total)}</dd></div></dl>
        <p className="mt-5 sans text-sm text-slate-500">Plazo de confirmación: {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(reservation.reserved_until))} (hora de Colombia).</p>
        {phone && <a href={`https://wa.me/${phone}?text=${message}`} target="_blank" rel="noreferrer" className="mt-6 block rounded-xl bg-[#128c55] px-4 py-3 sans text-sm font-bold text-white">Contactar por WhatsApp</a>}
        <Link href={`/rifa/${reservation.raffle_slug}`} className="mt-5 block sans text-sm font-bold text-[#6d4aff]">Ver rifa</Link>
      </> : <><h1 className="text-3xl font-bold">{failed ? "No pudimos consultar la reserva" : "No encontramos esa reserva"}</h1><p className="mt-4 sans text-sm text-slate-500">{failed ? "Intenta nuevamente en unos momentos." : "Revisa el código completo e intenta de nuevo."}</p><Link href="/reserva" className="mt-6 block rounded-xl bg-[#6d4aff] p-3 sans text-sm font-bold text-white">Volver a consultar</Link></>}
    </section>
  </main>;
}
