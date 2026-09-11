import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const userSchema = z.object({ email: z.string().email(), password: z.string().min(8), fullName: z.string().min(3).max(120) });

export async function POST(request: Request) {
  try {
    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { data: profile } = await sessionClient.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const parsed = userSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Revisa el correo, nombre y contraseña." }, { status: 400 });

    const adminClient = createAdminClient();
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({ email: parsed.data.email, password: parsed.data.password, email_confirm: true });
    if (createError || !created.user) return NextResponse.json({ error: createError?.message ?? "No se pudo crear el usuario." }, { status: 400 });

    const { error: profileError } = await adminClient.from("profiles").insert({ id: created.user.id, full_name: parsed.data.fullName, role: "admin" });
    if (profileError) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: "No se pudo crear el perfil administrativo." }, { status: 500 });
    }

    return NextResponse.json({ id: created.user.id, email: created.user.email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}