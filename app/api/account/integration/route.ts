import { randomBytes, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ name: z.string().trim().min(2).max(120), organizationName: z.string().trim().min(2).max(120), organizationSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) });

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const admin = createAdminClient();
  const { data } = await admin.from("api_consumers").select("id,name,email,active,integrations(id,name,provider_key,active,organizations(name),integration_tokens(id,token_prefix,scopes,revoked_at,last_used_at,created_at))").eq("owner_user_id", user.id).maybeSingle();
  return NextResponse.json({ consumer: data });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const admin = createAdminClient();
  const existing = await admin.from("api_consumers").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (existing.data) return NextResponse.json({ error: "Ya tienes una cuenta API creada." }, { status: 409 });
  const { data: consumer, error: consumerError } = await admin.from("api_consumers").insert({ name: parsed.data.name, email: user.email, owner_user_id: user.id, created_by: user.id }).select("id").single();
  if (consumerError || !consumer) return NextResponse.json({ error: consumerError?.message ?? "No se pudo crear la cuenta API" }, { status: 400 });
  const { data: organization, error: organizationError } = await admin.from("organizations").insert({ name: parsed.data.organizationName, slug: parsed.data.organizationSlug, created_by: user.id }).select("id").single();
  if (organizationError || !organization) { await admin.from("api_consumers").delete().eq("id", consumer.id); return NextResponse.json({ error: organizationError?.message ?? "No se pudo crear la organización" }, { status: 400 }); }
  const providerKey = `self-${user.id.slice(0, 8)}-${randomBytes(3).toString("hex")}`;
  const { data: integration, error: integrationError } = await admin.from("integrations").insert({ api_consumer_id: consumer.id, organization_id: organization.id, name: parsed.data.name, provider_key: providerKey, created_by: user.id }).select("id,provider_key").single();
  if (integrationError || !integration) { await admin.from("organizations").delete().eq("id", organization.id); await admin.from("api_consumers").delete().eq("id", consumer.id); return NextResponse.json({ error: integrationError?.message ?? "No se pudo crear la integración" }, { status: 400 }); }
  const token = `rfly_live_${randomBytes(24).toString("base64url")}`;
  const { error: tokenError } = await admin.from("integration_tokens").insert({ integration_id: integration.id, token_prefix: token.slice(0, 18), token_hash: createHash("sha256").update(token).digest("hex"), scopes: ["raffles:read", "raffles:write"] });
  if (tokenError) { await admin.from("integrations").delete().eq("id", integration.id); await admin.from("organizations").delete().eq("id", organization.id); await admin.from("api_consumers").delete().eq("id", consumer.id); return NextResponse.json({ error: tokenError.message }, { status: 400 }); }
  return NextResponse.json({ token, warning: "Guarda este token ahora. No volverá a mostrarse." }, { status: 201 });
}
