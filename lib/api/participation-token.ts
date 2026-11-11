import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { raffleSlugCandidates } from "@/lib/raffles";

export function hashParticipationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function findParticipationToken(rawToken: string, raffleSlug?: string) {
  if (!/^rfly_claim_[A-Za-z0-9]{32,}$/.test(rawToken)) return null;
  const admin = createAdminClient();
  let query = admin.from("participation_tokens").select("id,raffle_id,integration_id,external_purchase_id,external_user_id,customer_name,customer_email,customer_phone,allowed_numbers,status,expires_at,raffles!inner(id,slug,title,status,sales_close_at)").eq("token_hash", hashParticipationToken(rawToken));
  if (raffleSlug) query = query.in("raffles.slug", raffleSlugCandidates(raffleSlug));
  const { data } = await query.maybeSingle();
  if (!data) return null;
  const raffle = Array.isArray(data.raffles) ? data.raffles[0] : data.raffles;
  if (!raffle || !data.integration_id || data.status !== "active" || new Date(data.expires_at) <= new Date() || raffle.status !== "active" || new Date(raffle.sales_close_at) <= new Date()) return null;
  await admin.from("participation_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return { ...data, raffle };
}
