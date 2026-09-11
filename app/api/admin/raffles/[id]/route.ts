import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ title: z.string().min(2).max(120), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().min(10), prizeName: z.string().min(2), pricePerNumber: z.coerce.number().positive(), salesCloseAt: z.string().min(1), drawAt: z.string().min(1), drawMethod: z.string().min(2), whatsappNumber: z.string().optional(), paymentInstructions: z.string().optional(), reservationMinutes: z.coerce.number().int().min(1).max(1440), status: z.enum(["draft", "active", "closed", "finished"]), image: z.instanceof(File).optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); const { id } = await params;
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single(); if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const form = await request.formData(); const parsed = schema.safeParse(Object.fromEntries(form.entries())); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const values = parsed.data; const { error } = await supabase.from("raffles").update({ title: values.title, slug: values.slug, description: values.description, prize_name: values.prizeName, price_per_number: values.pricePerNumber, sales_close_at: new Date(values.salesCloseAt).toISOString(), draw_at: new Date(values.drawAt).toISOString(), draw_method: values.drawMethod, whatsapp_number: values.whatsappNumber || null, payment_instructions: values.paymentInstructions || null, reservation_minutes: values.reservationMinutes, status: values.status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (values.image instanceof File && values.image.size > 0) { const extension = values.image.type.split("/")[1].replace("jpeg", "jpg"); const path = `${id}/cover.${extension}`; const admin = createAdminClient(); const upload = await admin.storage.from("raffles").upload(path, values.image, { contentType: values.image.type, upsert: true }); if (upload.error) return NextResponse.json({ error: upload.error.message }, { status: 400 }); await admin.from("raffles").update({ image_path: path, updated_at: new Date().toISOString() }).eq("id", id); }
  return NextResponse.json({ id });
}