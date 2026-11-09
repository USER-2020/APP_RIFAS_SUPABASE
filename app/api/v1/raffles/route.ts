import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateIntegration } from "@/lib/api/integration-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(10).max(5000),
  prizeName: z.string().trim().min(2).max(200),
  pricePerNumber: z.number().positive(),
  numberStart: z.number().int().min(0),
  numberEnd: z.number().int(),
  salesCloseAt: z.string().datetime({ offset: true }),
  drawAt: z.string().datetime({ offset: true }),
  drawMethod: z.string().trim().min(2).max(120),
  whatsappNumber: z.string().trim().optional().nullable(),
  paymentInstructions: z.string().trim().max(2000).optional().nullable(),
  reservationMinutes: z.number().int().min(1).max(1440).default(15),
  status: z.enum(["draft", "active"]).default("draft"),
}).superRefine((data, ctx) => {
  if (data.numberEnd < data.numberStart) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["numberEnd"], message: "El número final debe ser mayor o igual al inicial" });
  if (new Date(data.drawAt) <= new Date(data.salesCloseAt)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["drawAt"], message: "El sorteo debe ser posterior al cierre de ventas" });
});

export async function POST(request: Request) {
  const authentication = await authenticateIntegration(request, "raffles:write");
  if ("error" in authentication) return NextResponse.json({ error: authentication.error }, { status: authentication.status });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });

  const raffle = parsed.data;
  const { data: raffleId, error } = await createAdminClient().rpc("create_raffle_for_integration", {
    p_organization_id: authentication.context.organizationId,
    p_title: raffle.title,
    p_slug: raffle.slug,
    p_description: raffle.description,
    p_prize_name: raffle.prizeName,
    p_price_per_number: raffle.pricePerNumber,
    p_number_start: raffle.numberStart,
    p_number_end: raffle.numberEnd,
    p_sales_close_at: new Date(raffle.salesCloseAt).toISOString(),
    p_draw_at: new Date(raffle.drawAt).toISOString(),
    p_draw_method: raffle.drawMethod,
    p_whatsapp_number: raffle.whatsappNumber ?? null,
    p_payment_instructions: raffle.paymentInstructions ?? null,
    p_reservation_minutes: raffle.reservationMinutes,
    p_status: raffle.status,
  });

  if (error || !raffleId) return NextResponse.json({ error: error?.message ?? "No se pudo crear la rifa" }, { status: 400 });
  return NextResponse.json({ id: raffleId, organizationId: authentication.context.organizationId, slug: raffle.slug, publicUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/rifa/${raffle.slug}` }, { status: 201 });
}
