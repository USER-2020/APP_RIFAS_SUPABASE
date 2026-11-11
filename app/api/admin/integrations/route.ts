import { randomBytes, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  consumerName: z.string().trim().min(2).max(120),
  consumerEmail: z.string().email(),
  name: z.string().trim().min(2).max(120),
  providerKey: z.string().trim().regex(/^[a-z0-9][a-z0-9_-]{1,63}$/),
  organizationName: z.string().trim().min(2).max(120),
  organizationSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  scopes: z.array(z.enum(["raffles:read", "raffles:write"])).min(1).default(["raffles:read", "raffles:write"]),
  expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export async function POST(request: Request) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { data: profile } = await session.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });

  const admin = createAdminClient();
  const { data: consumer, error: consumerError } = await admin
    .from("api_consumers")
    .insert({ name: parsed.data.consumerName, email: parsed.data.consumerEmail, created_by: user.id })
    .select("id")
    .single();
  if (consumerError || !consumer) return NextResponse.json({ error: consumerError?.message ?? "No se pudo crear el usuario de API" }, { status: 400 });
  const { data: organization, error: organizationError } = await admin
    .from("organizations")
    .insert({ name: parsed.data.organizationName, slug: parsed.data.organizationSlug, created_by: user.id })
    .select("id")
    .single();
  if (organizationError || !organization) { await admin.from("api_consumers").delete().eq("id", consumer.id); return NextResponse.json({ error: organizationError?.message ?? "No se pudo crear la organización" }, { status: 400 }); }

  const { data: integration, error: integrationError } = await admin
    .from("integrations")
    .insert({ api_consumer_id: consumer.id, organization_id: organization.id, name: parsed.data.name, provider_key: parsed.data.providerKey, created_by: user.id })
    .select("id,provider_key")
    .single();
  if (integrationError || !integration) {
    await admin.from("organizations").delete().eq("id", organization.id); await admin.from("api_consumers").delete().eq("id", consumer.id);
    return NextResponse.json({ error: integrationError?.message ?? "No se pudo crear la integración" }, { status: 400 });
  }

  // Keep the token alphabet compatible with integration_token_prefix_check.
  const rawToken = `rfly_live_${randomBytes(24).toString("hex")}`;
  const tokenPrefix = rawToken.slice(0, 18);
  const { error: tokenError } = await admin.from("integration_tokens").insert({
    integration_id: integration.id,
    token_prefix: tokenPrefix,
    token_hash: createHash("sha256").update(rawToken).digest("hex"),
    scopes: parsed.data.scopes,
    expires_at: parsed.data.expiresAt ?? null,
  });
  if (tokenError) {
    await admin.from("integrations").delete().eq("id", integration.id); await admin.from("api_consumers").delete().eq("id", consumer.id);
    return NextResponse.json({ error: tokenError.message }, { status: 400 });
  }

  return NextResponse.json({ consumerId: consumer.id, integrationId: integration.id, organizationId: organization.id, providerKey: integration.provider_key, token: rawToken, warning: "Guarda este token ahora. No volverá a mostrarse." }, { status: 201 });
}
