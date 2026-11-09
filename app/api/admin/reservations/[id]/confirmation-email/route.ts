import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sendParticipationConfirmationForToken } from "@/lib/email/participation-confirmation-server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();
  const { data: reservation, error } = await admin.from("reservations")
    .select("id,code,total,confirmed_at,participation_token_id")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!reservation?.participation_token_id) return NextResponse.json({ error: "La reserva no tiene una participación de integración" }, { status: 404 });

  const { data: links, error: linksError } = await admin.from("reservation_numbers").select("raffle_number_id").eq("reservation_id", reservation.id);
  if (linksError) return NextResponse.json({ error: linksError.message }, { status: 400 });
  const numberIds = (links ?? []).map(link => link.raffle_number_id);
  const { data: numbers, error: numbersError } = numberIds.length ? await admin.from("raffle_numbers").select("number").in("id", numberIds).order("number") : { data: [], error: null };
  if (numbersError) return NextResponse.json({ error: numbersError.message }, { status: 400 });

  const result = await sendParticipationConfirmationForToken({
    admin,
    tokenId: reservation.participation_token_id,
    reservationCode: reservation.code,
    numbers: (numbers ?? []).map(number => number.number),
    total: Number(reservation.total),
    confirmedAt: reservation.confirmed_at ?? new Date().toISOString(),
  });
  return NextResponse.json({ confirmationEmail: result.status, error: result.status === "failed" ? result.error : undefined }, { status: result.status === "failed" ? 502 : 200 });
}
