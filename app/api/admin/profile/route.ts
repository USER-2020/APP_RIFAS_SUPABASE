import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const profileSchema = z.object({ fullName: z.string().min(3).max(120), email: z.string().email(), password: z.string().optional() });

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success || (parsed.data.password && parsed.data.password.length < 8)) return NextResponse.json({ error: "Nombre, correo o contraseña inválidos." }, { status: 400 });
  const admin = createAdminClient();
  const authUpdate: { email: string; password?: string; email_confirm: boolean } = { email: parsed.data.email, email_confirm: true };
  if (parsed.data.password) authUpdate.password = parsed.data.password;
  const { error: authError } = await admin.auth.admin.updateUserById(user.id, authUpdate);
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
  const { error: profileError } = await admin.from("profiles").update({ full_name: parsed.data.fullName, updated_at: new Date().toISOString() }).eq("id", user.id);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}