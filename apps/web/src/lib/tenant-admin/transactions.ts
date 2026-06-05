import { tenantTransactionsSuccessEnvelopeSchema } from "@jubely/api-schemas";
import { tenantFetchPaginated, tenantGetPath, type TenantQueryBase } from "./core";

export async function listTransactions(
  input: TenantQueryBase & { event_type?: string },
) {
  const q = { ...input, event_type: input.event_type };
  const { data, pagination } = await tenantFetchPaginated(
    tenantGetPath(input.tenantId, "transactions", q),
    tenantTransactionsSuccessEnvelopeSchema,
  );
  return { transactions: data.transactions, period: data.period, pagination };
}
