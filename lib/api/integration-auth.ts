import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type IntegrationContext = {
  tokenId: string;
  integrationId: string;
  organizationId: string;
  scopes: string[];
};

export async function authenticateIntegration(request: Request, requiredScope?: string) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(rfly_live_[A-Za-z0-9]{32,})$/);
  if (!match) return { error: "Token de integración inválido", status: 401 as const };

  const tokenHash = createHash("sha256").update(match[1]).digest("hex");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("integration_tokens")
    .select("id,scopes,expires_at,revoked_at,integrations!inner(id,organization_id,active)")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) return { error: "Token de integración inválido", status: 401 as const };
  const integration = Array.isArray(data.integrations) ? data.integrations[0] : data.integrations;
  if (!integration?.active || data.revoked_at || (data.expires_at && new Date(data.expires_at) <= new Date())) {
    return { error: "Token de integración revocado o vencido", status: 401 as const };
  }

  const scopes = data.scopes ?? [];
  if (requiredScope && !scopes.includes(requiredScope)) return { error: "El token no tiene este permiso", status: 403 as const };

  await admin.from("integration_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return { context: { tokenId: data.id, integrationId: integration.id, organizationId: integration.organization_id, scopes } satisfies IntegrationContext };
}
