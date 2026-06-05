import {
  createInvitationSuccessEnvelopeSchema,
  tenantAgentsSuccessEnvelopeSchema,
  tenantCreateInvitationWireSchema,
} from "@jubely/api-schemas";
import {
  buildTenantPath,
  jsonPost,
  tenantFetchPaginated,
  tenantGetPath,
  tenantMutate,
  type TenantQueryBase,
} from "./core";

export async function listAgents(input: TenantQueryBase) {
  const { data, pagination } = await tenantFetchPaginated(
    tenantGetPath(input.tenantId, "agents", input),
    tenantAgentsSuccessEnvelopeSchema,
  );
  return { agents: data.agents, pagination };
}

export async function createInvitation(tenantId: string, body: { email: string; role?: string }) {
  const payload = tenantCreateInvitationWireSchema.parse(body);
  return tenantMutate(
    buildTenantPath(tenantId, "invitations"),
    createInvitationSuccessEnvelopeSchema,
    jsonPost(payload),
  );
}
