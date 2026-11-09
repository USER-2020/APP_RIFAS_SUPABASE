import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ title: z.string().min(2).max(120), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().min(10), prizeName: z.string().min(2), pricePerNumber: z.coerce.number().positive(), numberStart: z.coerce.number().int().min(0), numberEnd: z.coerce.number().int(), salesCloseAt: z.string().min(1), drawAt: z.string().min(1), drawMethod: z.string().min(2), whatsappNumber: z.string().optional(), paymentInstructions: z.string().optional(), reservationMinutes: z.coerce.number().int().min(1).max(1440), status: z.enum(["draft", "active"]), image: z.instanceof(File).refine(file => file.size <= 5 * 1024 * 1024, "La imagen no puede superar 5 MB").refine(file => ["image/jpeg", "image/png", "image/webp"].includes(file.type), "Usa JPG, PNG o WebP") }).refine(data => data.numberEnd >= data.numberStart, { message: "El número final debe ser mayor o igual al inicial", path: ["numberEnd"] });

export async function GET() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const admin = createAdminClient();
  const { data: consumer } = await admin.from("api_consumers").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!consumer) return NextResponse.json({ raffles: [] });
  const { data: integration } = await admin.from("integrations").select("organization_id").eq("api_consumer_id", consumer.id).maybeSingle();
  if (!integration) return NextResponse.json({ raffles: [] });
  const { data: raffles, error } = await admin.from("raffles").select("id,title,slug,status,draw_at,price_per_number,organization_id").eq("organization_id", integration.organization_id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "No pudimos cargar tus rifas." }, { status: 500 });
  return NextResponse.json({ raffles: raffles ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const formData = await request.formData(); const parsed = schema.safeParse({ title: formData.get("title"), slug: formData.get("slug"), description: formData.get("description"), prizeName: formData.get("prizeName"), pricePerNumber: formData.get("pricePerNumber"), numberStart: formData.get("numberStart"), numberEnd: formData.get("numberEnd"), salesCloseAt: formData.get("salesCloseAt"), drawAt: formData.get("drawAt"), drawMethod: formData.get("drawMethod"), whatsappNumber: formData.get("whatsappNumber"), paymentInstructions: formData.get("paymentInstructions"), reservationMinutes: formData.get("reservationMinutes"), status: formData.get("status"), image: formData.get("image") });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const values = parsed.data; const admin = createAdminClient(); const { data: consumer } = await admin.from("api_consumers").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!consumer) return NextResponse.json({ error: "Primero genera tu integración API." }, { status: 403 });
  const { data: integration } = await admin.from("integrations").select("organization_id").eq("api_consumer_id", consumer.id).maybeSingle();
  if (!integration) return NextResponse.json({ error: "No encontramos tu organización." }, { status: 403 });
  const { data: raffleId, error } = await supabase.rpc("create_raffle_for_owner", { p_organization_id: integration.organization_id, p_title: values.title, p_slug: values.slug, p_description: values.description, p_prize_name: values.prizeName, p_price_per_number: values.pricePerNumber, p_number_start: values.numberStart, p_number_end: values.numberEnd, p_sales_close_at: new Date(values.salesCloseAt).toISOString(), p_draw_at: new Date(values.drawAt).toISOString(), p_draw_method: values.drawMethod, p_whatsapp_number: values.whatsappNumber ?? null, p_payment_instructions: values.paymentInstructions ?? null, p_reservation_minutes: values.reservationMinutes, p_status: values.status });
  if (error || !raffleId) return NextResponse.json({ error: error?.message ?? "No se pudo crear la rifa" }, { status: 400 });
  const image = values.image; const extension = image.type.split("/")[1].replace("jpeg", "jpg"); const imagePath = `${raffleId}/cover.${extension}`; const { error: uploadError } = await admin.storage.from("raffles").upload(imagePath, image, { contentType: image.type, upsert: true });
  if (uploadError) { await admin.from("raffles").delete().eq("id", raffleId); return NextResponse.json({ error: `No se pudo subir la portada: ${uploadError.message}` }, { status: 400 }); }
  await admin.from("raffles").update({ image_path: imagePath }).eq("id", raffleId);
  return NextResponse.json({ id: raffleId });
}
