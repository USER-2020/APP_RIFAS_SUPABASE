import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateIntegration } from "@/lib/api/integration-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const updateSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  prizeName: z.string().trim().min(2).max(200).optional(),
  pricePerNumber: z.number().positive().optional(),
  salesCloseAt: z.string().datetime({ offset: true }).optional(),
  drawAt: z.string().datetime({ offset: true }).optional(),
  drawMethod: z.string().trim().min(2).max(120).optional(),
  whatsappNumber: z.string().trim().max(40).optional().nullable(),
  paymentInstructions: z.string().trim().max(2000).optional().nullable(),
  reservationMinutes: z.number().int().min(1).max(1440).optional(),
  status: z.enum(["draft", "active", "closed", "finished"]).optional(),
}).refine(value => Object.keys(value).length > 0, { message: "Envía al menos un campo para actualizar" });

async function getRaffleId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return z.string().uuid().safeParse(id).success ? id : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authentication = await authenticateIntegration(request, "raffles:read");
  if ("error" in authentication) return NextResponse.json({ error: authentication.error }, { status: authentication.status });
  const id = await getRaffleId(params);
  if (!id) return NextResponse.json({ error: "Rifa inválida" }, { status: 400 });

  const { data: raffle, error } = await createAdminClient()
    .from("raffles")
    .select("id,title,slug,description,prize_name,price_per_number,number_start,number_end,sales_close_at,draw_at,draw_method,whatsapp_number,payment_instructions,reservation_minutes,status,image_path,is_featured,organization_id,created_at,updated_at")
    .eq("id", id)
    .eq("organization_id", authentication.context.organizationId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!raffle) return NextResponse.json({ error: "Rifa no encontrada para esta integración" }, { status: 404 });
  return NextResponse.json({ raffle });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authentication = await authenticateIntegration(request, "raffles:write");
  if ("error" in authentication) return NextResponse.json({ error: authentication.error }, { status: authentication.status });
  const id = await getRaffleId(params);
  if (!id) return NextResponse.json({ error: "Rifa inválida" }, { status: 400 });

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });

  const admin = createAdminClient();
  const { data: current, error: currentError } = await admin
    .from("raffles")
    .select("id,slug,title,description,prize_name,price_per_number,sales_close_at,draw_at,draw_method,whatsapp_number,payment_instructions,reservation_minutes,status,organization_id")
    .eq("id", id)
    .eq("organization_id", authentication.context.organizationId)
    .maybeSingle();
  if (currentError) return NextResponse.json({ error: currentError.message }, { status: 400 });
  if (!current) return NextResponse.json({ error: "Rifa no encontrada para esta integración" }, { status: 404 });

  const values = parsed.data;
  const salesCloseAt = values.salesCloseAt ?? current.sales_close_at;
  const drawAt = values.drawAt ?? current.draw_at;
  if (new Date(drawAt) <= new Date(salesCloseAt)) return NextResponse.json({ error: "El sorteo debe ser posterior al cierre de ventas" }, { status: 400 });

  const { data: raffle, error } = await admin.from("raffles").update({
    title: values.title ?? current.title,
    slug: values.slug ?? current.slug,
    description: values.description ?? current.description,
    prize_name: values.prizeName ?? current.prize_name,
    price_per_number: values.pricePerNumber ?? current.price_per_number,
    sales_close_at: new Date(salesCloseAt).toISOString(),
    draw_at: new Date(drawAt).toISOString(),
    draw_method: values.drawMethod ?? current.draw_method,
    whatsapp_number: values.whatsappNumber === undefined ? current.whatsapp_number : values.whatsappNumber || null,
    payment_instructions: values.paymentInstructions === undefined ? current.payment_instructions : values.paymentInstructions || null,
    reservation_minutes: values.reservationMinutes ?? current.reservation_minutes,
    status: values.status ?? current.status,
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("organization_id", authentication.context.organizationId).select("id,title,slug,status,organization_id,updated_at").single();

  if (error) return NextResponse.json({ error: error.code === "23505" ? "El slug ya está en uso" : error.message }, { status: error.code === "23505" ? 409 : 400 });
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return NextResponse.json({ ...raffle, publicUrl: `${base}/rifa/${raffle.slug}` });
}
