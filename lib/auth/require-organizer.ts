import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function requireOrganizer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/cuenta/login");

  const admin = createAdminClient();
  const { data: consumer } = await admin.from("api_consumers").select("id,name,email,owner_user_id").eq("owner_user_id", user.id).maybeSingle();
  if (!consumer) redirect("/cuenta/integraciones");
  const { data: integration } = await admin.from("api_integrations").select("id,name,organization_id").eq("consumer_id", consumer.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!integration?.organization_id) redirect("/cuenta/integraciones");
  const { data: organization } = await admin.from("organizations").select("id,name,slug").eq("id", integration.organization_id).maybeSingle();
  if (!organization) redirect("/cuenta/integraciones");
  return { user, admin, consumer, integration, organization };
}
