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

export async function getPublicRaffles() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("raffles").select(raffleFields).in("status", ["active", "closed", "finished"]).order("draw_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PublicRaffle[];
}

export async function getPublicRaffleBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("raffles").select(raffleFields).eq("slug", slug).in("status", ["active", "closed", "finished"]).maybeSingle();
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

