import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({ action: z.enum(["confirm", "release"]), reason: z.string().trim().max(500).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  const { id } = await params;
  const { error } = parsed.data.action === "confirm"
    ? await supabase.rpc("confirm_organization_reservation", { p_reservation_id: id })
    : await supabase.rpc("reject_organization_reservation", { p_reservation_id: id, p_reason: parsed.data.reason || null });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
