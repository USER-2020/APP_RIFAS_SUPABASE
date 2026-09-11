"use client";
import LoadingButton from "@/components/loading-button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminReservationActions({ id, code, overdue }: { id: string; code: string; overdue: boolean }) {
  const router = useRouter();
  const [action, setAction] = useState<"confirm" | "release" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/reservations/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error ?? "No pudimos actualizar la reserva"); return; }
      setDone(action === "confirm" ? "Reserva confirmada." : "Reserva rechazada. Números liberados.");
      setAction(null); router.refresh();
    } catch { setError("No pudimos conectar. Revisa tu conexión e intenta nuevamente."); }
    finally { setBusy(false); }
  }
  if (done) return <p role="status" className="text-sm font-bold text-emerald-700">{done}</p>;
  return <div className="sans">
    {action ? <form onSubmit={submit} className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm font-bold">{action === "confirm" ? `Confirmar pago de ${code}` : `Rechazar y liberar ${code}`}</p>
      <p className="mt-2 text-sm text-slate-600">{action === "confirm" ? "Confirma únicamente si verificaste el pago. Los números quedarán confirmados." : "La reserva quedará rechazada y sus números volverán a estar disponibles."}</p>
      {action === "release" && <label className="mt-3 block text-sm">Motivo (opcional)<textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} disabled={busy} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2" /></label>}
      <div className="mt-4 flex flex-wrap gap-3"><LoadingButton loading={busy} disabled={busy} className="rounded-xl bg-[#101828] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Guardando..." : action === "confirm" ? "Sí, confirmar pago" : "Sí, liberar números"}</LoadingButton><button type="button" disabled={busy} onClick={() => { setAction(null); setError(""); }} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">Cancelar</button></div>
    </form> : <div className="flex flex-wrap gap-3"><button disabled={overdue} onClick={() => setAction("confirm")} className="rounded-xl bg-[#128c55] px-4 py-3 text-sm font-bold text-white disabled:opacity-40">Confirmar pago</button><button onClick={() => setAction("release")} className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-bold text-rose-700">Rechazar y liberar</button></div>}
    {overdue && !action && <p className="mt-2 text-xs text-amber-700">El plazo venció. Puedes liberar los números.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </div>;
}
