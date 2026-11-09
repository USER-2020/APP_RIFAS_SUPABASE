import { randomBytes, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateIntegration } from "@/lib/api/integration-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  externalPurchaseId: z.string().trim().min(1).max(180),
  externalUserId: z.string().trim().min(1).max(180).optional().nullable(),
  allowedNumbers: z.number().int().min(1).max(100),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  customer: z.object({ name: z.string().trim().min(3).max(180), email: z.string().email().optional().nullable(), phone: z.string().trim().min(7).max(40) }),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authentication = await authenticateIntegration(request, "raffles:write");
  if ("error" in authentication) return NextResponse.json({ error: authentication.error }, { status: authentication.status });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Rifa inválida" }, { status: 400 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const data = parsed.data;
  const expiresAt = data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (expiresAt <= new Date()) return NextResponse.json({ error: "La fecha de vencimiento debe ser futura" }, { status: 400 });
  const admin = createAdminClient();
  const { data: raffle } = await admin.from("raffles").select("id,slug,title,organization_id,status,sales_close_at").eq("id", id).eq("organization_id", authentication.context.organizationId).maybeSingle();
  if (!raffle) return NextResponse.json({ error: "Rifa no encontrada para esta integración" }, { status: 404 });
  if (raffle.status !== "active" || new Date(raffle.sales_close_at) <= new Date()) return NextResponse.json({ error: "La rifa no está disponible" }, { status: 409 });
  const phoneNormalized = data.customer.phone.replace(/\D/g, "");
  const rawToken = `rfly_claim_${randomBytes(24).toString("base64url")}`;
  const { data: token, error } = await admin.from("participation_tokens").insert({ integration_id: authentication.context.integrationId, raffle_id: raffle.id, external_purchase_id: data.externalPurchaseId, external_user_id: data.externalUserId ?? null, customer_name: data.customer.name, customer_email: data.customer.email ?? null, customer_phone: data.customer.phone, customer_phone_normalized: phoneNormalized, token_prefix: rawToken.slice(0, 19), token_hash: createHash("sha256").update(rawToken).digest("hex"), allowed_numbers: data.allowedNumbers, expires_at: expiresAt.toISOString() }).select("id,allowed_numbers,expires_at").single();
  if (error || !token) return NextResponse.json({ error: error?.code === "23505" ? "Esta compra ya tiene un token de participación" : error?.message ?? "No se pudo crear el token" }, { status: error?.code === "23505" ? 409 : 400 });
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return NextResponse.json({ token: rawToken, tokenId: token.id, allowedNumbers: token.allowed_numbers, expiresAt: token.expires_at, embedUrl: `${base}/embed/rifa/${raffle.slug}?claim=${encodeURIComponent(rawToken)}` }, { status: 201 });
}
