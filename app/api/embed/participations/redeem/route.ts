import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { findParticipationToken } from "@/lib/api/participation-token";

const schema = z.object({ token: z.string(), selectedNumbers: z.array(z.number().int()).min(1).max(100) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos de participación inválidos" }, { status: 400 });
  const token = await findParticipationToken(parsed.data.token);
  if (!token) return NextResponse.json({ error: "El enlace no es válido, venció o ya fue utilizado" }, { status: 401 });
  const { data, error } = await createAdminClient().rpc("redeem_participation_token", { p_token_id: token.id, p_selected_numbers: parsed.data.selectedNumbers });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json(data);
}
