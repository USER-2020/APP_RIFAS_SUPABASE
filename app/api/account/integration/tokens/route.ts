import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const admin = createAdminClient();
  const { data: consumer } = await admin.from("api_consumers").select("id").eq("owner_user_id", user.id).eq("active", true).maybeSingle();
  if (!consumer) return NextResponse.json({ error: "No tienes una cuenta API activa." }, { status: 404 });
  const { data: integration } = await admin.from("integrations").select("id").eq("api_consumer_id", consumer.id).eq("active", true).maybeSingle();
  if (!integration) return NextResponse.json({ error: "No tienes una integración activa." }, { status: 404 });

  // The prefix constraint allows only alphanumeric characters after rfly_live_.
  const token = `rfly_live_${randomBytes(24).toString("hex")}`;
  const { data: tokenRecord, error } = await admin.from("integration_tokens").insert({
    integration_id: integration.id,
    token_prefix: token.slice(0, 18),
    token_hash: createHash("sha256").update(token).digest("hex"),
    scopes: ["raffles:read", "raffles:write"],
  }).select("id,token_prefix,scopes,expires_at,revoked_at,last_used_at,created_at").single();
  if (error || !tokenRecord) return NextResponse.json({ error: "No se pudo crear la clave API." }, { status: 400 });
  return NextResponse.json({ token, tokenRecord, warning: "Guarda esta clave ahora. No volverá a mostrarse." }, { status: 201 });
}
