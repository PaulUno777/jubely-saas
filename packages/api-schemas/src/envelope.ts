import { z } from "zod";

export const apiMetaSchema = z
  .object({
    request_id: z.string().optional(),
    locale: z.string().optional(),
    pagination: z
      .object({
        limit: z.number(),
        offset: z.number(),
        total: z.number(),
      })
      .optional(),
  })
  .passthrough();

export const apiErrorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export const apiErrorEnvelopeSchema = z.object({
  error: apiErrorBodySchema,
  meta: apiMetaSchema.optional(),
});

export function successEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: apiMetaSchema.optional(),
  });
}

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
