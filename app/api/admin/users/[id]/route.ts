import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const updateSchema = z.object({ fullName: z.string().min(3).max(120), email: z.string().email(), password: z.string().optional() });

async function authorize() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, authorized: false };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, user, authorized: profile?.role === "admin" };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, authorized } = await authorize(); const { id } = await params;
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!authorized) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success || (parsed.data.password && parsed.data.password.length < 8)) return NextResponse.json({ error: "Datos inválidos. La contraseña debe tener 8 caracteres." }, { status: 400 });
  const admin = createAdminClient(); const authUpdate: { email: string; email_confirm: boolean; password?: string } = { email: parsed.data.email, email_confirm: true }; if (parsed.data.password) authUpdate.password = parsed.data.password;
  const { error: authError } = await admin.auth.admin.updateUserById(id, authUpdate); if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
  const { error } = await admin.from("profiles").update({ full_name: parsed.data.fullName, updated_at: new Date().toISOString() }).eq("id", id); if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, authorized } = await authorize(); const { id } = await params;
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!authorized) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (user.id === id) return NextResponse.json({ error: "No puedes eliminar tu propio usuario." }, { status: 400 });
  const { error } = await createAdminClient().auth.admin.deleteUser(id); if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}