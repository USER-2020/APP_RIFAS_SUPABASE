import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const admin = createAdminClient();
  const { data: consumer } = await admin.from("api_consumers").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!consumer) return NextResponse.json({ error: "No tienes una cuenta API." }, { status: 404 });
  const { data: integrations } = await admin.from("integrations").select("id").eq("api_consumer_id", consumer.id);
  const integrationIds = (integrations ?? []).map((integration) => integration.id);
  if (!integrationIds.length) return NextResponse.json({ error: "No tienes integraciones." }, { status: 404 });

  const revokedAt = new Date().toISOString();
  const { data: revoked, error } = await admin.from("integration_tokens").update({ revoked_at: revokedAt })
    .eq("id", id).in("integration_id", integrationIds).is("revoked_at", null).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "No se pudo revocar la clave API." }, { status: 400 });
  if (!revoked) return NextResponse.json({ error: "La clave no existe o ya fue revocada." }, { status: 404 });
  return NextResponse.json({ ok: true, revokedAt });
}
