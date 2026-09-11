"use client";
import LoadingButton from "@/components/loading-button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function ReservationLookupForm() {
  const router = useRouter();
  const [pending, startNavigation] = useTransition();
  const [code, setCode] = useState("");
  return <form className="mt-7 space-y-4 sans" onSubmit={(event) => {
    event.preventDefault();
    if (pending) return;
    startNavigation(() => router.push(`/reserva/${encodeURIComponent(code.trim().toUpperCase())}`));
  }}>
    <label htmlFor="reservation-code" className="block text-sm font-bold">Código de reserva</label>
    <input id="reservation-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} required pattern="[Rr][Ff]-[0-9A-Fa-f]{6}" title="Escribe el código completo, por ejemplo RF-2F1F77" placeholder="RF-2F1F77" maxLength={9} className="w-full rounded-xl border border-slate-200 p-3 text-center uppercase outline-none focus:border-[#6d4aff]" />
    <LoadingButton loading={pending} loadingText="Buscando reserva..." className="w-full rounded-xl bg-[#6d4aff] p-3 text-sm font-bold text-white">Verificar reserva</LoadingButton>
  </form>;
}
