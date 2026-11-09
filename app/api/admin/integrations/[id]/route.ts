import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { data: profile } = await session.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const admin = createAdminClient();
  const { error: integrationError } = await admin.from("integrations").update({ active: false, updated_at: new Date().toISOString() }).eq("id", id);
  if (integrationError) return NextResponse.json({ error: "No se pudo revocar la integración" }, { status: 400 });
  const { error: tokenError } = await admin.from("integration_tokens").update({ revoked_at: new Date().toISOString() }).eq("integration_id", id).is("revoked_at", null);
  if (tokenError) return NextResponse.json({ error: "La integración fue desactivada, pero no se pudieron revocar todos los tokens" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
