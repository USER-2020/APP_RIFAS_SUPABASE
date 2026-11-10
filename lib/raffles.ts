import { createClient } from "@/lib/supabase/server";
export { date, money } from "@/lib/format";

export type PublicRaffle = {
  id: string;
  title: string;
  slug: string;
  description: string;
  prize_name: string;
  price_per_number: number;
  number_start: number;
  number_end: number;
  sales_close_at: string;
  draw_at: string;
  draw_method: string;
  status: "active" | "closed" | "finished";
  image_path: string | null;
  is_featured: boolean;
};

const raffleFields = "id,title,slug,description,prize_name,price_per_number,number_start,number_end,sales_close_at,draw_at,draw_method,status,image_path,is_featured";

// REM may append the raffle UUID to the public slug. Keep the canonical slug
// in the database while accepting both URL formats at the public routes.
export function normalizeRaffleSlug(value: string) {
  return value.replace(/-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "");
}

export async function getPublicRaffles() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("raffles").select(raffleFields).eq("status", "active").order("draw_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PublicRaffle[];
}

export async function getPublicRaffleBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("raffles").select(raffleFields).eq("slug", normalizeRaffleSlug(slug)).in("status", ["active", "closed", "finished"]).maybeSingle();
  if (error || !data) return null;
  return data as PublicRaffle;
}

export async function getPublicRaffleById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("raffles").select(raffleFields).eq("id", id).in("status", ["active", "closed", "finished"]).maybeSingle();
  if (error || !data) return null;
  return data as PublicRaffle;
}
export const publicImageUrl = (path: string | null) => path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/raffles/${path}` : null;

