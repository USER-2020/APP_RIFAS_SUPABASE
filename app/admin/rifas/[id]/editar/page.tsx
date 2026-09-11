import Link from "@/components/loading-link";
import { ArrowLeft, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import RaffleEditForm from "@/components/raffle-edit-form";

export const metadata = { title: "Editar rifa", robots: { index: false, follow: false } };
export default async function EditRafflePage({ params }: { params: Promise<{ id: string }> }) { const { supabase } = await requireAdmin(); const { id } = await params; const { data: raffle } = await supabase.from("raffles").select("id,title,slug,description,prize_name,price_per_number,number_start,number_end,sales_close_at,draw_at,draw_method,whatsapp_number,payment_instructions,reservation_minutes,status,image_path").eq("id", id).single(); if (!raffle) notFound(); return <main className="min-h-screen bg-[#f6f7fb] px-4 py-6 md:px-8"><header className="mx-auto mb-6 flex max-w-3xl items-center justify-between"><Link href={`/admin/rifas/${id}`} className="inline-flex items-center gap-2 sans text-sm font-bold text-slate-500"><ArrowLeft className="h-4 w-4" /> Rifa</Link><Pencil className="h-5 w-5 text-[#6d4aff]" /></header><section className="mx-auto max-w-3xl"><h1 className="text-5xl font-bold tracking-[-.07em]">Editar rifa.</h1><p className="mt-3 sans text-slate-500">Actualiza la información pública sin afectar sus reservas.</p><div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 md:p-8"><RaffleEditForm raffle={raffle} /></div></section></main>; }
