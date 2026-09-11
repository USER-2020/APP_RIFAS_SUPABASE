import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const raffleSchema = z.object({
  title: z.string().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa minúsculas, números y guiones"),
  description: z.string().min(10),
  prizeName: z.string().min(2),
  pricePerNumber: z.coerce.number().positive(),
  numberStart: z.coerce.number().int().min(0),
  numberEnd: z.coerce.number().int(),
  salesCloseAt: z.string().min(1),
  drawAt: z.string().min(1),
  drawMethod: z.string().min(2),
  whatsappNumber: z.string().optional(),
  paymentInstructions: z.string().optional(),
  reservationMinutes: z.coerce.number().int().min(1).max(1440),
  status: z.enum(["draft", "active"]),
  image: z.instanceof(File).refine((file) => file.size <= 5 * 1024 * 1024, "La imagen no puede superar 5 MB").refine((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type), "Usa JPG, PNG o WebP"),
}).refine((data) => data.numberEnd >= data.numberStart, { message: "El número final debe ser mayor o igual al inicial", path: ["numberEnd"] });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const formData = await request.formData();
  const parsed = raffleSchema.safeParse({
    title: formData.get("title"), slug: formData.get("slug"), description: formData.get("description"), prizeName: formData.get("prizeName"),
    pricePerNumber: formData.get("pricePerNumber"), numberStart: formData.get("numberStart"), numberEnd: formData.get("numberEnd"), salesCloseAt: formData.get("salesCloseAt"), drawAt: formData.get("drawAt"), drawMethod: formData.get("drawMethod"), whatsappNumber: formData.get("whatsappNumber"), paymentInstructions: formData.get("paymentInstructions"), reservationMinutes: formData.get("reservationMinutes"), status: formData.get("status"), image: formData.get("image"),
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const values = parsed.data;
  const { data: raffleId, error } = await supabase.rpc("create_raffle", {
    p_title: values.title, p_slug: values.slug, p_description: values.description, p_prize_name: values.prizeName,
    p_price_per_number: values.pricePerNumber, p_number_start: values.numberStart, p_number_end: values.numberEnd,
    p_sales_close_at: new Date(values.salesCloseAt).toISOString(), p_draw_at: new Date(values.drawAt).toISOString(),
    p_draw_method: values.drawMethod, p_whatsapp_number: values.whatsappNumber ?? null, p_payment_instructions: values.paymentInstructions ?? null,
    p_reservation_minutes: values.reservationMinutes, p_status: values.status,
  });
  if (error || !raffleId) return NextResponse.json({ error: error?.message ?? "No se pudo crear la rifa" }, { status: 400 });
  const extension = values.image.type.split("/")[1].replace("jpeg", "jpg");
  const imagePath = `${raffleId}/cover.${extension}`;
  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage.from("raffles").upload(imagePath, values.image, { contentType: values.image.type, upsert: true });
  if (uploadError) { await admin.from("raffles").delete().eq("id", raffleId); return NextResponse.json({ error: `No se pudo subir la portada: ${uploadError.message}` }, { status: 400 }); }
  const { error: imageError } = await admin.from("raffles").update({ image_path: imagePath }).eq("id", raffleId);
  if (imageError) return NextResponse.json({ error: imageError.message }, { status: 500 });
  return NextResponse.json({ id: raffleId });
}