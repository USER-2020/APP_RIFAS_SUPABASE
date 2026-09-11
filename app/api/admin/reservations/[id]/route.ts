import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ action: z.enum(["confirm", "release"]), reason: z.string().trim().max(500).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Origen no autorizado" }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión nuevamente" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!z.string().uuid().safeParse(id).success || !parsed.success) return NextResponse.json({ error: "Datos de reserva inválidos" }, { status: 400 });
  const { error } = parsed.data.action === "confirm"
    ? await supabase.rpc("confirm_reservation", { p_reservation_id: id })
    : await supabase.rpc("reject_reservation", { p_reservation_id: id, p_reason: parsed.data.reason || null });
  if (error) return NextResponse.json({ error: error.code === "P0001" ? error.message : "No pudimos actualizar la reserva. Intenta nuevamente." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
