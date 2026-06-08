import {
  successEnvelopeSchema,
  tenantAdjustPointsWireSchema,
  tenantCustomerDetailEnvelopeSchema,
  tenantCustomersListSchema,
  tenantCustomersSuccessEnvelopeSchema,
} from "@jubely/api-schemas";
import {
  buildTenantPath,
  jsonPost,
  tenantFetch,
  tenantFetchPaginated,
  tenantGetPath,
  tenantMutate,
  type TenantQueryBase,
} from "./core";

const adjustResultSchema = successEnvelopeSchema(
  tenantAdjustPointsWireSchema
    .extend({
      enrollment_id: tenantCustomersListSchema.shape.customers.element.shape.enrollment_id.optional(),
      balance_after: tenantCustomersListSchema.shape.customers.element.shape.points_balance.optional(),
    })
    .passthrough(),
);

export async function listCustomers(input: TenantQueryBase & { q?: string }) {
  const { data, pagination } = await tenantFetchPaginated(
    tenantGetPath(input.tenantId, "customers", input),
    tenantCustomersSuccessEnvelopeSchema,
  );
  return { customers: data.customers, pagination };
}

export async function getCustomer(tenantId: string, enrollmentId: string) {
  return tenantFetch(
    buildTenantPath(tenantId, `customers/${encodeURIComponent(enrollmentId)}`),
    tenantCustomerDetailEnvelopeSchema,
  );
}

export async function adjustCustomerPoints(
  tenantId: string,
  enrollmentId: string,
  body: { delta: number; reason: string; location_id?: string },
) {
  const payload = tenantAdjustPointsWireSchema.parse(body);
  return tenantMutate(
    buildTenantPath(tenantId, `customers/${encodeURIComponent(enrollmentId)}/adjustments`),
    adjustResultSchema,
    jsonPost(payload),
  );
}
