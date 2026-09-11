"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { money } from "@/lib/demo";

const schema = z.object({ name: z.string().min(3, "Escribe tu nombre completo"), phone: z.string().min(7, "Escribe un WhatsApp válido") });
type FormValues = z.infer<typeof schema>;

export default function ReservationForm({ raffleId, raffleTitle, numbers }: { raffleId: string; raffleTitle: string; numbers: number[] }) {
  const [result, setResult] = useState<{ code: string; total: number } | null>(null);
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const submit = async (values: FormValues) => { setError(""); const { data, error: rpcError } = await createClient().rpc("create_reservation", { p_raffle_id: raffleId, p_customer_name: values.name, p_customer_phone: values.phone, p_selected_numbers: numbers }); if (rpcError) { setError(rpcError.message.includes("disponible") ? "Uno de tus números acaba de ser reservado. Elige otro." : "No pudimos crear la reserva. Intenta de nuevo."); return; } setResult({ code: data.reservation_code, total: data.total }); };
  if (result) { const message = encodeURIComponent(`Hola! Quiero participar en ${raffleTitle}. Mi código de reserva es ${result.code}. Números: ${numbers.join(", ")}. Total: ${money(result.total)}.`); return <div className="rounded-3xl bg-[#dff8ed] p-6 sans"><p className="text-xs font-bold uppercase tracking-[.15em] text-emerald-700">reserva creada</p><h3 className="mt-2 text-3xl font-bold text-[#101828]">Tu reserva está lista.</h3><p className="mt-3 text-sm text-emerald-900">Código <strong>{result.code}</strong> · Total {money(result.total)}</p><a href={`https://wa.me/?text=${message}`} target="_blank" rel="noreferrer" className="mt-6 block rounded-xl bg-[#128c55] px-4 py-3 text-center text-sm font-bold text-white">Continuar por WhatsApp</a></div>; }
  return <form onSubmit={handleSubmit(submit)} className="space-y-4"><div><label htmlFor="name" className="sans mb-1.5 block text-sm font-bold">Nombre completo</label><input id="name" {...register("name")} placeholder="Ej. Juan Pérez" className="sans w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#6d4aff] focus:ring-2 focus:ring-[#6d4aff22]" />{errors.name && <p className="sans mt-1 text-xs text-red-600">{errors.name.message}</p>}</div><div><label htmlFor="phone" className="sans mb-1.5 block text-sm font-bold">Número de WhatsApp</label><input id="phone" {...register("phone")} inputMode="tel" placeholder="3001234567" className="sans w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#6d4aff] focus:ring-2 focus:ring-[#6d4aff22]" />{errors.phone && <p className="sans mt-1 text-xs text-red-600">{errors.phone.message}</p>}</div>{error && <p className="rounded-xl bg-red-50 p-3 sans text-sm text-red-700">{error}</p>}<button disabled={isSubmitting} className="w-full rounded-xl bg-[#6d4aff] px-4 py-3.5 sans text-sm font-bold text-white disabled:opacity-50">{isSubmitting ? "Creando reserva..." : "Reservar números"}</button><p className="sans text-center text-xs text-slate-400">Solo usaremos tus datos para gestionar esta reserva.</p></form>;
}