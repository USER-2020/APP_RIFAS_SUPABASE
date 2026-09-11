import Link from "next/link";
import AdminShell from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth/require-admin";
import { money } from "@/lib/format";

export const metadata = { title: "Compradores | RIFLY Admin", robots: { index: false, follow: false } };
type Purchase = { id: string; code: string; total: number; confirmed_at: string | null; raffles: { id: string; title: string } | null; reservation_numbers: { raffle_numbers: { number: number } | null }[] };
type Buyer = { id: string; name: string; phone: string; reservations: Purchase[] };

export default async function BuyersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { supabase } = await requireAdmin();
  const query = await searchParams;
  const search = (query.q ?? "").replace(/[^\p{L}\p{N} +\-]/gu, "").trim().slice(0, 80);
  const rawPage = Number(query.page ?? 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 100000) : 1;
  let request = supabase.from("customers").select("id,name,phone,reservations!reservations_customer_id_fkey!inner(id,code,total,confirmed_at,raffles!reservations_raffle_id_fkey(id,title),reservation_numbers(raffle_numbers(number)))", { count: "exact" }).eq("reservations.status", "confirmed");
  if (search) {
    const digits = search.replace(/\D/g, "");
    request = request.or(`name.ilike.%${search}%,phone.ilike.%${search}%${digits ? `,phone_normalized.ilike.%${digits}%` : ""}`);
  }
  const { data, count, error } = await request.order("name").order("id").range((page - 1) * 20, page * 20 - 1);
  const buyers = (data ?? []) as unknown as Buyer[];
  const pageUrl = (value: number) => `/admin/compradores?${new URLSearchParams({ q: search, page: String(value) })}`;
  return <AdminShell><section className="mx-auto max-w-6xl px-5 py-8 md:px-8">
    <h2 className="text-4xl font-bold tracking-[-.06em]">Compradores.</h2>
    <p className="mt-3 sans text-sm text-slate-500">Clientes con pagos confirmados y sus números asociados a cada rifa.</p>
    <form className="mt-7 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 sans">
      <label className="min-w-48 flex-1 text-sm font-bold">Nombre o WhatsApp<input name="q" defaultValue={search} maxLength={80} placeholder="Buscar comprador" className="mt-2 block w-full rounded-xl border border-slate-200 p-3" /></label>
      <button className="rounded-xl bg-[#6d4aff] px-5 py-3 text-sm font-bold text-white">Buscar</button><Link href="/admin/compradores" className="px-3 py-3 text-sm text-slate-500">Limpiar</Link>
    </form>
    {error ? <p role="alert" className="mt-6 rounded-xl bg-red-50 p-5 sans text-red-700">No pudimos cargar los compradores. Actualiza la página para intentar nuevamente.</p> : <>
      <p className="mt-5 sans text-sm text-slate-500">{count ?? 0} compradores encontrados</p>
      <div className="mt-4 space-y-5">{buyers.map((buyer) => {
        const groups = new Map<string, { title: string; purchases: Purchase[] }>();
        for (const purchase of buyer.reservations) {
          const key = purchase.raffles?.id ?? "unknown";
          const group = groups.get(key) ?? { title: purchase.raffles?.title ?? "Rifa", purchases: [] };
          group.purchases.push(purchase); groups.set(key, group);
        }
        const total = buyer.reservations.reduce((sum, purchase) => sum + Number(purchase.total), 0);
        const quantity = buyer.reservations.reduce((sum, purchase) => sum + purchase.reservation_numbers.length, 0);
        return <article key={buyer.id} className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-2xl font-bold">{buyer.name}</h3><a href={`https://wa.me/${buyer.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="mt-2 inline-block sans text-sm text-emerald-700 underline">{buyer.phone}</a></div><div className="sans text-sm sm:text-right"><p className="font-bold text-emerald-700">{quantity} números confirmados</p><p className="mt-1 text-slate-500">Total pagado: <strong className="text-slate-900">{money(total)}</strong></p></div></div>
          <div className="mt-5 space-y-4">{Array.from(groups, ([id, group]) => <section key={id} className="rounded-xl bg-slate-50 p-4"><h4 className="font-bold">{group.title}</h4><div className="mt-3 space-y-4">{group.purchases.map((purchase) => <div key={purchase.id} className="sans text-sm"><div className="flex flex-wrap justify-between gap-2"><Link href={`/admin/reservas?status=confirmed&code=${purchase.code}`} className="font-bold text-[#6d4aff]">{purchase.code} ↗</Link><span className="text-slate-500">{money(purchase.total)}{purchase.confirmed_at && ` · ${new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" }).format(new Date(purchase.confirmed_at))}`}</span></div><div className="mt-2 flex flex-wrap gap-2">{purchase.reservation_numbers.flatMap((item) => item.raffle_numbers ? [item.raffle_numbers.number] : []).sort((a, b) => a - b).map((number) => <span key={number} className="rounded-lg bg-emerald-100 px-3 py-2 font-bold text-emerald-800">{String(number).padStart(2, "0")}</span>)}</div></div>)}</div></section>)}</div>
        </article>;
      })}</div>
      {!buyers.length && <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-10 text-center sans"><p className="text-slate-500">No hay compradores con pagos confirmados para esta búsqueda.</p><Link href="/admin/reservas" className="mt-4 inline-block text-sm font-bold text-[#6d4aff]">Revisar reservas pendientes</Link></div>}
      <nav aria-label="Páginas de compradores" className="mt-6 flex items-center justify-between sans text-sm">{page > 1 ? <Link href={pageUrl(page - 1)} className="rounded-xl border p-3">Anterior</Link> : <span />}<span>Página {page}</span>{page * 20 < (count ?? 0) ? <Link href={pageUrl(page + 1)} className="rounded-xl border p-3">Siguiente</Link> : <span />}</nav>
    </>}
  </section></AdminShell>;
}
