"use client";
import LoadingButton from "@/components/loading-button";
import Link from "@/components/loading-link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { money } from "@/lib/format";
import PhoneField from "@/components/phone-field";

const schema = z.object({ name: z.string().min(3, "Escribe tu nombre completo"), phone: z.string().min(7, "Escribe un WhatsApp válido") });
type FormValues = z.infer<typeof schema>;

export default function ReservationForm({ raffleId, raffleTitle, numbers }: { raffleId: string; raffleTitle: string; numbers: number[] }) {
  const [result, setResult] = useState<{ code: string; total: number; whatsappNumber: string } | null>(null);
  const [error, setError] = useState("");
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { phone: "57" } });
  const submit = async (values: FormValues) => { try { setError(""); const { data, error: rpcError } = await createClient().rpc("create_reservation", { p_raffle_id: raffleId, p_customer_name: values.name, p_customer_phone: values.phone, p_selected_numbers: numbers }); if (rpcError) { setError(rpcError.message.includes("disponible") ? "Uno de tus números acaba de ser reservado. Elige otro." : rpcError.message); return; } setResult({ code: data.reservation_code, total: data.total, whatsappNumber: (data.whatsapp_number ?? "").replace(/\D/g, "") }); } catch { setError("No pudimos conectar. Consulta tu reserva antes de intentar nuevamente."); } };
  if (result) { const message = encodeURIComponent(`¡Hola! Quiero participar en *${raffleTitle}*.\n\n*Datos de mi reserva*\n    • *Código:* ${result.code}\n    • *Números:* ${numbers.join(", ")}\n    • *Total:* ${money(result.total)}`); return <div className="rounded-3xl bg-[#dff8ed] p-6 text-center sans"><p className="text-xs font-bold uppercase tracking-[.15em] text-emerald-700">reserva creada</p><h3 className="mt-2 text-3xl font-bold text-[#101828]">Tu reserva está lista.</h3><p className="mt-3 text-sm text-emerald-900">Código <strong>{result.code}</strong> · Total {money(result.total)}</p>{result.whatsappNumber ? <a href={`https://wa.me/${result.whatsappNumber}?text=${message}`} target="_blank" rel="noreferrer" className="mt-6 block rounded-xl bg-[#128c55] px-4 py-3 text-center text-sm font-bold text-white">Continuar por WhatsApp</a> : <p className="mt-6 text-sm text-emerald-900">Esta rifa no tiene un WhatsApp de contacto configurado. Conserva tu código de reserva para comunicarte con el organizador.</p>}<Link href={`/reserva/${result.code}`} className="mt-4 block text-sm font-bold text-[#128c55] underline underline-offset-4">Verificar mi reserva</Link></div>; }
  return <form onSubmit={handleSubmit(submit)} className="space-y-4 text-left"><div><label htmlFor="name" className="sans mb-1.5 block text-sm font-bold">Nombre completo</label><input id="name" {...register("name")} placeholder="Ej. Juan Pérez" className="sans w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#6d4aff] focus:ring-2 focus:ring-[#6d4aff22]" />{errors.name && <p className="sans mt-1 text-xs text-red-600">{errors.name.message}</p>}</div><Controller name="phone" control={control} render={({ field }) => <PhoneField name="phone" label="Número de WhatsApp" value={field.value} onChange={field.onChange} required error={errors.phone?.message} />} />{error && <p className="rounded-xl bg-red-50 p-3 sans text-sm text-red-700">{error}</p>}<LoadingButton loading={isSubmitting} disabled={isSubmitting} className="w-full rounded-xl bg-[#6d4aff] px-4 py-3.5 sans text-sm font-bold text-white disabled:opacity-50">{isSubmitting ? "Creando reserva..." : "Reservar números"}</LoadingButton><p className="sans text-center text-xs text-slate-400">Solo usaremos tus datos para gestionar esta reserva.</p></form>;
}
