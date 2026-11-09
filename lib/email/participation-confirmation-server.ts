import type { SupabaseClient } from "@supabase/supabase-js";
import { sendParticipationConfirmationEmail, type ConfirmationEmailResult } from "./participation-confirmation";

type ConfirmationInput = {
  admin: SupabaseClient;
  tokenId: string;
  reservationCode: string;
  numbers: number[];
  total: number;
  confirmedAt: string;
};

export async function sendParticipationConfirmationForToken(input: ConfirmationInput): Promise<ConfirmationEmailResult> {
  const { admin, tokenId } = input;
  const { data: token, error: tokenError } = await admin.from("participation_tokens")
    .select("id,customer_name,customer_email,raffle_id,confirmation_email_sent_at,confirmation_email_attempted_at")
    .eq("id", tokenId)
    .maybeSingle();
  if (tokenError || !token) return { status: "failed", error: tokenError?.message ?? "No se encontró el token de participación" };

  const { data: raffle } = await admin.from("raffles").select("title").eq("id", token.raffle_id).maybeSingle();
  if (!raffle) return { status: "failed", error: "No se encontró la rifa de la participación" };
  if (token.confirmation_email_sent_at) return { status: "skipped", reason: "already_sent_or_in_progress" };

  const retryBefore = new Date(Date.now() - 60_000).toISOString();
  const { data: claimed } = await admin.from("participation_tokens")
    .update({ confirmation_email_attempted_at: new Date().toISOString(), confirmation_email_last_error: null })
    .eq("id", token.id)
    .is("confirmation_email_sent_at", null)
    .or("confirmation_email_attempted_at.is.null,confirmation_email_attempted_at.lt." + retryBefore)
    .select("id")
    .maybeSingle();
  if (!claimed) return { status: "skipped", reason: "already_sent_or_in_progress" };

  return sendParticipationConfirmationEmail({
    customerName: token.customer_name,
    customerEmail: token.customer_email,
    raffleTitle: raffle.title,
    numbers: input.numbers,
    reservationCode: input.reservationCode,
    confirmedAt: input.confirmedAt,
    total: Number(input.total),
  }, {
    claimSend: async () => true,
    markSent: async () => {
      await admin.from("participation_tokens").update({ confirmation_email_sent_at: new Date().toISOString(), confirmation_email_last_error: null }).eq("id", token.id);
    },
    markFailed: async error => {
      await admin.from("participation_tokens").update({ confirmation_email_last_error: error }).eq("id", token.id);
    },
  });
}
