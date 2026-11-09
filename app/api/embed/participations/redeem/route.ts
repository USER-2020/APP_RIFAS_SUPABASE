import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { findParticipationToken } from "@/lib/api/participation-token";
import { sendParticipationConfirmationForToken } from "@/lib/email/participation-confirmation-server";

const schema = z.object({ token: z.string(), selectedNumbers: z.array(z.number().int()).min(1).max(100) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos de participación inválidos" }, { status: 400 });
  const token = await findParticipationToken(parsed.data.token);
  if (!token) return NextResponse.json({ error: "El enlace no es válido, venció o ya fue utilizado" }, { status: 401 });
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("redeem_participation_token", { p_token_id: token.id, p_selected_numbers: parsed.data.selectedNumbers });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  const result = (data ?? {}) as { reservation_id?: string; reservation_code?: string; numbers?: number[]; total?: number };
  const confirmationEmail = result.reservation_id && result.reservation_code
    ? await sendParticipationConfirmationForToken({ admin, tokenId: token.id, reservationCode: result.reservation_code, numbers: result.numbers ?? parsed.data.selectedNumbers, total: Number(result.total ?? 0), confirmedAt: new Date().toISOString() })
    : { status: "failed" as const, error: "La confirmación no devolvió los datos de la reserva" };
  return NextResponse.json({ ...result, confirmationEmail: confirmationEmail.status === "sent" ? "sent" : confirmationEmail.status });
}
