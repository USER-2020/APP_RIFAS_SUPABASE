import Link from "next/link";
import AdminShell from "@/components/admin-shell";
import AdminReservationActions from "@/components/admin-reservation-actions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { money } from "@/lib/format";

export const metadata = { title: "Reservas | RIFLY Admin", robots: { index: false, follow: false } };
const states: Record<string, string> = { pending: "Pendientes", confirmed: "Confirmadas", rejected: "Rechazadas", expired: "Vencidas", cancelled: "Canceladas", all: "Todas" };
type Reservation = { id: string; code: string; status: string; total: number; reserved_until: string; rejection_reason: string | null; customers: { name: string; phone: string } | null; raffles: { title: string } | null; reservation_numbers: { raffle_numbers: { number: number } | null }[] };
const dateTime = (value: string) => new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(value));

export default async function AdminReservationsPage({ searchParams }: { searchParams: Promise<{ status?: string; code?: string; page?: string }> }) {
  const { supabase } = await requireAdmin();
  const query = await searchParams;
  const status = Object.hasOwn(states, query.status ?? "") ? query.status! : "pending";
  const code = (query.code ?? "").trim().toUpperCase().slice(0, 40);
  const parsedPage = Number(query.page ?? 1);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 100000) : 1;
  let request = supabase.from("reservations").select("id,code,status,total,reserved_until,rejection_reason,customers!reservations_customer_id_fkey(name,phone),raffles!reservations_raffle_id_fkey(title),reservation_numbers(raffle_numbers(number))", { count: "exact" });
  if (status !== "all") request = request.eq("status", status);
  if (code) request = request.eq("code", code);
  const { data, count, error } = await request.order("created_at", { ascending: false }).order("id").range((page - 1) * 20, page * 20 - 1);
  const reservations = (data ?? []) as unknown as Reservation[];
  const now = new Date().getTime();
  const pageUrl = (value: number) => `/admin/reservas?${new URLSearchParams({ status, code, page: String(value) })}`;
  return <AdminShell><section className="mx-auto max-w-6xl px-5 py-8 md:px-8">
    <h2 className="text-4xl font-bold tracking-[-.06em]">Reservas.</h2><p className="mt-3 sans text-sm text-slate-500">Valida los pagos, confirma las reservas o libera sus números.</p>
    <form className="mt-7 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 sans">
      <label className="min-w-48 flex-1 text-sm font-bold">Código de reserva<input name="code" defaultValue={code} placeholder="RF-043B3A" maxLength={40} className="mt-2 block w-full rounded-xl border border-slate-200 p-3 uppercase" /></label>
      <label className="text-sm font-bold">Estado<select name="status" defaultValue={status} className="mt-2 block rounded-xl border border-slate-200 bg-white p-3">{Object.entries(states).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button className="rounded-xl bg-[#6d4aff] px-5 py-3 text-sm font-bold text-white">Buscar</button><Link href="/admin/reservas" className="px-3 py-3 text-sm text-slate-500">Limpiar</Link>
    </form>
    {error ? <p role="alert" className="mt-6 rounded-xl bg-red-50 p-5 sans text-red-700">No pudimos cargar las reservas. Actualiza la página para intentar nuevamente.</p> : <>
      <p className="mt-5 sans text-sm text-slate-500">{count ?? 0} reservas encontradas · Horarios de Colombia</p>
      <div className="mt-4 space-y-4">{reservations.map((reservation) => {
        const overdue = reservation.status === "pending" && new Date(reservation.reserved_until).getTime() <= now;
        const numbers = reservation.reservation_numbers.flatMap((item) => item.raffle_numbers ? [item.raffle_numbers.number] : []).sort((a, b) => a - b);
        const phone = reservation.customers?.phone.replace(/\D/g, "");
        return <article key={reservation.id} className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><Link href={`/reserva/${reservation.code}`} className="sans font-bold text-[#6d4aff]">{reservation.code} ↗</Link><span className={`rounded-full px-3 py-1 sans text-xs font-bold ${reservation.status === "confirmed" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{overdue ? "Pendiente · plazo vencido" : states[reservation.status]}</span></div>
          <h3 className="mt-3 text-2xl font-bold">{reservation.raffles?.title ?? "Rifa"}</h3>
          <dl className="mt-4 grid gap-4 sans text-sm sm:grid-cols-2 lg:grid-cols-4"><div><dt className="text-slate-500">Cliente</dt><dd className="mt-1 break-words font-bold">{reservation.customers?.name ?? "Sin datos"}</dd>{phone && <dd className="mt-1"><a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="text-emerald-700 underline">{reservation.customers?.phone}</a></dd>}</div><div><dt className="text-slate-500">Números</dt><dd className="mt-1 font-bold">{numbers.map((n) => String(n).padStart(2, "0")).join(", ")}</dd></div><div><dt className="text-slate-500">Total</dt><dd className="mt-1 font-bold">{money(reservation.total)}</dd></div><div><dt className="text-slate-500">Plazo de confirmación</dt><dd className="mt-1">{dateTime(reservation.reserved_until)}</dd></div></dl>
          {reservation.rejection_reason && <p className="mt-4 sans text-sm text-slate-600">Motivo: {reservation.rejection_reason}</p>}
          {reservation.status === "pending" && <div className="mt-5 border-t border-slate-100 pt-5"><AdminReservationActions id={reservation.id} code={reservation.code} overdue={overdue} /></div>}
        </article>;
      })}</div>
      {!reservations.length && <p className="mt-5 rounded-2xl border border-dashed border-slate-300 p-10 text-center sans text-slate-500">No hay reservas con estos filtros.</p>}
      <nav aria-label="Páginas de reservas" className="mt-6 flex items-center justify-between sans text-sm">{page > 1 ? <Link href={pageUrl(page - 1)} className="rounded-xl border p-3">Anterior</Link> : <span />}<span>Página {page}</span>{page * 20 < (count ?? 0) ? <Link href={pageUrl(page + 1)} className="rounded-xl border p-3">Siguiente</Link> : <span />}</nav>
    </>}
  </section></AdminShell>;
}
