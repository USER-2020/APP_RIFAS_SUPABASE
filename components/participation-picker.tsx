"use client";
import { useState } from "react";
import LoadingButton from "@/components/loading-button";

type NumberItem = { number: number; status: string };
export default function ParticipationPicker({ claimToken, maxNumbers, numbers }: { claimToken: string; maxNumbers: number; numbers: NumberItem[] }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ reservation_code: string; numbers: number[] } | null>(null);
  const [error, setError] = useState("");
  const toggle = (number: number) => setSelected((current) => current.includes(number) ? current.filter((item) => item !== number) : current.length >= maxNumbers ? current : [...current, number]);
  async function redeem() {
    if (loading || selected.length === 0) return; setLoading(true); setError("");
    try { const response = await fetch("/api/embed/participations/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: claimToken, selectedNumbers: selected }) }); const data = await response.json(); if (!response.ok) { setError(data.error ?? "No pudimos confirmar tus números."); return; } setResult(data); } catch { setError("No pudimos conectar. Intenta nuevamente."); } finally { setLoading(false); }
  }
  if (result) return <div className="mt-7 rounded-2xl bg-[#dff8ed] p-5 text-center sans"><p className="text-xs font-bold uppercase tracking-[.14em] text-emerald-700">Participación confirmada</p><h2 className="mt-2 text-2xl font-bold">Tus números ya están tomados.</h2><p className="mt-3 text-sm text-emerald-900">Código de referencia: <strong>{result.reservation_code}</strong></p><div className="mt-4 flex flex-wrap justify-center gap-2">{result.numbers.map((number) => <span key={number} className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#5a38e8]">{String(number).padStart(2, "0")}</span>)}</div></div>;
  return <div className="mt-7"><div className="grid grid-cols-5 gap-2 sm:grid-cols-10">{numbers.map(({ number, status }) => { const disabled = status !== "available" || (!selected.includes(number) && selected.length >= maxNumbers); return <button type="button" key={number} disabled={disabled} onClick={() => toggle(number)} className={`aspect-square rounded-xl border text-sm font-bold transition ${selected.includes(number) ? "border-[#6d4aff] bg-[#6d4aff] text-white" : status !== "available" ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400" : "border-slate-200 bg-white text-slate-600 hover:border-[#6d4aff]"}`}>{String(number).padStart(numbers.length > 100 ? 3 : 2, "0")}</button>; })}</div><div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-[#101828] p-4 text-white sans"><div><p className="text-xs text-slate-400">{selected.length} de {maxNumbers} seleccionados</p><strong>Compra validada</strong></div><LoadingButton loading={loading} disabled={loading || selected.length === 0} onClick={redeem} className="rounded-xl bg-[#6d4aff] px-4 py-3 text-sm font-bold">{loading ? "Confirmando..." : "Confirmar números"}</LoadingButton></div>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 sans text-sm text-red-700">{error}</p>}</div>;
}
